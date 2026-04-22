# ADR 0007: GitHub Actions CI

## Status

Accepted

## Context

The board-governance repository has no continuous integration. All verification (typecheck, tests, build) has been performed manually in local terminal sessions before merging PRs. This approach has two problems:

1. **It depends on discipline.** If the person merging forgets to run a check, the error reaches production. This happened when PR #9 (Slice 3a) was merged with `.js` import extensions that passed vitest (which strips types at runtime) but broke the Next.js webpack build on Render.

2. **It depends on environment parity.** The Prisma client must be regenerated after schema changes, but this step is easy to miss because `pnpm install` does not always trigger it. The result was 94 typecheck errors that were invisible until someone explicitly ran `prisma generate` followed by `pnpm -r typecheck`.

Both failures were caught only after merging to main, requiring hotfix PRs.

## Decision

Add a GitHub Actions workflow (`.github/workflows/pr-checks.yml`) that runs on every pull request targeting `main`. The workflow runs three independent jobs in parallel:

**Typecheck** (`pnpm -r typecheck`): Runs `tsc --noEmit` across all workspace packages. Catches type errors that vitest misses because vitest strips types at runtime. The job runs `prisma generate` first so the generated Prisma client types are available.

**Test** (`pnpm exec vitest run`): Runs the root-level vitest configuration which covers all unit and contract tests across all packages. Currently 15 test files with 329 tests.

**Build** (`pnpm --filter @ums/web build`): Runs the full Next.js production build. This is the same build Render executes on deploy. Catches module resolution errors, missing imports, and webpack compilation failures that typecheck alone does not surface.

All three jobs must pass before a PR can be merged.

## Why Lint Is Not Included

The `apps/web` package has 75 pre-existing eslint errors (primarily `no-explicit-any` in board module routes and `no-unused-vars`). Adding lint to CI today would block all PRs until the backlog is cleared. A future PR should address the lint debt and then add a fourth CI job.

## Known Limitations

- **No database integration tests.** The CI environment has no PostgreSQL instance. All Prisma-dependent code is tested via mocked stores.
- **No end-to-end tests.** Playwright or similar browser testing is not yet configured.
- **No security scanning.** Dependency audits and SAST are deferred.
- **No deployment automation.** Render auto-deploys from main; CI does not trigger or gate deployments.

## Consequences

### Positive

- PRs that break typecheck, tests, or the build are blocked before merging.
- The three checks document what "passing" means for this repo.
- Contributors can run the same three commands locally before pushing.
- The workflow file serves as executable documentation of the CI contract.

### Negative

- Each PR incurs ~2-4 minutes of CI time across three parallel jobs.
- The `prisma generate` step must be kept in sync with schema changes; if the schema path moves, the CI step must be updated.
- The pnpm store cache and Node.js cache require GitHub Actions storage (typically well within free-tier limits).
