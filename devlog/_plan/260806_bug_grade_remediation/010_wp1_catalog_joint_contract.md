# 010 — wp1: routed-catalog reasoning joint contract (#1100)

## Defect being pinned

A routed catalog row can advertise `supported_reasoning_levels` while
`supports_reasoning_summaries` is `false`. Codex gates construction of the whole
Responses `reasoning` object on that flag, so Desktop renders the effort picker
and the wire carries nothing (#1100, upstream `openai/codex#30697`).

Measured on this tree, no network:

```
plain/ladder-model  levels=[low,high,max,ultra] summaries=false
optin/ladder-model  levels=[low,high,max,ultra] summaries=true
```

Two facts follow, and they are the whole design of this phase:

1. The escape hatch exists and works. `modelSupportsReasoningSummaries`
   resolves at `src/codex/catalog/provider-fetch.ts:545` and reaches the entry
   through `applyCatalogModelMetadata` (`src/codex/catalog/effort.ts:139-141`).
2. It works **only because of call ordering**, and only on one of two paths.
   The template path in `src/codex/catalog/sync.ts` runs `applyReasoningLevels`
   (`:266`), then `normalizeRoutedCatalogEntry` (`:267`, which deletes the flag),
   then `applyJawcodeCatalogMetadata` (`:268`), then `applyCatalogModelMetadata`
   (`:269`, which restores it). Swap the strip past the restore and every
   opted-in provider silently loses effort propagation.

   The **no-template fallback** (`:291-310`) never calls
   `normalizeRoutedCatalogEntry` at all, so the opt-in survives there
   unconditionally. That asymmetry is why the test below must drive the template
   path: a fallback-only test cannot observe the strip, and would pass under the
   very reordering it claims to guard.

Nothing in `tests/` asserts that ordering. `tests/codex-catalog.test.ts:2350` and
`:2387` assert `false` and `true` propagate, but neither pins the interaction
with the routed strip — both call `buildCatalogEntries(null, ...)`, i.e. the
fallback — so both keep passing under the broken order. That is precisely the
coverage gap this phase closes.

## What this phase does NOT do

It does not default routed rows to `supports_reasoning_summaries: true`. The
comment at `src/codex/catalog/parsing.ts:352` refuses to advertise OpenAI-only
summary delivery for arbitrary providers, and that refusal is correct — it is the
same principle that blocks #1092 and #978. This phase pins the contract that
exists; it does not widen a capability claim.

## Scope

IN: `tests/codex-catalog.test.ts` (MODIFY, append three tests).
OUT: any `src/` change; the default flag value; the upstream Codex gate.

## Change map

### MODIFY `tests/codex-catalog.test.ts`

Append after the existing `#538` summary-delivery test (currently ending at
`:2389`), inside the same `describe`. `nativeTemplate()` is the existing helper
at `tests/codex-catalog.test.ts:937`; `buildCatalogEntries` and
`gatherRoutedModels` are already imported at `:5` and `:37`.

```ts
  test("routed strip does not defeat an explicit reasoning-summary opt-in (#1100)", async () => {
    const models = await gatherRoutedModels({
      providers: {
        ladder: {
          adapter: "openai-responses",
          baseUrl: "https://ladder.example.test/v1",
          authMode: "key",
          liveModels: false,
          models: ["effort-model"],
          modelReasoningEfforts: { "effort-model": ["low", "high", "max"] },
          modelSupportsReasoningSummaries: { "effort-model": true },
        },
      },
    });
    // MUST use a template: buildCatalogEntries(null, ...) takes the fallback
    // branch (src/codex/catalog/sync.ts:291-310), which never runs the routed
    // strip, so a null-template assertion cannot detect a reordering regression.
    const entries = buildCatalogEntries(nativeTemplate(), [], models);
    const routed = entries.find(e => e.slug === "ladder/effort-model");

    // The ladder is advertised...
    expect((routed?.supported_reasoning_levels as { effort: string }[]).map(l => l.effort))
      .toEqual(expect.arrayContaining(["low", "high", "max"]));
    // ...and the opt-in survives normalizeRoutedCatalogEntry's delete, because
    // applyCatalogModelMetadata runs after it (src/codex/catalog/sync.ts:266-269).
    // If that order is ever swapped, Codex stops emitting reasoning.effort for
    // every opted-in routed provider (#1100).
    expect(routed?.supports_reasoning_summaries).toBe(true);
  });

  test("routed rows without an opt-in stay conservative about summaries (#1100)", async () => {
    const models = await gatherRoutedModels({
      providers: {
        plain: {
          adapter: "openai-responses",
          baseUrl: "https://plain.example.test/v1",
          authMode: "key",
          liveModels: false,
          models: ["effort-model"],
          modelReasoningEfforts: { "effort-model": ["low", "high", "max"] },
        },
      },
    });
    const entries = buildCatalogEntries(nativeTemplate(), [], models);
    const routed = entries.find(e => e.slug === "plain/effort-model");

    // Deliberate: we do not claim OpenAI-only summary delivery for an arbitrary
    // provider just because it has an effort ladder. The consequence is #1100,
    // and the supported remedy is the per-model opt-in asserted above.
    expect(routed?.supports_reasoning_summaries).toBe(false);
  });

  test("the no-template fallback never applies the routed summary strip (#1100)", async () => {
    const models = await gatherRoutedModels({
      providers: {
        ladder: {
          adapter: "openai-responses",
          baseUrl: "https://ladder.example.test/v1",
          authMode: "key",
          liveModels: false,
          models: ["effort-model"],
          modelReasoningEfforts: { "effort-model": ["low", "high", "max"] },
          modelSupportsReasoningSummaries: { "effort-model": true },
        },
      },
    });
    // Pins the asymmetry itself: the fallback path (sync.ts:291-310) skips
    // normalizeRoutedCatalogEntry, so this row is opt-in-true for a different
    // reason than the template row above. Documented so a future unification of
    // the two paths is a deliberate change rather than a silent one.
    const routed = buildCatalogEntries(null, [], models).find(e => e.slug === "ladder/effort-model");
    expect(routed?.supports_reasoning_summaries).toBe(true);
  });
```

The second test documents the trade-off rather than asserting it is desirable —
it is the row that makes a future default flip a deliberate, visible decision
instead of an accident.

## Red ablation (mandatory)

In `src/codex/catalog/sync.ts`, move the strip after the metadata restore so it
runs last on the template path:

```
-      normalizeRoutedCatalogEntry(e, model?.parallelToolCalls === true);
-      if (model) applyJawcodeCatalogMetadata(e, model.provider, model.id, model.contextCap);
-      applyCatalogModelMetadata(e, model);
+      if (model) applyJawcodeCatalogMetadata(e, model.provider, model.id, model.contextCap);
+      applyCatalogModelMetadata(e, model);
+      normalizeRoutedCatalogEntry(e, model?.parallelToolCalls === true);
```

Expected: the template opt-in test FAILS (`expected true, received false`); the
conservative test and the fallback test still pass — the fallback test staying
green is itself the proof that the template test is the one carrying the
contract. Restore, and all three pass. Record both outputs verbatim.

If the opt-in test does NOT go red under this edit, the test is vacuous and must
not be committed.

### Executed result

Run on the landed tests, `bun test tests/codex-catalog.test.ts -t "1100"`:

```
=== ABLATION APPLIED: strip moved after metadata restore ===
error: expect(received).toBe(expected)
Expected: true
Received: false
(fail) routed strip does not defeat an explicit reasoning-summary opt-in (#1100)
(pass) routed rows without an opt-in stay conservative about summaries (#1100)
(pass) the no-template fallback never applies the routed summary strip (#1100)
 2 pass, 1 fail
```

Exactly the predicted shape: only the template opt-in test goes red, and the
fallback test stays green in the same run — which is what proves the template
test is the one carrying the contract. After `git checkout -- src/codex/catalog/sync.ts`
the `src/` diff is empty and the file is back to 122 pass / 0 fail.

## Verification

- `bun test tests/codex-catalog.test.ts` — 119 baseline + 3 new, 0 fail.
- `bun run typecheck` — clean.
- Ablation output recorded above.

## Accept criteria

- All three tests present and passing.
- Ablation shows the TEMPLATE opt-in test genuinely red before restore, with the
  fallback test still green in the same run.
- No `src/` file modified in the committed result.
