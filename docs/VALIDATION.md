# Validation policy

This policy is shared by the root and src/ instructions. Select checks from the actual diff and current package.json. It does not relax installed hooks, required CI, maintainer review or a requested release check.

| Change | Local validation |
|---|---|
| Markdown-only guidance | Review the final diff, verify links and commands against the current tree, and run `git diff --check`. Runtime tests are unnecessary unless executable behavior or generated output is affected. |
| Focused runtime behavior | Add a regression test beside the affected subsystem; run the relevant `bun test tests/<name>.test.ts` and `bun run typecheck`. |
| Shared routing, adapters, transports, config, OAuth or server behavior; uncertain impact | Focused regressions plus `bun run typecheck` and the full `bun run test` suite. |
| GUI or public documentation build | Follow the nearest directory's instructions and current package scripts; include rendered evidence for visible changes. |
| Logging, requests, credentials, account data, fixtures or tracked notes | Run `bun run privacy:scan`; review sensitive changes under MAINTAINERS.md. |
| Review-ready code, integration or release | Run all applicable required CI/release checks for that stage, including the full runtime suite for non-trivial runtime changes. |

While iterating, rerun failures and checks affected by subsequent changes. A later change to shared behavior or an unresolved concern justifies broader validation; an unchanged passing check alone does not justify repeating the entire suite.

## Environment and known failures

A historical failure count or version label is not a permanent exemption. Before classifying a failure as pre-existing or environment-limited, compare the same check on the relevant base in a comparable environment and record the commit, runtime/OS, test, observed error and limitation. Do not silently dismiss a failure that overlaps the changed subsystem. Recheck when the environment, relevant code or failure signature changes.

Report what passed, failed or could not run, and distinguish local validation from required CI. Do not mark an unexecuted check as passing or disable checks simply to push.

## Available commands

The current base exposes `bun run typecheck`, `bun run test`, `bun run privacy:scan`, `bun run lint:gui` and `bun run build:gui`. Focused Bun tests use explicit test paths. Do not assume a `test:changed` script exists on every branch; inspect package.json first.
