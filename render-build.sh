#!/usr/bin/env bash
set -e

echo "=== Installing pnpm ==="
npm install -g pnpm@9

echo "=== Installing dependencies ==="
pnpm install --no-frozen-lockfile

echo "=== Adding Prisma to workspace root ==="
pnpm add prisma@5.22.0 @prisma/client@5.22.0 -w -D

echo "=== Generating Prisma client ==="
cd apps/web
pnpm exec prisma generate --schema=../../prisma/schema.prisma

echo "=== Building Next.js ==="
npx next build

echo "=== Build complete ==="
