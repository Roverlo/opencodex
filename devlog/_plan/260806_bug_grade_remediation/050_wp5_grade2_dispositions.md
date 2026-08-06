# 050 — wp5: Grade-2 merge-readiness dispositions

Five PRs whose fix is real and correct. This phase records a readiness verdict
and the single remaining blocker for each, and posts it so the author knows
exactly what stands between their branch and review.

**No merge happens in this phase.** Merging is a maintainer decision and is
explicitly out of scope for this loop; wp5 ends by escalating the merge call.

## Verdicts

| PR | Verdict | Remaining blocker |
|---|---|---|
| #1095 | merge-ready | none technical; needs the maintainer's merge decision. Removes forced non-streaming for `deepseek-v4-flash` and synthesizes a terminal only after a structurally complete item lifecycle; real upstream terminals stay authoritative |
| #1085 | merge-ready pending security review | replaces an unset env reference with a non-secret loopback placeholder; credential-adjacent, so the stated security review is the gate |
| #1111 | split required | Copilot normalization is sound and its test drives `handleResponses` end to end; the 64 MiB native-history bound is an unrelated fix and belongs in its own PR. Author also states the full suite was interrupted |
| #1056 | split required | opt-in native-alias workaround for #241, bounded to supported native ids with an honest display label; remove the unrelated `tests/native-profile-drain-server.test.ts` timing edit |
| #1047 | rebase + full suite | syncs vision replacements into `_rawBody`, which passthrough actually serializes; only lightweight checks have run on the current draft head |

## Note on #1056 and #999

They are complementary, not competing: #1056 is the runtime workaround, #999
documents the Desktop allowlist limitation. Neither supersedes the other, and
#241 stays open because the root cause is upstream.

## Deliverable

Five posted comments, then an escalation to the maintainer naming the two PRs
that are merge-ready and the decision required.

## Accept criteria

- Five comment URLs captured.
- `gh pr view` confirms all five remain open and unmerged after this phase.
- The escalation states plainly that the agent did not merge.
