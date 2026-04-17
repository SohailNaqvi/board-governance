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

## Architecture

See `docs/adr/` for decisions on key design choices. When making significant architectural changes, consider documenting with a new ADR.

## Pull Requests

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit with conventional commits
3. Push to remote and open a PR
4. CI must pass before merging
5. At least one approval required
