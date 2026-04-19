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

After modifying `prisma/schema.prisma`:

```bash
pnpm db:migrate
```

Commit the migration files to version control.

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

## Architecture

See `docs/adr/` for decisions on key design choices. When making significant architectural changes, consider documenting with a new ADR.

## Pull Requests

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit with conventional commits
3. Push to remote and open a PR
4. CI must pass before merging
5. At least one approval required
