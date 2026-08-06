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

## Executed (live state verified per issue)

Four comments posted, seven deliberately not. The restraint is the finding: most
of these already carry an accurate current comment, and re-stating it would have
added noise to a reporter's inbox while buying nothing.

| Issue | Action | Why |
|---|---|---|
| #1100 | comment 5202766906 | NEW: the `modelSupportsReasoningSummaries: true` workaround, verified against the reporter's own provider shape (`GLM/glm-5.2 summaries=true` vs `GLMplain/glm-5.2 summaries=false`, generated locally, no network). Also states what the user asserts by setting it, and what we deliberately did not change |
| #1024 | comment 5202780631 | NEW: per-model answer to a follow-up that had gone unanswered since 08-04. Splits the four probes into fixed / deliberately-excluded / still-blocked, and surfaces a genuine disagreement — `mimo-v2.5-free` accepts images per the 08-05 probe, so "200 but blind" is a different defect from "rejects images" |
| #1017 | comment 5202769373 | NEW: cross-link to #1036 plus the specific hazard blocking it, so the issue does not read as abandoned |
| #994 | comment 5202771720 | NEW: cross-link to #1068, plus the one question that separates this from a lookalike — the report says "OpenCode models" without a model id, and the same 400 text has other causes |
| #1102 | none | RCA comment posted 08-06; the loopback-peer exemption is a maintainer policy call. Nothing new to add |
| #904 #796 #418 | none | each already carries an accurate maintainer comment naming the exact missing capture; re-asking is noise |
| #1059 | none | status comment current as of 08-06 |
| #241 #417 #92 | none | upstream trackers, each already labelled and cross-referenced |

No issue closed. `#1024` in particular stays open on its `TR` half even though
the Zen half shipped — a partly-fixed issue is not a closed one.
