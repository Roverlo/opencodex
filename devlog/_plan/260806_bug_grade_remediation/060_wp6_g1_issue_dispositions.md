# 060 — wp6: G1 issue dispositions (the 11 wp1 does not fix)

Added after the plan audit found the objective promising an outcome for every
bug-labelled item while the phase map scheduled work for only one issue. This
phase closes that gap honestly: a disposition is not a fix, and saying so is the
point.

wp6 is the aggregation barrier — several dispositions point at a PR reviewed in
wp2/wp3, so it runs after those lanes settle.

## Disposition vocabulary

`fix-owned` we will author the fix · `awaiting-reporter` blocked on a specific
capture · `awaiting-contributor` blocked on a named PR · `upstream` tracked
outside this repo · `parked` real but nobody is on it, with the unblocking
condition stated.

## Per-issue

| Issue | Disposition | Action in this phase |
|---|---|---|
| #1100 | fix-owned (partial) | wp1's joint-contract test landed. Comment already posted with the RCA. Add: the per-model `modelSupportsReasoningSummaries: true` opt-in is a **usable workaround today** for a configured provider — that is new, actionable information the reporter does not have |
| #1102 | needs-human | RCA posted. The loopback-peer exemption is a policy call; escalate to the maintainer rather than deciding it here |
| #1024 | awaiting-reporter | the Zen half shipped in v2.10.2; only the reporter's `TR` provider config remains. Comment already asks for it — verify it is still the only blocker, do not re-ask |
| #1017 | awaiting-contributor | blocked on #1036, whose hijack defect wp3 documents. Cross-link so the issue reader can see why it is not simply open-and-ignored |
| #994 | awaiting-contributor + awaiting-reporter | #1068 covers the Zen replay half; the Claude-path capture is still missing. Cross-link #1068 |
| #904 | awaiting-reporter | fix shipped, tests cover astral surrogates but not the reported Hangul case. Needs the original failing capture |
| #796 | awaiting-reporter | fix + regression test shipped; needs a live Ark retest |
| #1059 | parked (ours) | Windows leg dispatch-only. Unblocking condition: a shard-by-shard burn-down. Confirm the existing status comment still reflects reality |
| #241 #417 #92 #418 | upstream | already labelled `upstream-tracking`. Verify each still carries a pointer to its upstream item; add one where missing |

## Rule for this phase

**Do not re-comment where a current comment already says the same thing.** Several
of these were dispositioned earlier today. Re-stating it adds noise to the
reporter's inbox and buys nothing. Only comment where this phase adds something
new — the #1100 workaround, and the #1017/#994 cross-links.

## Deliverable

A disposition table recorded here with the live state of each issue, plus the
small number of comments that carry genuinely new information.

## Accept criteria

- Every one of the 11 issues has a disposition and a stated unblocking condition.
- Each comment posted in this phase says something not already on the issue.
- No issue is closed in this phase.
