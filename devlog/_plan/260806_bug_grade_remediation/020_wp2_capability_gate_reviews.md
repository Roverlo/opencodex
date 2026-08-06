# 020 — wp2: capability-gate reversal reviews (#1092, #978)

Both PRs fix a real annoyance by deleting the distinction between *unknown* and
*supported*. The reviews must make that shared principle explicit, because each
author will otherwise read the objection as a nitpick about their one file.

## Shared principle to state in both

A configured or advertised effort ladder is a **presentation** contract: it says
what OpenCodex offers a user. It is not evidence that the upstream endpoint
accepts that wire field. Turning presentation into wire behavior is how a 400
reaches a user who changed nothing.

## #1092 — combo default effort

Verified on dev (`src/combos/request.ts:43-55`): when the chosen target does not
advertise the configured default, the effort is omitted and a debug line records
`capability: "unknown" | "unsupported"`. The two states are already distinguished
in the log, which shows the fail-closed behavior is deliberate, not an oversight.

The PR keeps the UI fix (correct: one unknown member should not empty the picker,
`gui/src/combo-workspace-data.ts:11-36`) but also injects the default when the
ladder is `undefined`, and synthesizes absent catalog members with a 128k
context fallback so unknown targets appear usable.

Failure mode to state: a combo containing a target with no discovery metadata can
now save `high` and send `reasoning.effort: "high"` upstream with no evidence the
target accepts a reasoning field at all.

Required change: keep the picker populated, but carry `unknown` as its own state
through to request time — render it (disabled, or labelled "capability unknown")
rather than promoting it to supported, and leave `src/combos/request.ts` omitting
the field until capability is positively established.

## #978 — Google `thinkingLevel`

Verified on dev (`src/adapters/google.ts:313-326`): `thinkingConfig` is emitted
for two direct Flash ids only. The narrow bug is real — `gemini-3.1-pro-preview`
advertises a ladder at `src/providers/registry.ts:1212-1221` and never receives
the field.

The PR replaces the id gate with "any model that has an effort ladder", which
reaches arbitrary custom Google/Vertex-compatible providers a user configured.

Required change: extend the allowlist with the specific models whose acceptance
of `generationConfig.thinkingConfig.thinkingLevel` can be cited, or introduce an
explicit per-model capability flag. The tests prove serialization, which is not
the same as proving upstream acceptance — say so plainly.

Also note the `enforce-target` failure is a stale-checkout mismatch (the run
cannot resolve `.github/scripts/pr-quality-state.cjs`), not the Google change; a
rebase clears it. This is the same root cause as #1068's gate crash — see `030`
— so both comments should describe it the same way rather than inventing two
different explanations for one artifact.

## Deliverable

Two posted PR comments, English, each naming the dev-side fail-closed line, the
concrete failure mode, and the required change. No labels changed, no PR closed.

## Accept criteria

- Both comment URLs captured.
- Each comment quotes the dev-side source it asks the author to preserve.
- Neither comment asks for a rewrite where a narrowing would do.
