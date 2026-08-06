# 050 — wp5: Grade-2 merge-readiness dispositions

Five PRs whose fix is real and correct. This phase records a readiness verdict
and the single remaining blocker for each, and posts it so the author knows
exactly what stands between their branch and review.

**No merge happens in this phase.** Merging is a maintainer decision and is
explicitly out of scope for this loop; wp5 ends by escalating the merge call.

## Verdicts (corrected at wp5 P against live state)

The roadmap called #1095 and #1085 "merge-ready". Live `gh` state contradicts
that for #1095, and the correction matters because "merge-ready" is the phrase
that would have prompted a merge.

| PR | Draft | Behind dev | Verdict | Remaining blocker |
|---|---|---|---|---|
| #1095 | **yes** | 341 | code-ready, NOT merge-ready | the fix is sound — removes forced non-streaming for `deepseek-v4-flash`, synthesizes a terminal only after a structurally complete item lifecycle, leaves real upstream terminals authoritative — but it is still a draft and 341 commits behind |
| #1085 | no | 85 | closest to mergeable | ready for review, but 85 behind and the credential-adjacent security review is still the gate |
| #1111 | yes | 0 | split required | Copilot normalization is sound and its test drives `handleResponses` end to end; the 64 MiB native-history bound is unrelated and belongs in its own PR. Author states the full suite was interrupted. On the latest dev commit, which is unusual and good |
| #1056 | yes | 44 | split required | opt-in native-alias workaround for #241, bounded to supported native ids with an honest display label; remove the unrelated `tests/native-profile-drain-server.test.ts` timing edit |
| #1047 | yes | 341 | rebase + full suite | syncs vision replacements into `_rawBody`, which passthrough actually serializes; only lightweight checks have run on this draft head |

Four of the five are drafts. The repository's readiness gate keeps a draft in
draft until its author ticks the four-box checklist, and the gate verifies two of
those claims itself — green `ci`, and the branch at most 10 commits behind dev.
At 341, 85 and 44 behind, three of these would fail that check today.

So the honest disposition for every one of them is "here is your single
remaining blocker", not "waiting on a maintainer". That leaves exactly zero PRs
where the maintainer is the bottleneck — a more useful thing to report than a
merge queue that does not exist.

## Note on #1056 and #999

They are complementary, not competing: #1056 is the runtime workaround, #999
documents the Desktop allowlist limitation. Neither supersedes the other, and
#241 stays open because the root cause is upstream.

## Deliverable

Five posted comments, each naming the one blocker that PR owns. No merge-decision
escalation, because the corrected state shows none is pending.

## Accept criteria

- Five comment URLs captured.
- `gh pr view` confirms all five remain open and unmerged after this phase.
- The draft/behind numbers match live `gh` output at posting time, not the
  roadmap's assumption.
