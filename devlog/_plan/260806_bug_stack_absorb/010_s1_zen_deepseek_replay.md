# 010 — s1: Zen DeepSeek replay (#1068) — no absorb; the head has a failing test

> **Status: not authored — re-review instead.** Two corrections happened here and
> both matter.
>
> A first version of this banner said the author fixed it in response to our
> review. That was wrong: their commits landed at **08:52:23Z**, our review at
> **09:13:15Z**. The mistake came from reading `updatedAt`, which moves when *we*
> comment — so it can never show author activity. Always compare LAST COMMIT time
> against REVIEW time.
>
> The head does keep `noVisionModels: OPENCODE_ZEN_TEXT_ONLY_MODELS`, so the
> destructive replacement our review flagged is not in the current diff. But that
> is not agreement with the review; it is the state the branch was already in, and
> it now sits inconsistently against the tests the same commit added. That
> inconsistency is the finding below.
>
> We do not absorb this. It is inside the response window and the remaining work
> is a review conversation, not a takeover.

## What the contributor got right

justjxke diagnosed #994 correctly. `opencode-zen` and `opencode-free` reach the
SAME gateway (`https://opencode.ai/zen/v1`), and DeepSeek thinking mode requires
the assistant's original `reasoning_content` to be replayed on tool-call
continuations or the gateway answers 400. `opencode-free` carries that metadata;
`opencode-zen` does not. That asymmetry is the bug, and finding it was the work.

## The one decision to correct

The PR sets `noVisionModels` to the DeepSeek list, **replacing**
`OPENCODE_ZEN_TEXT_ONLY_MODELS` rather than extending it. Set arithmetic on the
real constants:

```
dev:   big-pickle, nemotron-3-ultra-free, ling-3.0-flash-free,
       north-mini-code-free, laguna-s-2.1-free, deepseek-v4-flash-free
PR:    deepseek-v4-pro, deepseek-v4-flash, deepseek-v4-flash-free
lost:  big-pickle, nemotron-3-ultra-free, ling-3.0-flash-free,
       north-mini-code-free, laguna-s-2.1-free
```

Five models stop being marked text-only, so the proxy resumes forwarding image
parts and the gateway 400s the request — reopening #1043. `deepseek-v4-flash-free`
sits in both sets, which is almost certainly why the replacement looked safe.

Second correction: the branch predates the per-model DeepSeek ladders that
shipped for #1057 in v2.10.2. `dev` now has `deepseekThinkingEffortsFor` and
`deepseekReasoningMapFor` (`src/providers/registry.ts:431,433`) because Flash and
Pro honor different tiers; a single shared array advertises the wrong ladder.

## Reference implementation already in the tree

`opencode-free` (`src/providers/registry.ts:1765-1781`) is exactly the shape we
need, on the same gateway:

```ts
modelReasoningEfforts: Object.fromEntries(OPENCODE_FREE_DEEPSEEK_MODELS.map(id => [id, deepseekThinkingEffortsFor(id)])),
modelReasoningEffortMap: Object.fromEntries(OPENCODE_FREE_DEEPSEEK_MODELS.map(id => [id, deepseekReasoningMapFor(id)])),
preserveReasoningContentModels: OPENCODE_FREE_DEEPSEEK_MODELS,
```

So the corrected layer is: copy that pattern to `opencode-zen`, cover both the
`opencode-zen`-visible DeepSeek ids, and UNION the vision list instead of
replacing it.

## Change map

### MODIFY `src/providers/registry.ts`

The `opencode-zen` entry (currently at `:1753-1762`) becomes:

```ts
  {
    id: "opencode-zen", label: "opencode zen", baseUrl: "https://opencode.ai/zen/v1",
    adapter: "openai-chat", authKind: "key", dashboardUrl: "https://opencode.ai/auth",
    // Same opencode.ai/zen/v1 gateway as `opencode-free`: DeepSeek thinking mode requires the
    // assistant's original reasoning_content to be replayed on tool-call continuations, or the
    // gateway answers 400 (#994). Mirror the free tier's DeepSeek metadata; the ladders are
    // per-model because Flash and Pro honor different tiers (#1057).
    modelReasoningEfforts: Object.fromEntries(
      ZEN_DEEPSEEK_MODELS.map(id => [id, deepseekThinkingEffortsFor(id)]),
    ),
    modelReasoningEffortMap: Object.fromEntries(
      ZEN_DEEPSEEK_MODELS.map(id => [id, deepseekReasoningMapFor(id)]),
    ),
    preserveReasoningContentModels: ZEN_DEEPSEEK_MODELS,
    // #1043: without this the proxy forwards image parts to text-only Zen models and
    // the upstream rejects the whole request with a 400. The DeepSeek entries are
    // UNIONED in, not substituted — dropping the probed list would re-open #1043 for
    // five other models (see devlog/_plan/260806_bug_stack_absorb/010).
    noVisionModels: OPENCODE_ZEN_TEXT_ONLY_MODELS,
  },
```

with a new constant beside the existing DeepSeek lists (near `:350`):

```ts
/** DeepSeek thinking models reachable through the Zen gateway (keyed + free tiers). */
const ZEN_DEEPSEEK_MODELS = [...DEEPSEEK_THINKING_MODELS, ...OPENCODE_FREE_DEEPSEEK_MODELS];
```

`deepseek-v4-flash-free` is already in `OPENCODE_ZEN_TEXT_ONLY_MODELS`, so the
vision list needs no change at all — that is the point. The union is achieved by
*not touching* `noVisionModels`.

### NEW `tests/opencode-zen-deepseek-replay.test.ts`

Three assertions:

1. every id in `ZEN_DEEPSEEK_MODELS` appears in the `opencode-zen`
   `preserveReasoningContentModels`;
2. the per-model ladder for `deepseek-v4-flash` differs from `deepseek-v4-pro`
   (proves the helpers are used rather than a shared array);
3. **the regression guard** — all six `OPENCODE_ZEN_TEXT_ONLY_MODELS` are still in
   `opencode-zen.noVisionModels`, named individually so a future replacement
   fails loudly with the missing model in the message.

## Red ablation

Replace `noVisionModels: OPENCODE_ZEN_TEXT_ONLY_MODELS` with
`noVisionModels: ZEN_DEEPSEEK_MODELS` — i.e. reproduce the contributor's exact
edit. Assertion 3 must fail naming `big-pickle`; assertions 1 and 2 stay green.
Restore, all three pass.

If assertion 3 does not go red under that edit it is vacuous and must not ship.

## Verification

- `bun test tests/opencode-zen-deepseek-replay.test.ts`
- `bun test tests/provider-registry-parity.test.ts` (existing negative assertion
  for `mimo-v2.5-free` must stay green — the union must not add it)
- `bun run typecheck`

## Accept criteria

*(superseded — see below)*

## Revised deliverable: re-review, not absorb

1. Verify on the CURRENT head (`ac63b73a5`) that the vision list is restored and
   the per-model DeepSeek helpers are used rather than the obsolete generic
   constants.
2. **The head's new test fails by construction — this is the load-bearing finding.**
   The new test asserts `deepseek-v4-pro`, `deepseek-v4-flash` and
   `deepseek-v4-flash-free` are all in `opencode-zen.noVisionModels`, while the
   entry sets `noVisionModels: OPENCODE_ZEN_TEXT_ONLY_MODELS` — a list containing
   only the `-free` one of those three
   (`src/providers/registry.ts:350-379,1753-1762`). Routing merges the registry
   list (`src/router.ts:254-282`), so the assertion cannot hold for Pro and Flash.

   Reproduced locally with the test's own `routeModel` configuration:

   ```
   deepseek-v4-flash-free: inNoVision=true
   deepseek-v4-flash:      inNoVision=false
   deepseek-v4-pro:        inNoVision=false
   ```

   So two of the three parameterized cases fail. It is latent rather than
   reported because no GitHub check currently runs that suite on this PR — which
   is exactly why the comment should name it rather than wait for CI to.
3. **The underlying question is unmeasured.** Whether Pro and Flash accept images
   through Zen was never probed; the text-only list is a dated exception list from
   a single 2026-08-05 probe, and Zen supplies no modality metadata. So the
   comment asks for the probe or an explicit narrowing of the assertion — the
   author is better placed to run it against their own Zen access than we are.

No close. The PR stays theirs.
