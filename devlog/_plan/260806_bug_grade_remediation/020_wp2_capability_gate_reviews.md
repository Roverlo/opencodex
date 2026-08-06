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

## #978 — Google `thinkingLevel` (verdict CORRECTED at wp2 P-phase)

The narrow bug is real: dev emits `thinkingConfig` for two direct Flash ids only
(`src/adapters/google.ts:343-348`), while `gemini-3.1-pro-preview` advertises a
ladder at `src/providers/registry.ts:1217` and never receives the field.

**An earlier grading of this PR as a "capability-gate reversal" was wrong, and
this doc corrects it before anything was posted.** The claim was that the PR
sends the field to any model with a ladder, including arbitrary configured
providers. Reading the actual diff and running both trees refutes the harmful
half of that.

The PR's gate (`thinkingEligible`) is *narrower* than the summary suggests: it
excludes `cloud-code-assist`, excludes image-capable models so the
`responseModalities` fallback survives, keeps the Vertex freeze unless a ladder
is explicitly configured, and retains the hardcoded Flash slice for unladdered
configs. Its ladder source is `configuredReasoningEfforts`
(`src/reasoning-effort.ts:58-64`), which returns a value only from a registry
preset or an explicit user config — never a default.

Measured on a custom Google-adapter provider, same probe on both trees:

| Config | dev | PR #978 |
|---|---|---|
| custom provider, user-configured `modelReasoningEfforts` | `undefined` | `{thinkingLevel:"high"}` |
| custom provider, no ladder | `undefined` | `undefined` |
| provider-wide `reasoningEfforts` | `undefined` | `{thinkingLevel:"high"}` |

So the widening is real but is **gated on the user having asserted a ladder for
that model**. That is an opt-in capability assertion, which is exactly the shape
wp1 concluded is the legitimate remedy for #1100 — not the unknown-is-supported
reversal that #1092 performs. Blocking it would contradict our own position.

Disposition: **not blocked.** Post a review that (a) confirms the gate reads
correctly and names the four exclusions, (b) states plainly that a configured
ladder is a user capability assertion and the PR is right to treat it as one,
and (c) asks for one thing only — a docs note that configuring
`modelReasoningEfforts` for a Google-adapter provider now changes wire behavior,
since that consequence is not obvious from the field name.

`bun test tests/google-hardening.test.ts` on the PR head: 24 pass, 0 fail.

Also note the `enforce-target` failure is a stale-checkout mismatch (the run
cannot resolve `.github/scripts/pr-quality-state.cjs`), not the Google change; a
rebase clears it. This is the same root cause as #1068's gate crash — see `030`
— so both comments should describe it the same way rather than inventing two
different explanations for one artifact.

## Deliverable

Two posted PR comments, English. #1092 is a blocking review naming the dev-side
fail-closed line and the concrete failure mode. #978 is a non-blocking review
confirming the gate and asking for a docs note. No labels changed, no PR closed.

## Accept criteria

- Both comment URLs captured.
- The #1092 comment quotes the dev-side source it asks the author to preserve.
- The #978 comment records the corrected verdict with the measured evidence, and
  does not ask for a rewrite the diff does not need.
