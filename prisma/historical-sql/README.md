# Historical SQL Migration Scripts

These scripts were used to evolve the database schema before Prisma Migrate was adopted. They are retained for audit reference only and **must not be executed** — all schema changes are now managed through `prisma migrate`.

| Script | Purpose | Superseded by |
|--------|---------|---------------|
| `migrate-slice2.mjs` | Added MeetingStatus, APCEEventStatus enums; MeetingCalendar columns; APCEEvent and InAppNotification tables | `prisma/migrations/0_initial_asrb_baseline/` |
| `migrate-asrb-slice2.mjs` | Created ASRB enums, FeederClient, ASRBCase, CaseAttachment, CaseAuditEvent tables; seeded feeder clients | `prisma/migrations/0_initial_asrb_baseline/` + seed scripts |
| `migrate-asrb-slice1-completion.mjs` | Created compliance enums and tables (ComplianceRule, ComplianceEvaluation, RuleEvaluation) | `prisma/migrations/0_initial_asrb_baseline/` |
| `migrate-remediation-slice3-prereqs.mjs` | Created ASRBMeetingStatus, ASRBMemberRoleType, ComplianceEvaluationStatus enums; extended UserRole; created ASRBMeeting, ASRBMember tables | `prisma/migrations/0_initial_asrb_baseline/` |

See [ADR 0005](../../docs/adr/0005-prisma-migrate-adoption.md) for the migration transition decision.
