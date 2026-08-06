# 070 — Push on top of the contributor's branch

The campaign spent two loops circling a problem it had invented. The user named
the answer in one line: **their PRs report `maintainerCanModify=true`, so push our
completion commit onto their branch.** Their commits stay, `git blame` stays
accurate, their PR is what merges, and attribution is the commit graph rather
than a paragraph.

No replacement PR. No close. No "absorbed with credit to" prose. The thing that
made the earlier plan feel wrong was real, and this removes the cause instead of
managing it.

## What landed

### #1036 — done

```
b5e292928  bitkyc08-arch  fix(cursor): gate structured-edit conversion on provenance, not tool name
33d617601  Agent59353     fix(cursor): address CodeRabbit + Codex review feedback on #1017
d06de0f9c  Agent59353     test(cursor): cover native-exec mcpArgs structured edit translation
500cd94f6  Agent59353     fix(cursor): never shadow an existing bare edit tool ...
f724063d3  Agent59353     fix(cursor): expose structured edit tools that convert to valid apply_patch calls (#1017)
```

Pushed with `--force-with-lease` pinned to their head, after re-verifying the
remote was unchanged. `gh pr view #1036` shows five commits with only the last
attributed to us.

Change: `live-transport` records the bare names we actually advertised this
request (from `cursorStructuredEditTools`), the event state carries them, and
both translate call sites convert only for names in that set. The stateless
fallback passes through — it has no state to consult, and an unconverted call is
recoverable while a wrongly converted one edits a file. Their conversion logic is
byte-unchanged.

Ablation: restoring the name-only gate gives 21 pass / 1 fail, red on exactly the
new collision test.

### #997 — not ours to push

The lease rejected our push as stale: the author had landed `3304d5c8` while we
worked, and **their version is stronger than the one we staged.** We pinned
`getConfigDir()`; they assert the resolved `usage.jsonl` receives the row *and*
that the default location lacks the request id — that survives a refactor of how
the path is resolved.

Verified rather than overwritten: 10 pass on their head, and ablating their
isolation gives 9 pass / 1 fail on their own assertion. Comment posted saying no
changes requested.

## The rule this produced

**Re-fetch the contributor head immediately before preparing a commit, not before
pushing.** Three times in this campaign, acting on a stale head produced wasted or
wrong work:

1. judging author activity by `updatedAt`, which moves when *we* comment;
2. posting a "failing test" finding on #1068 eight minutes after it merged with
   the fix;
3. building a #997 commit against a head the author had already improved.

The lease caught the third one. The first two reached a contributor as a wrong
public statement. Cheap check, expensive omission.

## When push-on-top is the right move

- `maintainerCanModify=true`, and the gap is a bounded correction rather than a
  rewrite.
- The contributor's design survives intact — if our version would replace their
  approach, it is a different PR and a conversation, not a commit on their branch.
- The remote head is re-verified immediately before pushing, with a lease pinned
  to it.
- Any contract change we introduce is disclosed in a comment and explicitly open
  to disagreement (here: the stateless pass-through).
