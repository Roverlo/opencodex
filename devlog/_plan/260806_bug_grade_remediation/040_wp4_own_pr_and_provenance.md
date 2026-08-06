# 040 — wp4: own-PR gap and missing contracts (#557, #1093, #997)

These three share a shape: the change is defensible, the *claim* around it is not
yet supported. #557 is ours, so it gets the least charitable reading of the three.

## #557 — npm cache recovery preflight (maintainer's own)

The underlying failure is real: both update paths stop the proxy before running
npm (`src/update/index.ts:231-273`, `bin/ocx.mjs:239-250`), so a cache-permission
failure leaves the user stopped and un-upgraded. The Unix preflight is substantive.

Two problems to record honestly:

1. The preflight is skipped on Windows, and a test asserts that skip. Windows is
   where npm cache ownership problems are most common, so the PR does not cover
   its own motivating case on the platform that needs it most.
2. The description claims "7000 pass / 0 fail". The recorded Windows run has two
   failing update-job tests, both unexpectedly reaching `spawnStart` under the
   altered restart flow. The Ubuntu failure is a Bun 1.3.14 segfault after the
   suite and is not attributable to this patch; macOS was cancelled.

Because this touches dependency installation and update recovery, `MAINTAINERS.md`
requires a second-maintainer security review. Being the author does not exempt it —
state that in the comment so the record is unambiguous.

Disposition: comment on our own PR correcting the verification claim and naming
the Windows gap. No merge, no push.

## #1093 — ingress span provenance

Neither field exists on dev (`src/server/request-log.ts:219-256`;
`src/server/responses/core.ts:1631-1641`), so this is additive. The problem is
that the header is accepted from any client if it matches a regex, while the
description calls the values "guard-issued". Nothing issues them.

Three things the author must supply before review can proceed:

1. Who issues `x-opencodex-ingress-span`, and why a client-supplied value may be
   trusted into persisted logs.
2. The policy when a request fails before adapter resolution — auth rejection,
   routing failure — since the attempt record is created after resolution.
3. A corrected description: the PR says no public contract changes while adding
   fields to persisted usage records and `/api/logs`.

Also still 138 commits behind after today's retarget; rebase before review.

## #997 — usage-log fixture isolation

The hazard is real and worth fixing: `addRequestLog` persists usage
(`src/server/request-log.ts:302-352`) and `getConfigDir()` resolves to the real
`~/.opencodex` when `OPENCODEX_HOME` is unset (`src/config.ts:545-552`), so a test
run can write into a developer's actual usage history.

The per-test temp home and cleanup are complete for that file. What is missing is
a test that proves the promise: nothing asserts the real home was untouched. Ask
for one assertion — run with `OPENCODEX_HOME` pointed at a temp dir from an
unrelated cwd and assert no write reached the default path.

This is the smallest ask of the three; frame it as "one assertion away", not as a
rejection.

## Deliverable

Three posted comments, English. The #557 one is self-directed and must not be
softer than the other two.

## Accept criteria

- Three comment URLs captured.
- The #557 comment cites the actual failing Windows tests, not the PR's claim.
- The #1093 comment lists the three prerequisites as a checklist the author can act on.
