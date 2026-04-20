# One-Time Scripts

Scripts in this directory are meant to be run exactly once, typically as part of a specific remediation or migration step. They are not part of the regular build or deploy pipeline.

| Script | Purpose | Status |
|--------|---------|--------|
| `migrate-argon2id-api-keys.mjs` | Rotates existing SHA-256-hashed API keys to argon2id. Generates new random keys, prints them to stdout, and updates the DB. | **Already run on Render production** (PR #6). Do not re-run unless re-seeding from scratch. |

## Running a one-time script

```bash
# Ensure DATABASE_URL is set
node scripts/one-time/migrate-argon2id-api-keys.mjs
```

After running, update `.env` and any client configurations with the new keys printed to stdout.
