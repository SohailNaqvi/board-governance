/**
 * Playwright global teardown — removes seeded compliance rules.
 *
 * Runs in a separate process from global-setup, so we can't share in-memory
 * state. Instead, we clean up by the SEED_AUTHOR marker.
 */

import { PrismaClient } from "@prisma/client";

const SEED_AUTHOR = "e2e-seed@playwright.test";

export default async function globalTeardown() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.complianceRule.deleteMany({
      where: { lastEditedBy: SEED_AUTHOR },
    });
    console.log(`[e2e] Teardown: removed ${result.count} seeded rules.`);
  } finally {
    await prisma.$disconnect();
  }
}
