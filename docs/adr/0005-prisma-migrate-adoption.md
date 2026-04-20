# ADR 0005: Adopt Prisma Migrate for Schema Management

## Status
Accepted

## Context
Since the project's inception, database schema changes have been applied via ad-hoc SQL scripts (`migrate-slice2.mjs`, `migrate-asrb-slice2.mjs`, `migrate-asrb-slice1-completion.mjs`, `migrate-remediation-slice3-prereqs.mjs`) executed sequentially in `render-build.sh`. This approach has several problems:

1. **No migration tracking.** There is no record of which migrations have been applied to a given database. Re-running scripts relies entirely on `IF NOT EXISTS` / `ON CONFLICT` guards, which are fragile for ALTER statements.
2. **No drift detection.** If the database diverges from `schema.prisma`, there is no automated way to detect it.
3. **Multi-environment breakage.** As soon as a second environment exists (staging, developer local), each environment must manually run the correct scripts in the correct order.
4. **Seed data mixed with schema changes.** The `migrate-asrb-slice2.mjs` script both creates tables and seeds feeder client data, conflating concerns.

Prisma Migrate provides a robust, file-based migration system that tracks applied migrations in a `_prisma_migrations` table, generates SQL from schema diffs, and integrates with CI/CD via `prisma migrate deploy`.

## Decision
We adopt Prisma Migrate as the sole mechanism for schema changes, effective immediately.

### Baseline migration
A single baseline migration (`0_initial_asrb_baseline`) was generated using `prisma migrate diff --from-empty --to-schema-datamodel` to produce the SQL equivalent of the current `schema.prisma`. This migration represents the cumulative effect of all historical ad-hoc scripts.

For the existing Render production database (which already has the schema applied):
```bash
npx prisma migrate resolve --applied "0_initial_asrb_baseline"
```
This marks the baseline as "already applied" without re-running the SQL, allowing subsequent migrations to proceed normally.

For a fresh database:
```bash
npx prisma migrate deploy
```
This applies the baseline migration from scratch, producing the full schema.

### File reorganization
- Historical ad-hoc scripts → `prisma/historical-sql/` (retained for audit, never executed)
- One-time data scripts (argon2id key rotation) → `scripts/one-time/` with README
- `render-build.sh` updated to call `prisma migrate deploy` instead of individual scripts
- Seed scripts remain in `prisma/` and are run separately after migration

## Consequences

### Positive
- Schema changes are tracked, versioned, and reproducible across environments.
- `prisma migrate deploy` is idempotent — safe to run on every deploy.
- New schema changes are created via `prisma migrate dev --name <description>`, which generates both SQL and updates the Prisma client.
- Drift detection: `prisma migrate diff` can compare the database against the schema at any time.
- Clear separation of schema (migrations) and data (seed scripts).

### Negative
- Developers must learn the Prisma Migrate workflow (documented in CONTRIBUTING.md).
- The `_prisma_migrations` table is added to the database.
- Existing production database requires a one-time `migrate resolve` step on first deploy of this branch.
- Complex migrations (e.g., renaming columns with data) may still require manual SQL within the generated migration file.

## Migration Workflow

### Creating a new migration
```bash
# 1. Edit prisma/schema.prisma
# 2. Generate migration
npx prisma migrate dev --name descriptive_name
# 3. Review generated SQL in prisma/migrations/<timestamp>_descriptive_name/migration.sql
# 4. Commit the migration directory
```

### Applying migrations in CI/production
```bash
npx prisma migrate deploy
```

### Checking for drift
```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma
```

## Related Files
- `prisma/migrations/0_initial_asrb_baseline/migration.sql` — Baseline migration
- `prisma/migrations/migration_lock.toml` — Provider lock file
- `prisma/historical-sql/` — Archived ad-hoc scripts
- `scripts/one-time/` — One-time data migration scripts
- `render-build.sh` — Updated build script
- `CONTRIBUTING.md` — Developer workflow documentation
