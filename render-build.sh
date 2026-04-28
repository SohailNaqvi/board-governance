#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────────────────────────
# render-build.sh — Render deploy build script
#
# Cleaned up in Slice Deploy-1 (PR #17, April 2026).
#
# The following one-time migration and seed scripts were removed from
# this build because they have already run successfully against the
# production database. They remain in prisma/ as historical record:
#
#   - migrate-slice2.mjs              (Slice 2 schema: MeetingCalendar cols, APCEEvent, InAppNotification)
#   - migrate-asrb-slice2.mjs         (ASRB Slice 2: FeederClient, ASRBCase, CaseAttachment, CaseAuditEvent)
#   - migrate-asrb-slice1-completion.mjs (ASRB Slice 1: ComplianceRule, ComplianceEvaluation, RuleEvaluation)
#   - seed-asrb-cases.mjs             (20 ASRB case fixtures)
#   - migrate-remediation-slice3-prereqs.mjs (Slice 3 prereqs: ASRBMeeting, ASRBMember, ASRB UserRole values)
#   - seed-remediation-slice3-prereqs.mjs    (2 meetings, 6 members, 7 ASRB users)
#   - migrate-argon2id-api-keys.mjs   (API key hash migration to argon2id)
#
# Going forward, schema changes use "npx prisma db push" via Render Shell
# (manual, deliberate, observed). Seed scripts run via Render Shell once.
# See docs/deployment.md for the full workflow.
# ─────────────────────────────────────────────────────────────────

echo "=== Installing pnpm ==="
npm install -g pnpm@9

echo "=== Installing dependencies (including dev) ==="
NODE_ENV=development pnpm install --no-frozen-lockfile

echo "=== Generating Prisma client ==="
# Hide pnpm files so prisma doesn't try 'pnpm add' (which fails in workspaces)
mv pnpm-lock.yaml pnpm-lock.yaml.bak
mv pnpm-workspace.yaml pnpm-workspace.yaml.bak

cd apps/web
npx prisma@5.22.0 generate --schema=../../prisma/schema.prisma

# Restore pnpm files
cd ../..
mv pnpm-lock.yaml.bak pnpm-lock.yaml
mv pnpm-workspace.yaml.bak pnpm-workspace.yaml

echo "=== Building Next.js ==="
cd apps/web
npx next build

echo "=== Build complete ==="
