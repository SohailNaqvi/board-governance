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

echo "=== Running Slice 2 DB migration ==="
# pg is in root dependencies, installed by pnpm install above
node prisma/migrate-slice2.mjs

echo "=== Running ASRB Slice 2 DB migration ==="
# ASRB tables and feeder clients
node prisma/migrate-asrb-slice2.mjs

echo "=== Running ASRB Slice 1 completion migration ==="
node prisma/migrate-asrb-slice1-completion.mjs

echo "=== Seeding ASRB cases ==="
node prisma/seed-asrb-cases.mjs

echo "=== Running Slice 3 prerequisites migration ==="
node prisma/migrate-remediation-slice3-prereqs.mjs

echo "=== Seeding Slice 3 prerequisites ==="
node prisma/seed-remediation-slice3-prereqs.mjs

echo "=== Building Next.js ==="
cd apps/web
npx next build

echo "=== Build complete ==="
