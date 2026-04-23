/**
 * Playwright global setup — seeds compliance rules before all tests.
 */

import { seedRules } from "./seed";

export default async function globalSetup() {
  console.log("[e2e] Seeding compliance rules...");
  const ids = await seedRules();
  console.log(`[e2e] Seeded ${ids.length} rules.`);

  // Store IDs for teardown
  process.env.E2E_SEEDED_IDS = JSON.stringify(ids);
}
