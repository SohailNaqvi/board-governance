#!/usr/bin/env bash
set -e

echo "=== Installing pnpm ==="
npm install -g pnpm@9

echo "=== Installing dependencies ==="
pnpm install --no-frozen-lockfile

echo "=== Generating Prisma client ==="
cd apps/web
npx prisma@5.22.0 generate --schema=../../prisma/schema.prisma

echo "=== Building Next.js ==="
npx next build

echo "=== Build complete ==="
