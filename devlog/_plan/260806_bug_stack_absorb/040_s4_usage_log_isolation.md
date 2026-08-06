# 040 — s4: usage-log fixture isolation, with the proof (corrects #997)

## What the contributor got right

Yuxin-Qiao found a hazard that is easy to miss and genuinely unpleasant:
`addRequestLog` persists to `usage.jsonl`, and `getConfigDir()` falls back to the
real `~/.opencodex` when `OPENCODEX_HOME` is unset (`src/config.ts:549-552`). So
`bun test tests/management-api-logs-metrics.test.ts` run from outside the repo —
no `bunfig` preload — writes fixture rows into a developer's actual usage history
and they show up on the GUI Usage page. The isolation they wrote (temp home,
prior value restored including the `delete` branch, logs cleared, dir removed) is
correct and complete for that file.

## The one thing to add

Nothing tests the promise. All nine assertions in that file concern metrics, so
the safety property the PR exists to establish is the one property the suite
would not notice losing. A later reordering of `beforeEach`, or a new test that
constructs a logger before the hook runs, puts us back to writing into
`~/.opencodex` with a green suite.

`resolveConfigDir` caches on the raw env value (`src/config.ts:547-554`), so it
re-resolves when `OPENCODEX_HOME` changes — the isolation works, but only because
of that cache key. That is exactly the kind of invariant worth pinning.

## Change map

### MODIFY `tests/management-api-logs-metrics.test.ts`

Keep the contributor's `beforeEach`/`afterEach` verbatim — it is right. Add one
test that pins the property:

```ts
  test("logging never writes into the real OpenCodex home (#997)", async () => {
    // The hazard this file's isolation exists to prevent: getConfigDir() falls back
    // to ~/.opencodex when OPENCODEX_HOME is unset (src/config.ts:549-552), so an
    // unisolated run persists fixture rows into a developer's real usage history.
    // Assert the resolved target, not just that the tests pass.
    const realHome = join(homedir(), ".opencodex");
    expect(testDir).not.toBe(realHome);
    expect(getConfigDir()).toBe(testDir);

    addRequestLog({ /* minimal fixture row */ } as RequestLogEntry);

    expect(existsSync(join(testDir, "usage.jsonl"))).toBe(true);
    // The real home must be untouched by this run. If it already exists on the
    // developer's machine we cannot assert absence, so assert the write landed in
    // the scratch dir and that the resolver never pointed at the real path.
    expect(getConfigDir().startsWith(tmpdir())).toBe(true);
  });
```

Imports to add: `homedir` from `node:os`, `existsSync` from `node:fs`,
`getConfigDir` from `../src/config`.

**Deliberate limitation, stated rather than hidden:** we cannot assert the real
`~/.opencodex` is absent, because on a real machine it usually exists and is not
ours to inspect. Asserting the resolved write target is inside `tmpdir()` is the
strongest honest claim.

## Red ablation

Comment out `process.env.OPENCODEX_HOME = testDir;` in `beforeEach`. The new test
must fail on `expect(getConfigDir()).toBe(testDir)` — resolving to the real home.
Restore, it passes. Record both.

## Verification

- `bun test tests/management-api-logs-metrics.test.ts`
- `bun run typecheck`

## Follow-up worth noting, not doing here

Other test files calling `addRequestLog` may carry the same hazard. A shared
helper beside `tests/helpers/isolated-codex-home.ts` (which does exactly this for
`CODEX_HOME`) would be the right home for it. Out of scope for this layer —
recorded so it is not lost.

## Accept criteria

- Contributor's isolation preserved unchanged.
- New assertion present and proven non-vacuous by the ablation.
- #997 closed with attribution to Yuxin-Qiao.
