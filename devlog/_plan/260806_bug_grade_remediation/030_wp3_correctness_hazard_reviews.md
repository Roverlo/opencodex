# 030 — wp3: correctness-hazard reviews (#1036, #1068)

Both PRs remove or bypass a protection while fixing something else. Unlike wp2
these are not policy disagreements — they are regressions with a nameable victim.

## #1036 — Cursor structured edit → apply_patch

The gap is real: the Cursor route advertises freeform `apply_patch`
(`src/adapters/cursor/tool-definitions.ts:135-141`) and dev has no structured-edit
translation (`src/adapters/cursor/protobuf-events.ts:314-348`), which is #1017.

The hazard is that provenance is inferred from the tool NAME alone. The PR's own
`cursorStructuredEditTools` takes care not to shadow a real client tool called
`edit_file` or `multi_edit` — so the PR already knows the collision is possible —
but the translator then converts every call bearing those names.

Scenario to state concretely: a user runs an MCP server exposing `edit_file`.
Their call is silently reinterpreted as a Codex `apply_patch`, so the edit either
lands somewhere unintended or fails with a patch error that names nothing the
user recognizes. The existing tests only exercise synthetic calls, so they give
confidence that this cannot happen while it can.

Required change: tag synthetic tools at injection time and convert only calls
carrying that tag; add a regression test where a client tool named `edit_file`
passes through untranslated. The prior CHANGES_REQUESTED review already raised
synthetic-tool provenance — this is the same finding with a reproduction, so the
comment should reference it rather than restate it as new.

## #1068 — DeepSeek reasoning replay for opencode-zen

The replay gap is real: `opencode-zen` lacks `preserveReasoningContentModels`
while comparable OpenCode routes have it (`src/providers/registry.ts:1753-1762`),
and that is #994's shape.

Two regressions in the diff:

1. It replaces `noVisionModels` with a DeepSeek-only list, dropping
   `OPENCODE_ZEN_TEXT_ONLY_MODELS` (`src/providers/registry.ts:372-379`), which
   currently protects six models — `big-pickle`, `nemotron-3-ultra-free`,
   `ling-3.0-flash-free`, `north-mini-code-free`, `laguna-s-2.1-free`,
   `deepseek-v4-flash-free`. Five of those would start receiving images again.
   That list was derived from a probe recorded in
   `devlog/_plan/260805_bug_fix_stack/002_zen_modality_probe.md`, so it is
   evidence, not a guess. Deleting it re-opens #1043.
2. It uses generic DeepSeek effort constants that `v2.10.2` replaced with
   per-model ladders (`:380-434`, shipped for #1057), so a rebase either conflicts
   or advertises the wrong tier.

Required change: rebase onto dev, keep the full text-only list and add the
DeepSeek replay metadata alongside it, and use `deepseekThinkingEffortsFor` /
`deepseekReasoningMapFor`.

**Correction, from the plan audit.** An earlier draft of this doc told the review
to call #1068's failing `enforce-target` check substantive. That is wrong and must
not be written to the author. The current run fails inside the gate script itself
with `TypeError: parseGateState is not a function` — a repository-side gate
defect, not a verdict on this PR's code
(run 31081544753, job 92551264534). Contrast #978, whose failure IS a stale
checkout missing `.github/scripts/pr-quality-state.cjs`.

The mechanism is known and already documented in-tree: the workflow's checkout
pins the BASE sha while the event loads the workflow YAML from the HEAD branch,
so a stale head's YAML calls into base scripts that do not export what it expects
— `parseGateState` is required at `.github/workflows/enforce-pr-target.yml:63`
and does exist and is exported on dev
(`.github/scripts/pr-quality-state.cjs:84,380`). The repository even carries a
regression test naming this exact crash string as the reason review events are
excluded (`.github/scripts/enforce-pr-target.test.cjs:51-60`).

That makes both #1068 and #978 the same root cause with two symptoms: a stale
head against moved gate scripts. It is a staleness artifact, not a verdict on
either diff.

So the review states the observable gate error, tells the author not to chase it,
and asks for a rebase onto current dev — after which the real question (the Zen
regression above) can be re-evaluated on a clean run. Blaming a contributor for a
gate artifact would be both wrong and corrosive.

## Deliverable

Two posted PR comments, English, each with the concrete victim of the regression
and the minimal change that keeps the fix.

## Accept criteria

- Both comment URLs captured.
- The #1068 comment names the protected models explicitly.
- The #1036 comment references the existing review rather than duplicating it.
