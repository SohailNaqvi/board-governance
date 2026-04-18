#!/usr/bin/env bash
set -e

echo "=== Installing pnpm ==="
npm install -g pnpm@9

echo "=== Installing dependencies ==="
pnpm install --no-frozen-lockfile

echo "=== Generating Prisma client ==="
mkdir -p /tmp/prisma-gen
cd /tmp/prisma-gen
npm init -y > /dev/null 2>&1
npm install prisma@5.22.0 @prisma/client@5.22.0 --save > /dev/null 2>&1
cd -
/tmp/prisma-gen/node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

echo "=== Building Next.js ==="
cd apps/web
npx next build

echo "=== Build complete ==="
