# 001 — Grade matrix (25 bug-labelled items)

Research record. No diffs here (LEXICO-SPLIT-01). Verified against
`origin/dev` = `ef1317871`; two independent read-only review lanes produced the
PR rows and the main session re-verified the load-bearing claims by reading the
dev-side source directly.

## Issues (12) — G1: real, unfixed

| Issue | What breaks | Evidence anchor | What would move it |
|---|---|---|---|
| #1102 | Direct-spawned `codex app-server` never receives `OPENCODEX_API_AUTH_TOKEN`; 401 before any SSE frame | shim covers `app-server` (`src/codex/shim.ts:42,386,416`) but a direct spawn bypasses it; admission reads only the header (`src/server/auth-cors.ts:256,369`) | a maintainer policy decision on an opt-in loopback-peer exemption |
| #1100 | Routed models advertise an effort ladder; the wire carries no effort | `src/codex/catalog/parsing.ts:353,266`; `requestedEffort` set from parsed input at `src/server/responses/core.ts:1379` | one sanitized ingress body from the reporter |
| #1024 | Text-only models still receive images on one route | Zen path fixed (`a6f3b2fc2`, in `v2.10.2`); reporter's `TR` provider is not a built-in | the reporter's redacted `TR` config |
| #1017 | Cursor emits malformed `apply_patch` payloads | no structured-edit translation on dev (`src/adapters/cursor/protobuf-events.ts:314-348`) | PR #1036, once its hijack defect is fixed |
| #994 | Claude Code 400: `reasoning_content` must be passed back | replay metadata absent for `opencode-zen` (`src/providers/registry.ts:1753-1762`) | reporter's provider/model + wire capture |
| #904 | U+FFFD when writing Korean files | `eeef7a32a` shipped; tests cover astral surrogates, not the reported Hangul case | the original failing capture |
| #796 | Volcengine Ark 400 on tool turns | `d3abf4345` shipped with `tests/volcengine-ark-assistant-content.test.ts:66`; no live Ark validation | a live Ark retest |
| #1059 | ~207 Windows failures; leg is dispatch-only | `.github/workflows/ci.yml:371-400` | a Windows runner burn-down |
| #418 #417 #241 #92 | upstream Codex behavior | tracked upstream; relay transparency covered locally | upstream resolution |

#1100 and #1102 received maintainer RCA comments on 2026-08-06
(`5201923105`, `5201927225`).

## PRs (13)

### G2 — fix is real and correct

| PR | Author | Readiness | Remaining blocker |
|---|---|---|---|
| #1095 | baileyh8 | merge-ready | removes forced non-streaming for `deepseek-v4-flash` (`src/providers/registry.ts:1254-1257`); synthesizes a terminal only after a complete item lifecycle; real upstream terminals stay authoritative |
| #1085 | n3wr1ch | merge-ready | replaces the unset `$OPENCODEX_API_KEY` reference that made Pi hide the provider; needs the stated security review |
| #1111 | Simon-Opopeee | small change | Copilot stream normalization is sound; the 64 MiB native-history bound is an unrelated concern and should be split |
| #1056 | WZBbiao | small change | opt-in native-alias workaround for #241, correctly bounded; split the unrelated drain-server timing edit |
| #1047 | baileyh8 | small change | syncs vision replacements into `_rawBody`, which passthrough actually serializes (`src/adapters/openai-responses.ts:1144-1188`) |

### G3 — bug real, fix dangerous

| PR | Hazard | Dev-side proof it is deliberate |
|---|---|---|
| #1036 | converts every call named `edit_file`/`multi_edit`, so a genuine client/MCP tool with that name is silently reinterpreted as `apply_patch` | the PR's own tool builder avoids shadowing those names, then the translator ignores that distinction |
| #1092 | injects a combo default effort for targets whose ladder is UNKNOWN | dev fails closed and logs `capability: unknown|unsupported` (`src/combos/request.ts:43-55`) |
| #978 | sends `thinkingLevel` to any model with a configured ladder | dev restricts it to two direct Flash ids (`src/adapters/google.ts:313-326`); a configured ladder is a UI contract, not a wire capability |
| #1068 | drops `OPENCODE_ZEN_TEXT_ONLY_MODELS`, which protects six models (`src/providers/registry.ts:372-379`), and uses obsolete generic DeepSeek constants superseded by per-model ladders (`:380-434`) |
| #557 | skips the preflight entirely on Windows; the PR claims "7000 pass / 0 fail" while the recorded Windows run has two failing update tests |

### G4 — contract or proof missing

| PR | Gap |
|---|---|
| #1093 | accepts any client-supplied `x-opencodex-ingress-span` matching a regex; no issuer is identified, and no policy for failures before adapter resolution. Also adds fields to persisted usage and `/api/logs` while claiming no contract change |
| #997 | fixes a real hazard (tests writing into the developer's real `~/.opencodex`, `src/config.ts:545-552`) but adds no test asserting the real home was untouched |

## Cross-cutting observation

#1092, #978 and #1068 are the same mistake wearing three costumes: each treats
*advertised* capability as *proven* capability, or removes a guard that encodes
the difference. The reviews in wp2/wp3 should name that shared principle rather
than reading as three unrelated nitpicks.
