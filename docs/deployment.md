# Deployment

How the board-governance application deploys to Render, and how to make
schema and data changes to production going forward.

## How render-build.sh works

The build script (`render-build.sh` at repo root) runs on every push to
`main` via Render's auto-deploy. It does three things:

1. **Install dependencies**: `pnpm install` with `NODE_ENV=development` so
   devDependencies (TypeScript, Prisma CLI) are available during the build.
2. **Generate Prisma client**: runs `prisma generate` against
   `prisma/schema.prisma`. The pnpm lockfile and workspace file are
   temporarily renamed to prevent Prisma from invoking `pnpm add`.
3. **Build Next.js**: runs `next build` in `apps/web`, producing the
   standalone output that Render serves.

The build script does **not** run any database migrations or seed scripts.
Those are one-time operations executed manually via Render Shell.

## Making a schema change to production

1. Edit `prisma/schema.prisma` in a feature branch.
2. Merge to `main`. Render auto-deploys. The build generates a fresh Prisma
   client from the updated schema, but does **not** touch the database.
3. After the deploy succeeds, open Render Shell for the `university-dss`
   service and run:
   ```bash
   npx prisma db push --schema=prisma/schema.prisma
   ```
   This applies the schema diff to the production database. Review the
   output carefully — `db push` prints what it will do before executing.
4. If the schema change is destructive (dropping columns, renaming tables),
   `db push` will warn. Proceed only if you understand the consequences.

This is deliberate: schema changes to production are manual, observed, and
reversible (you can see the diff before it runs). They are never automatic
on deploy.

## Seeding production data

Write a one-off TypeScript script in the `prisma/` directory, following the
pattern of `bootstrap-admin.ts` or `seed-compliance-rules.ts`:

- Use `PrismaClient` directly (or `CatalogService` for compliance rules).
- Make it idempotent: check if the data already exists before inserting.
- Log each action (loaded, skipped, failed) with a summary at the end.
- Exit non-zero if any operation fails.

After merging the script to `main` and deploying, run it once via Render
Shell:

```bash
npx tsx prisma/<your-script>.ts
```

Do **not** wire seed scripts into `render-build.sh`. They are one-time
operations, not deploy-time work.

## Authentication bootstrap

After a fresh database setup (or after Auth-1 ships to a new environment):

1. **Bootstrap the first admin** (only if the User table is empty):
   ```bash
   npx tsx prisma/bootstrap-admin.ts
   ```
   This creates `admin@university-dss.local` with a random password printed
   once to stdout.

2. **Promote an existing seeded user** (if the User table already has users
   from prior seeds but none have passwords):
   ```bash
   npx tsx prisma/promote-admin.ts                        # defaults to sysadmin@university.edu
   npx tsx prisma/promote-admin.ts user@example.com       # target a specific email
   ```
   Generates a random password, sets `mustChangePassword=true`. The user
   must change their password on first login at `/login`.

Both scripts refuse to act if the target user already has a password hash.

## Retired migration scripts

These scripts in `prisma/` have already run against production and are
**not** invoked on deploy. They remain in the repo as historical record.
Do not run them again — doing so may fail or produce duplicate data.

| Script | Slice | What it did |
|--------|-------|-------------|
| `migrate-slice2.mjs` | Slice 2 | Added MeetingCalendar columns, created APCEEvent and InAppNotification tables |
| `migrate-asrb-slice2.mjs` | ASRB Slice 2 | Created FeederClient, ASRBCase, CaseAttachment, CaseAuditEvent tables; seeded 2 feeder clients |
| `migrate-asrb-slice1-completion.mjs` | ASRB Slice 1 | Created ComplianceRule, ComplianceEvaluation, RuleEvaluation tables |
| `seed-asrb-cases.mjs` | ASRB Slice 2 | Inserted 20 ASRB case fixtures |
| `migrate-remediation-slice3-prereqs.mjs` | Slice 3 prereqs | Created ASRBMeeting, ASRBMember tables; added 7 ASRB roles to UserRole enum |
| `seed-remediation-slice3-prereqs.mjs` | Slice 3 prereqs | Inserted 2 meetings, 6 members, 7 ASRB-role users |
| `migrate-argon2id-api-keys.mjs` | API key migration | Re-hashed FeederClient API keys from bcrypt to argon2id |
| `seed-compliance-rules.ts` | Slice 3a.1 | Inserted 12 compliance rules via CatalogService |

## Note on app_data

The `app_data` table in this database belongs to `must-odoo-hr-tracker`, a
separate application sharing the same Render Postgres instance. The
board-governance Prisma schema marks it with `@@ignore` so Prisma does not
manage it. Do not drop, alter, or query this table from board-governance
code.
