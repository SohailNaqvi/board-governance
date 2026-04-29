/**
 * Playwright global setup — seeds compliance rules and ASRB cases before all tests.
 */

import { seedRules, seedAsrbCases } from "./seed";

export default async function globalSetup() {
  console.log("[e2e] Seeding compliance rules...");
  const ruleIds = await seedRules();
  console.log(`[e2e] Seeded ${ruleIds.length} rules.`);

  console.log("[e2e] Seeding ASRB cases...");
  const caseIds = await seedAsrbCases();
  console.log(`[e2e] Seeded ${caseIds.length} ASRB cases.`);

  // Store IDs for teardown
  process.env.E2E_SEEDED_RULE_IDS = JSON.stringify(ruleIds);
  process.env.E2E_SEEDED_CASE_IDS = JSON.stringify(caseIds);
}
