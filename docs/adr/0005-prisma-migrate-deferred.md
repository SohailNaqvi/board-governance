# ADR 0005: Defer Prisma Migrate Adoption

## Status
Accepted

## Context
Database schema changes are currently applied via ad-hoc SQL scripts executed sequentially in `render-build.sh`:

- `migrate-slice2.mjs` — MeetingStatus/APCEEventStatus enums, MeetingCalendar columns, APCEEvent and InAppNotification tables
- `migrate-asrb-slice2.mjs` — ASRB enums, FeederClient, ASRBCase, CaseAttachment, CaseAuditEvent tables; feeder client seeding
- `migrate-asrb-slice1-completion.mjs` — Compliance enums and tables (ComplianceRule, ComplianceEvaluation, RuleEvaluation)
- `migrate-remediation-slice3-prereqs.mjs` — ASRBMeeting/ASRBMember enums and tables; UserRole extension

This approach bypasses Prisma's built-in migration tracking (`_prisma_migrations` table), meaning there is no automated record of which migrations have been applied to a given database, no drift detection, and no safe multi-environment deployment path.

Prisma Migrate would address all of these concerns. However, adopting it requires the ability to test the migration path against a copy of the production database before deploying — something the current infrastructure does not support.

## Decision
Defer adoption of Prisma's built-in migration system until the database is upgraded from Render's Free tier and a staging environment exists.

## Rationale
The primary benefit of Prisma Migrate is safer, tracked schema changes across multiple environments. That benefit is only realised when multiple environments exist and when the database contains data worth protecting.

Currently:

- There is **one environment** (Render production) with no real university data.
- The database is on **Render's Free tier**, which does not support backups, point-in-time recovery, or preview environments.
- The database will be **recreated** when the project upgrades to a paid tier for a real pilot deployment.
- Adopting Prisma Migrate against an untested production schema — without the ability to test against a database copy first — introduces risk that outweighs the benefit at this stage.

## Trigger for Revisit
This ADR should be revisited and superseded when any of the following conditions are met (whichever comes first):

1. The database is upgraded to a **paid tier** supporting backups and point-in-time recovery.
2. A **staging environment** is established.
3. **Real university data** enters the system.

At that point, the approach outlined in the deferred PR (baseline migration via `prisma migrate diff --from-empty`, then `prisma migrate resolve --applied` on the existing database) should be executed.

## Current Acceptable Approach
The ad-hoc SQL scripts in `render-build.sh` are acceptable for the current stage. They use idempotent patterns (`CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$`) to ensure safe re-runs.

New schema changes should continue to use raw SQL migration scripts in `prisma/` until this ADR is superseded. Each script should follow the existing pattern: use `pg` directly, wrap DDL in idempotent guards, and add the execution step to `render-build.sh`.

## Known Limitations of Current Approach

- **No migration tracking.** There is no record of which scripts have been applied beyond the idempotent guards.
- **No drift detection.** If the database diverges from `schema.prisma`, there is no automated way to detect it.
- **Prisma tooling conflicts.** `prisma db pull` and `prisma db push` may produce unexpected diffs against the raw-SQL-managed schema. Developers should avoid all `prisma migrate` commands entirely until the migration to Prisma-managed migrations is completed.
- **Seed data mixed with schema changes.** Some scripts (e.g., `migrate-asrb-slice2.mjs`) both create tables and seed data, conflating concerns.

## Related Files
- `render-build.sh` — Build script executing the ad-hoc migrations
- `prisma/migrate-*.mjs` — The ad-hoc SQL migration scripts
- `prisma/schema.prisma` — The Prisma schema (source of truth for Prisma Client generation)
