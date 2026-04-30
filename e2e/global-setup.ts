/**
 * Playwright global setup — seeds compliance rules, ASRB cases, and board actions before all tests.
 */

import { seedRules, seedAsrbCases, seedBoardActions, seedDecisions } from "./seed";

export default async function globalSetup() {
  console.log("[e2e] Seeding compliance rules...");
  const ruleIds = await seedRules();
  console.log(`[e2e] Seeded ${ruleIds.length} rules.`);

  console.log("[e2e] Seeding ASRB cases...");
  const caseIds = await seedAsrbCases();
  console.log(`[e2e] Seeded ${caseIds.length} ASRB cases.`);

  console.log("[e2e] Seeding board action items...");
  const actionIds = await seedBoardActions();
  console.log(`[e2e] Seeded ${actionIds.length} board action items.`);

  console.log("[e2e] Seeding decisions...");
  const decisionIds = await seedDecisions();
  console.log(`[e2e] Seeded ${decisionIds.length} decisions.`);

  // Store IDs for teardown
  process.env.E2E_SEEDED_RULE_IDS = JSON.stringify(ruleIds);
  process.env.E2E_SEEDED_CASE_IDS = JSON.stringify(caseIds);
  process.env.E2E_SEEDED_ACTION_IDS = JSON.stringify(actionIds);
}
