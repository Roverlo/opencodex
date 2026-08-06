# 000 — Plan: stack-and-absorb the contributor bug fixes

Second loop of the 2026-08-06 bug campaign. The first loop graded 25 items and
posted reviews; this one converts the reviews into landed work.

Base `origin/dev` = `efdfd1cf5` (moved during loop 1 — #715 landed). Layer 0 is
already pushed and open as **#1119**.

## Why we author replacements rather than wait — AND WHEN WE MUST NOT

Four contributor PRs shared a shape: the defect is real, the diagnosis is right,
and the patch is one specific decision away from correct. The original intent was
to correct that decision ourselves, land it with attribution, and close theirs as
absorbed. **Attribution is not a courtesy here, it is accuracy**: in each case the
hard part — finding the defect — was theirs.

The plan audit caught this campaign about to break its own rule, and the
correction is the most important thing in this document.

**Measured 2026-08-06 by comparing LAST COMMIT time against OUR REVIEW time** —
the second audit round caught the first version of this table using
`updatedAt`, which moves when *we* comment and therefore proved nothing:

| PR | Author | Last commit | Our review | Acted after? |
|---|---|---|---|---|
| #1092 | eachann1024 | 09:38:19Z | 09:09:51Z | **YES** — fail-closed guard restored with a comment keeping `unknown` distinct |
| #1068 | justjxke | 08:52:23Z | 09:13:15Z | **no** — commits predate the review by 21 minutes |
| #1036 | ZachDreamZ | 08-05 07:18Z | 09:12:51Z | no |
| #997 | Yuxin-Qiao | 08-06 02:51Z | 09:16:02Z | no |

One author turned our review around in under half an hour. **Absorbing that would
be taking credit for work the author did in response to our own request** — the
opposite of why this campaign exists, and no amount of attribution text repairs
it.

The rule: **we absorb only where the author has not acted after our review, AND
only after a stated response window has passed.** "Has not replied within an
hour" is not abandonment — people sleep, and #997's author was active at 02:51Z.
Absorption is for a correct diagnosis that would otherwise rot in a queue, not a
faster path to our own commit.

**Response window: 72 hours from our review.** Before authoring or closing
anything we re-check the exact head. Any author who acts moves to the re-review
path.

## Revised plan

| WP | Layer | Disposition |
|---|---|---|
| s0 | devlog + #1100 joint contract | **done** — `codex/260806-bug-grade-remediation`, PR #1119 open |
| s1 | #1068 | **re-review, no absorb.** Its commits predate our review, and its guard/test state is internally inconsistent — that is a review finding, not something to take over |
| s2 | #1092 | **re-review, no absorb.** Author acted on our review within 30 minutes |
| s3 | #1036 Cursor edit provenance | **deferred absorb** — no response yet, but inside the 72h window. Re-review now; author the layer only if the window closes |
| s4 | #997 usage-log isolation | **deferred absorb** — same |

So this loop authors **no absorbed layer today.** That is the honest outcome of
the two audit rounds: the campaign's premise — four stalled PRs — did not survive
contact with the live data. What remains is real and useful (re-reviews that carry
new findings, plus the PR-less issues), and pretending otherwise to justify the
original plan would be the failure mode this discipline exists to prevent.

**These are independent PRs, not a stack.** The audit was right that calling them
dependency-ordered was false: s3 lives entirely in `src/adapters/cursor/`, s4 is
one test file, and neither reads the other's output. PHASE-SPLIT-01 asks for
dependency order, and inventing a chain where none exists would make every layer
wait on the one below it for no reason. Both branch from `origin/dev` directly.

The `--update-refs` cascade machinery from the 260805 campaign applies to genuine
stacks; it is not needed here and pretending otherwise would add rebase risk.

Before absorbing s3 or s4 we re-check the author's head one final time. An author
who acts between now and then moves to the re-review path, same as #1092 did.

## Layers deliberately NOT absorbed

- **#978** — the wp2 review corrected its grading from "dangerous gate reversal"
  to an opt-in capability assertion and asked only for a docs note. It still needs
  that author-side docs change; it is excluded because it is close to correct and
  its author owns the remaining work, not because nothing is left to do.
- **#1095, #1085, #1111, #1056, #1047** — Grade 2. Each is correct and needs a
  rebase or a split by its own author. Absorbing a correct PR because its author
  has not rebased yet would be rude and would erase their authorship for no
  technical gain.
- **#557** — ours, and blocked on a real design question (Windows coverage), not
  on a missing rebase.
- **#1093** — blocked on a contract nobody has stated. There is nothing to absorb
  until someone says what the data means.

## Absorb protocol (applies to every layer)

1. Confirm the response window has closed and the author's head still lacks the
   fix. Then author the corrected change on a `codex/` branch **taken directly
   from `origin/dev`** — s3 and s4 are independent, so stacking and the
   `--update-refs` cascade do not apply and would only add rebase risk. Reserve
   that machinery for a genuine dependency chain.
2. Regression test with a **red ablation** — break the mechanism, watch the test
   fail, restore, watch it pass. Record both outputs in the layer's decade doc.
3. `bun run typecheck` + touched tests green before push.
4. Open our PR with the repo template, `Closes #<issue>` where one exists, and a
   Credit line naming the original author and PR.
5. Close the contributor PR with a comment that states: what we kept from their
   work, what we changed and why, and where it now lives. Never "superseded" with
   no explanation.

## Scope

**IN** — `codex/` branches here; `src/` and `tests/` we author; this unit's docs;
our PRs; comments and closes on the four target PRs.

**OUT (escalate)** — merging anything into `dev`; force-pushing another author's
branch; weakening any security or capability gate; the #1102 loopback-peer
exemption; releases.

## Accept criteria

- `k0` loop-1 devlog pushed and #1119 open with a diff-level decade doc per layer.
- `k1` #1068 re-reviewed against its current head, reporting the **failing**
  guard/test contradiction (Pro and Flash are not in the registry list the router
  merges) and the unmeasured modality question. No credit for a review response
  that did not happen; no close.
- `k2` #1092 re-reviewed against its current head, crediting the author for
  restoring the fail-closed guard within half an hour of our review, and asking
  only for the unrelated `imageInput` scope to be split. No close.
- `k3`, `k4` #1036 and #997 confirmed to still lack the requested change, and
  recorded as **deferred to the post-window unit**. Nothing authored, nothing
  closed inside the 72h window.
- `k5` no authored layer this cycle, so no PR heads to verify beyond #1119.
- `k6` #1102 and #1059 reach an authored fix or an evidence-backed disposition.

## Terminal outcomes

The honest terminal for this unit is **not** `DONE`. The campaign was scoped to
absorb four stalled PRs; live data showed one author responding to our review
within 30 minutes and the other three inside a reasonable response window. The
absorb half is therefore `BLOCKED` on the contributors — by design, not by
obstruction — and the re-review half completes.

- Re-reviews and issue dispositions → `DONE`.
- s3/s4 absorption → `BLOCKED` (72h response window), carried to a successor unit
  `devlog/_plan/2608xx_bug_absorb_window/` created only if the window closes with
  no author action.
- #1102 policy decision → `NEEDS_HUMAN`.

Recording it this way rather than shrinking the criteria to fit what we finished
is the point: the plan was wrong about the world, and the ledger should say so.
