# 000 — Plan: bug-labelled backlog remediation

Unit for the loop that converts the 2026-08-06 bug-grade triage into landed,
evidence-backed remediation. Base `origin/dev` = `ef1317871`, release `v2.10.2`
is published and is an ancestor of `origin/main` (npm `latest` = 2.10.2).

## Objective

Every `bug`-labelled open item reaches a **stated disposition**: fixed by us with
a genuine regression test, reviewed with `file:line` and the required change, or
explicitly parked with the named evidence that would unpark it. No item is closed
on suspicion and no PR is merged inside this loop.

Being precise about the limit, because the amended audit caught the original
wording overselling it: this loop authors code for **one** defect (#1100's joint
contract). The other eleven G1 issues get a disposition, not a fix — several are
upstream, and several are waiting on a reporter capture no amount of local work
can substitute for.

## Where the triage landed (25 items)

Twelve issues and thirteen PRs carry the `bug` label. **No item was fake** — every
reported defect reproduces in code. What separates them is whether the *fix* is
sound.

| Grade | Meaning | Items |
|---|---|---|
| G1 | Real defect, nobody is fixing it yet | issues #1102 #1100 #1024 #1017 #994 #904 #796 #1059 #418 #417 #241 #92 |
| G2 | Fix is real and correct | PRs #1095 #1085 (merge-ready) · #1111 #1056 #1047 (small change) |
| G3 | Bug real, fix dangerous | PRs #1036 #1092 #978 #1068 #557 |
| G4 | Premise or contract missing | PRs #1093 · #997 (borderline: fix right, proof absent) |

`001_grade_matrix.md` carries the per-item evidence anchors.

## Constraints

- Bun-native TypeScript. `bun run typecheck` and the touched test files must be
  green before any completion claim.
- Review language is English (repo review guideline), regardless of issue language.
- Every new regression test needs a red ablation: break the mechanism, watch the
  test fail, restore, watch it pass. A green suite alone proves nothing.

## Scope

**IN** — this unit's docs; `tests/` additions we author; `src/` changes only for
defects we own; GitHub review comments and labels.

**OUT (escalate, do not do)** — merging any PR; `git push`; closing contributor
PRs; weakening any security or capability gate; implementing the #1102
loopback-peer exemption (a policy decision the maintainer owns); releases.

## Work-phase map

Dependency graph: **wp0 → wp1 is serial; wp2–wp5 are parallel lanes; wp6
aggregates their settled outcomes.** The catalog contract runs first because it
is the only phase that changes shipped behavior, and it produces the vocabulary
("advertised capability is not proven capability") the review lanes reuse.

| WP | Doc | Deliverable |
|---|---|---|
| wp0 | `000`, `001` | This roadmap, at diff-level |
| wp1 | `010` | #1100 catalog joint-contract regression test |
| wp2 | `020` | #1092 + #978 capability-gate reversal reviews |
| wp3 | `030` | #1036 + #1068 correctness-hazard reviews |
| wp4 | `040` | #557 + #1093 + #997 dispositions |
| wp5 | `050` | G2 merge-readiness dispositions |
| wp6 | `060` | G1 issue dispositions (the 11 issues wp1 does not fix) |

wp1 consumes wp0's verified ordering finding, so that edge is serial. wp2–wp5
have no dependency on each other and may run in any order; they are separate
phases because they fail for different reasons, not because one feeds the next.
wp6 is the aggregation barrier — it cannot close until the PR lanes settle,
because several G1 issues are dispositioned by pointing at a PR reviewed in
wp2/wp3 (#1017 → #1036, #994 → #1068).

Running wp2/wp3 as one phase would blur why each PR is blocked: wp2 items reverse
a deliberate fail-closed decision, wp3 items delete or bypass an existing
protection.

## The finding that shapes wp1

`normalizeRoutedCatalogEntry` deletes `supports_reasoning_summaries` from every
routed row (`src/codex/catalog/parsing.ts:353`) and `ensureStrictCatalogFields`
then defaults it to `false` (`:266`). Codex gates construction of the entire
Responses `reasoning` object on that flag, so a routed model advertises a full
effort ladder while the wire carries no effort — issue #1100.

A direct experiment settles what is actually broken:

```
plain/ladder-model  levels=[low,high,max,ultra] default=high summaries=false
optin/ladder-model  levels=[low,high,max,ultra] default=high summaries=true
```

The per-model opt-in the `:352` comment says should exist **already exists**
(`modelSupportsReasoningSummaries`, resolved at
`src/codex/catalog/provider-fetch.ts:545`) and survives the delete, because
`applyCatalogModelMetadata` runs at `src/codex/catalog/sync.ts:268`, one line
*after* `normalizeRoutedCatalogEntry`.

So the defect is narrower and more honest than "we strip the flag": the ordering
works, the escape hatch works, and **nothing asserts the two stay consistent**.
A future reordering of those two calls would silently disable effort propagation
for every routed provider that opted in, and no test would notice. That absent
joint contract is what wp1 buys, and it is squarely ours regardless of how the
upstream Codex gate behaves.

wp1 deliberately does NOT flip the default to `true`. Advertising OpenAI-only
summary delivery for arbitrary providers is the exact overclaim the `:352`
comment refuses, and #1092/#978 are blocked in wp2/wp3 for the same class of
mistake. Fixing our own bug by committing the neighbours' bug would be incoherent.

## Accept criteria

- `c0` unit exists with `000`, `001` and one diff-level decade doc per phase.
- `c1` #1100 joint-contract test green, with recorded red-ablation output.
- `c2` #1092 and #978 reviews posted, each quoting the fail-closed source.
- `c3` #1036 and #1068 reviews posted with a reproducible hazard scenario.
- `c4` #557, #1093, #997 dispositions posted; #557 cites real failing tests.
- `c5` every G2 PR has a readiness verdict; all remain open and unmerged.
- `c6` each of the 11 remaining G1 issues carries one concrete disposition:
  fix-owner named, reporter evidence requested, upstream handoff recorded, or
  parked with the specific unblocking condition.

## Terminal outcomes

`DONE` all six criteria met with fresh evidence. `NEEDS_HUMAN` for any merge,
push, or the #1102 policy call. `BLOCKED` where a contributor or reporter must
act first.
