#!/usr/bin/env bash
set -e

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

echo "=== Running Prisma migrations ==="
# On first deploy after adopting Prisma Migrate, run:
#   npx prisma migrate resolve --applied "0_initial_asrb_baseline"
# to mark the baseline as already applied. Subsequent deploys just use:
cd apps/web
npx prisma@5.22.0 migrate deploy --schema=../../prisma/schema.prisma
cd ../..

echo "=== Seeding data ==="
# Feeder clients must be seeded before cases (cases reference feeder client IDs)
node prisma/seed-feeder-clients.mjs
node prisma/seed-asrb-cases.mjs
node prisma/seed-remediation-slice3-prereqs.mjs

echo "=== Building Next.js ==="
cd apps/web
npx next build

echo "=== Build complete ==="
