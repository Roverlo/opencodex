# 020 — s2: combo picker (#1092) — ABSORB WITHDRAWN, author fixed it

> **Status: this layer is not being authored.** eachann1024 pushed at
> 2026-08-06T09:48Z, minutes after our review, and restored the fail-closed guard
> in `src/combos/request.ts` with a comment that keeps `unknown` distinct in the
> debug record — exactly what the review asked for. Absorbing that would be taking
> the author's response to our own request. The analysis below stands as the
> record; the deliverable is a re-review.

## What the contributor got right — more than the review credited

eachann1024 found the UI bug: `intersectComboEfforts`
(`gui/src/combo-workspace-data.ts:11`) maps an unknown ladder to `[]`, and an
empty member wipes the intersection, so ONE undiscovered target empties the whole
picker and the user cannot select an effort they are entitled to.

Re-reading the diff for this layer turned up something the review missed and that
changes the shape of this correction: **they already built the honest UI.** The PR
adds `comboHasUnknownEffortTargets`, threads `hasUnknownTargets` into
`EffortSelect` from both the add-modal (`:45`) and the detail panel (`:63`), marks
the options, and adds a notice with copy that says out loud:

> Some targets have no catalog effort ladder. Options stay selectable, but
> runtime omits the default for those unknown targets (fails closed).

That copy describes exactly the behavior we want. The author understood the
trade-off and told the user about it — and then reversed the runtime guard anyway,
which made their own notice inaccurate.

So this correction is smaller than "rewrite it": keep their UI work almost
wholesale, drop the runtime hunk, and the notice becomes true.

## The one decision to correct

`src/combos/request.ts:43` on `dev` fails closed for BOTH unknown and unsupported,
and records which one it was:

```ts
capability: targetReasoningEfforts === undefined ? "unknown" : "unsupported",
```

The PR skips the guard when the ladder is `undefined` and hardcodes the field to
`"unsupported"`, so we start sending an effort to targets we know nothing about
and simultaneously lose the signal that would tell us how often that happens.
**We keep `src/combos/request.ts` exactly as it is on `dev`.**

## A second, subtler correction

The PR's intersection skips on `listed.length === 0` as well as `undefined`. That
conflates "we have no metadata" with "the provider advertises no efforts" — a
*known* empty ladder is information and must still constrain the intersection.
Our version skips only `undefined`.

## Change map

### MODIFY `gui/src/combo-workspace-data.ts`

```ts
   for (const target of complete) {
     const key = `${target.provider.trim()}/${target.model.trim()}`;
     const listed = modelEfforts.get(key);
-    // Missing metadata must not invent a full ladder — runtime omits the combo default when
-    // supportedLadderFor is undefined (#488 / Codex review).
-    const member: string[] = listed === undefined
-      ? []
-      : listed.filter((effort) => effortSet.has(effort));
+    // Unknown ladder (`undefined`) is a WILDCARD for the picker only: it must not empty the
+    // selectable set, because one undiscovered member would otherwise hide efforts the other
+    // members genuinely support (#1092). This does NOT relax the runtime contract — the combo
+    // default is still omitted for an unknown target at request time (src/combos/request.ts:43),
+    // and the picker says so. A KNOWN-but-empty ladder is information, not absence, so it still
+    // constrains the intersection.
+    if (listed === undefined) continue;
+    const member = listed.filter((effort) => effortSet.has(effort));
     if (common === null) {
       common = member;
     } else {
       const memberSet = new Set(member);
       common = common.filter((effort) => memberSet.has(effort));
     }
   }
-  const commonSet = new Set(common ?? []);
+  // Every member unknown → nothing constrained the ladder → offer all of it.
+  if (common === null) return [...COMBO_EFFORTS];
+  const commonSet = new Set(common);
   return COMBO_EFFORTS.filter((effort) => commonSet.has(effort));
```

Also add the small predicate the UI needs:

```ts
/** True when any complete target has no catalog effort ladder (picker shows a fail-closed notice). */
export function comboHasUnknownEffortTargets(
  targets: readonly ComboTarget[],
  modelEfforts: ReadonlyMap<string, readonly string[] | undefined>,
): boolean {
  return targets
    .filter((t) => t.provider.trim() && t.model.trim())
    .some((t) => modelEfforts.get(`${t.provider.trim()}/${t.model.trim()}`) === undefined);
}
```

### MODIFY the three GUI files

Take the PR's `hasUnknownTargets` threading as-is:
`gui/src/components/combo-workspace-controls.tsx` (prop + the notice after the
existing unsupported-effort notice at `:77`),
`combo-workspace-add-modal.tsx:45`, `combo-workspace-detail-panel.tsx:63`.

**Take the notice, drop the per-option suffix.** Appending `(unknown targets)` to
every option makes a five-item dropdown noisy for a condition that applies to the
combo, not to each effort. One line under the picker says it once.

### MODIFY locales (6 files)

Only the two keys this layer needs — `cws.field.defaultEffortUnknown` and the
amended `cws.field.defaultEffortHint`. The PR's other keys (`cws.copyPublicModel`,
`cws.capabilities`, image-capability copy…) belong to unrelated features in the
same PR and are out of scope here.

### MODIFY `tests/combo-workspace-data.test.ts`

Replace `intersectComboEfforts treats unknown members as having no selectable
efforts` (its premise is the bug) with:

1. unknown member does not empty a known intersection;
2. all-unknown returns the full ladder;
3. **known-but-empty ladder still empties the intersection** — the case the PR's
   version gets wrong;
4. `comboHasUnknownEffortTargets` true/false.

### NEW test in `tests/combos.test.ts` (or nearest runtime combo test)

The load-bearing one: with an `undefined` ladder, `concreteComboRequestBody` still
omits `reasoning.effort`. This is what makes the picker notice truthful and what
would fail if someone re-applies the PR's runtime hunk.

## Red ablation

Apply the PR's runtime change to `src/combos/request.ts` (skip the guard when
`undefined`). The new runtime test must fail with an injected effort present.
Restore, it passes.

## Verification

- `bun test tests/combo-workspace-data.test.ts`
- `bun test tests/combos.test.ts`
- `bun run lint:gui`, `bun run typecheck`
- GUI screenshot required by `enforce-target` (title/description mentions gui).

## Accept criteria

*(superseded — see below)*

## Revised deliverable: re-review, not absorb

On the current head (`0f9c7a042`) the runtime guard reads:

```ts
  // Fail closed for both unknown (`undefined`) and known-but-missing ladders.
  // Unknown is kept distinct in debug so we can measure thin catalog rows without
  // guessing the provider accepts a reasoning field.
  if (!targetReasoningEfforts?.includes(defaultEffort)) {
```

That is the dev behavior restored, with the reasoning written down. Say so
plainly — an author who turns a review around in ten minutes should hear that it
landed, not silence.

Two things still worth raising, neither blocking:

1. **`imageInput` is unrelated scope.** The PR now also adds a combo
   `imageInput: "auto" | "disabled"` field with validation, plus public-model
   copy/preview UI and locale keys for both. That is a separate feature sharing a
   branch with an effort-picker bug fix. Ask for a split so the picker fix can be
   reviewed and land on its own.
2. **The known-but-empty case.** Verify the intersection still lets a *known*
   empty ladder constrain the result — skipping on `listed.length === 0` as well
   as `undefined` would conflate "provider advertises nothing" with "we have no
   metadata", which is the same conflation the runtime guard just refused.

No close. The PR stays theirs.

## Executed

Comment `5203708625`. Credits the sub-30-minute turnaround explicitly (review
09:09:51Z → commits 09:38:19Z), quotes the restored guard including the comment
keeping `unknown` distinct in debug, and notes the GUI notice copy was theirs
rather than ours. Two asks, neither blocking: split the unrelated `imageInput`
scope, and double-check that a *known but empty* ladder still constrains the
intersection.

PR remains OPEN. Nothing absorbed, nothing closed.
