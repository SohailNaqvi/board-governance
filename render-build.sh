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

# Now prisma will detect npm and 'npm add' will work
cd apps/web
npx prisma@5.22.0 generate --schema=../../prisma/schema.prisma

# Restore pnpm files
cd ../..
mv pnpm-lock.yaml.bak pnpm-lock.yaml
mv pnpm-workspace.yaml.bak pnpm-workspace.yaml

echo "=== Running Slice 2 migration ==="
npm install pg --no-save
node prisma/migrate-slice2.mjs

echo "=== Building Next.js ==="
cd apps/web
npx next build

echo "=== Build complete ==="
