#!/usr/bin/env bash
set -e

echo "=== Installing pnpm ==="
npm install -g pnpm@9

echo "=== Installing dependencies ==="
pnpm install --no-frozen-lockfile

echo "=== Generating Prisma client with npm (avoids pnpm workspace conflict) ==="
cd apps/web
npm install prisma@5.22.0 @prisma/client@5.22.0 --no-save
npx prisma@5.22.0 generate --schema=../../prisma/schema.prisma

echo "=== Building Next.js ==="
npx next build

echo "=== Build complete ==="
