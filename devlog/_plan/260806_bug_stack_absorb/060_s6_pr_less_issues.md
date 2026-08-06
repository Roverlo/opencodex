# 060 — s6: the issues with no PR (#1059, #1102)

## #1059 — Windows suite: measured, not estimated

The issue carried "~207 failures" from an aborted promotion run and had not been
re-measured since 2026-08-01. Dispatched the Windows leg against `dev`
(run `31095755263`); all four shards failed:

| Shard | Result |
|---|---|
| 1/4 | **timed out** at the 15-minute cap — no counts recoverable |
| 2/4 | 8 fail |
| 3/4 | 21 fail |
| 4/4 | 47 fail |

76 recoverable failures plus an unknown shard. Grouped by suite from 152 `(fail)`
lines:

```
32  injectCodexConfig integration (Design B)
30  Codex catalog sync hardening
16  Codex catalog restore
12  two real processes contend for one lock
12  server same-target 429 retry (end-to-end)
12  codex-journal
 6  Issue #702 expired forward replay state
```

**The finding that changes the plan:** roughly three quarters are one family —
Codex catalog and config *file writing*. The failing assertions are about atomic
publication and permission narrowing ("writes prepared bytes atomically with the
right...", "group-readable is narrowed back to owner-only", CAS txId conflicts),
which is where POSIX assumptions leak on Windows: `rename` over an existing file,
`chmod` bits, and advisory locking all behave differently.

So the recorded plan ("management/server fixtures first, then platform process
semantics") is superseded by evidence: fix the write substrate first and ~78
failures should fall together rather than shard by shard.

Second defect, split out: **shard 1 times out**, so a quarter of the suite gives
no signal at all. The 15-minute cap was sized against a green suite; Windows
retries and filesystem waits exceed it.

Posted as comment `5203988322`. Issue stays open — this is a measurement and a
re-prioritization, not a fix.

## #1102 — waiting on the reporter, and on a policy call that is not ours

RCA posted 07:52Z. The reporter (`comfuture`) has not replied; they have zero
comments on the thread since filing.

Two things gate progress and neither is code:

1. **Two questions to the reporter** — is their spawning host something they
   control, and is the `0.0.0.0` bind actually serving remote clients that must
   stay authenticated? The answer decides whether a documented credential path
   suffices or a policy change is needed.
2. **A maintainer policy decision** — the only fix that helps a direct-spawned
   app-server is an opt-in "trust loopback peers on a non-loopback bind". That
   redefines the security boundary from "authenticate all callers when bound
   remotely" to "trust any local transport peer", which includes any local
   process and any tunnel terminator landing on loopback.

Re-commenting today would add nothing: the RCA already states both, and the
workaround (`config.apiKeys` + the host passing `x-opencodex-api-key`) is already
documented in it. **Status: `NEEDS_HUMAN`** — carried to the user, not resolved
here.

## Accept criteria

- #1059 carries current measured data and a re-prioritized burn-down order.
- #1102 is explicitly escalated rather than silently left open.
- Neither issue closed.
