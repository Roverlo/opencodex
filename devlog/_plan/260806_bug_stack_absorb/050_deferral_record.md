# 050 — Deferral record: #1036 and #997 stay with their authors

Measured 2026-08-06, comparing last commit against our review time (the method
this unit adopted after the `updatedAt` error):

| PR | Last commit | Our review | Author response |
|---|---|---|---|
| #1036 | 2026-08-05T07:18:36Z | 2026-08-06T09:12:51Z | none yet |
| #997 | 2026-08-06T02:51:22Z | 2026-08-06T09:16:02Z | none yet |

Both still lack the requested change — #1036 has no provenance tag on the
conversion, #997 has no assertion that the real home was untouched. Both were
verified by reading the current diffs, not inferred.

**Neither is absorbed.** The response window is 72 hours from our review, i.e.
until 2026-08-09. Roughly two hours have passed, and #997's author was active at
02:51Z the same morning. Treating that as abandonment would be indefensible.

## Why the window exists at all

Because the alternative was demonstrated inside this very unit. The original plan
had four absorb targets. Live data showed:

- #1092's author fixed our exact objection in under 30 minutes;
- #1068 merged with the union we asked for, while we were still writing the
  replacement.

Two of four would have been taken over while their authors were actively
responding. The window is what stops the campaign from optimizing for our commit
count instead of the repository.

## What happens when the window closes

Only if a head still lacks the fix on 2026-08-09:

1. Re-check the exact head first — an author who acts in the meantime moves to
   the re-review path.
2. Author the layer per `030` (#1036) or `040` (#997), on a branch taken directly
   from `origin/dev`. These are independent, so no stack.
3. Open our PR with attribution naming the author and their PR, then close theirs
   with a comment stating what we kept and what we changed.

A successor unit `devlog/_plan/2608xx_bug_absorb_window/` gets created at that
point. It does not exist yet, and creating it now would presume the outcome.

## Status

`BLOCKED` on contributor response — by design. Both PRs remain open and theirs.
