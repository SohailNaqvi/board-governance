/**
 * Playwright global teardown — cleans up seeded data.
 */

import { teardownRules, teardownAsrbCases, teardownAll } from "./seed";

export default async function globalTeardown() {
  try {
    console.log("[e2e] Cleaning up seeded rules...");
    await teardownRules();
    console.log("[e2e] Cleaned up rules.");

    console.log("[e2e] Cleaning up seeded ASRB cases...");
    await teardownAsrbCases();
    console.log("[e2e] Cleaned up ASRB cases.");

    console.log("[e2e] Disconnecting Prisma...");
    await teardownAll();
    console.log("[e2e] Done.");
  } catch (err) {
    console.error("[e2e] Teardown error:", err);
  }
}
