# Repository guidance

opencodex (`ocx`) is a Bun-native TypeScript provider proxy for Codex and Claude Code. There is no separate server compilation step. Use the current branch's package.json and nearest nested AGENTS.md; do not copy commands or version-specific assumptions from another branch.

## Invariants

- Preserve public configuration, provider contracts, streaming, cancellation and error handling unless the task explicitly changes them. Read the relevant `structure/` documents before changing shared subsystems.
- Keep credentials, request bodies and account identifiers out of logs, fixtures and committed notes. Security findings, draft advisories, exploit reasoning and pre-disclosure plans belong only in gitignored scratch space. Published outcomes may enter tracked documentation after disclosure.
- `devlog/` is public, tracked documentation. Never restore gitlinks, vendored reference clones or unreleased security triage to the index.
- Actions that spend a user's identity, credits or reputation require the existing consent boundary. Never perform or auto-answer the repository-star prompt; see [installation rules](AGENTS_INSTALL.md) when operating the product.
- `dev` is the integration and PR target; `main` is the maintainer-controlled release line. Work on the task's bound feature branch. Do not merge, rebase other tasks, deploy or publish without the corresponding user instruction.
- Authentication, OAuth, credentials, management API/CORS, dependency installation, Actions and release automation require the security review defined by [MAINTAINERS.md](MAINTAINERS.md). Maintainer approval and required CI still govern merge readiness.

## Read by task

| Task | Read |
|---|---|
| Runtime changes | [src/AGENTS.md](src/AGENTS.md) and applicable `structure/` notes |
| GUI, public docs, release scripts | The nearest [GUI](gui/AGENTS.md), [docs](docs-site/AGENTS.md) or [scripts](scripts/AGENTS.md) instructions |
| Choosing checks or interpreting failures | [Validation policy](docs/VALIDATION.md), shared with src/ |
| Writing devlog/security notes, adding consent actions, issues, PRs or code review | The matching section of [contribution workflows](docs/AGENT_WORKFLOWS.md) |
| Review/merge/promotion | [MAINTAINERS.md](MAINTAINERS.md) and the actual repository templates |

User-visible behavior changes update `docs-site/` and keep translated locales consistent. Code reviews use English and actionable file/line evidence; ordinary conversation follows the user's language. `scripts/release.ts` remains the release authority; `go/` is a retired experiment, not a parallel runtime target.
