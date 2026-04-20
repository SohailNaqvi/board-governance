# Contributing to Board Governance Module

## Code Style

- Use TypeScript in strict mode
- ESLint configuration for linting
- Prettier for code formatting
- Vitest for unit and contract tests

## Commit Guidelines

- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- Reference issue numbers when applicable
- Keep commits focused and atomic

## Testing

All code changes should include tests:

```bash
# Run specific test suite
pnpm test:unit
pnpm test:contract

# Run with coverage
pnpm test -- --coverage
```

## Database Migrations

This project uses **Prisma Migrate** for all schema changes. See [ADR 0005](docs/adr/0005-prisma-migrate-adoption.md) for the full rationale.

**Creating a new migration (development):**

```bash
# 1. Edit prisma/schema.prisma
# 2. Generate and apply the migration
npx prisma migrate dev --name descriptive_name --schema=prisma/schema.prisma
# 3. Review the generated SQL in prisma/migrations/<timestamp>_descriptive_name/migration.sql
# 4. Commit the entire prisma/migrations/<timestamp>_.../ directory to version control
```

**Applying migrations in CI / production (Render):**

Migrations are applied automatically during the Render build via `prisma migrate deploy` in `render-build.sh`. This command applies only unapplied migrations and never generates new ones.

**Rules:**

- Never modify an already-committed migration file. Create a new migration instead.
- Never use ad-hoc SQL scripts for schema changes. All DDL goes through Prisma Migrate.
- Data-only seed scripts (e.g., `seed-feeder-clients.mjs`) remain in `prisma/` and are run after migrations.
- One-time data migrations (e.g., key rotation) go in `scripts/one-time/` with a README.
- Historical ad-hoc SQL scripts are archived in `prisma/historical-sql/` for audit reference.

## Package Scope Convention

All internal workspace packages **must** use the `@ums/*` scope. This is the canonical scope for the University Management System monorepo.

| Package | Name |
|---------|------|
| Domain logic | `@ums/domain` |
| Data abstraction | `@ums/source-data` |
| Audit system | `@ums/audit` |
| Web application | `@ums/web` |

**Rules:**
- Never introduce a new package scope (e.g., `@board-governance/*`, `@university/*`) without an approved ADR.
- All imports of workspace packages must use the `@ums/*` prefix.
- The `transpilePackages` array in `next.config.mjs` must include every `@ums/*` package imported by the web app.
- The `apps/web/package.json` must list every `@ums/*` package it imports under `dependencies` with `"workspace:*"`.

## Security: Secret Storage

**SHA-256 (`createHash("sha256")`) must never be used to hash secrets** — API keys, passwords, tokens, or any value that must resist brute-force attack. SHA-256 is a fast hash and is trivially cracked on modern GPUs.

Use **argon2id** (via the `argon2` package) with the work parameters defined in `ARGON2_OPTIONS` (`apps/web/src/lib/asrb/api-key-auth.ts`). See [ADR 0004](docs/adr/0004-api-key-hashing.md) for the full rationale.

SHA-256 and HMAC-SHA-256 remain appropriate for non-secret uses such as payload integrity checksums and upload token signatures.

## Architecture

See `docs/adr/` for decisions on key design choices. When making significant architectural changes, consider documenting with a new ADR.

## Pull Requests

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit with conventional commits
3. Push to remote and open a PR
4. CI must pass before merging
5. At least one approval required
