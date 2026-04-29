/**
 * Seed script for board action items — creates 20 items idempotently.
 * Run with: ts-node prisma/seed-board-actions.ts
 */

import { PrismaClient, BoardActionCategory, BoardActionStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedActionItem {
  actionRef: string;
  description: string;
  sourceMeeting: string;
  category: BoardActionCategory;
  ownerName: string;
  ownerUnit: string;
  dueDate: Date;
  status: BoardActionStatus;
  progressPercent: number;
}

const ACTION_ITEMS: SeedActionItem[] = [
  // 13 items from prototype (BOARD_ACTION_ITEMS)
  {
    actionRef: "BAI-2025-001",
    description: "Submit VC performance contract draft to board chair",
    sourceMeeting: "Q2 May 25",
    category: "GOVERNANCE",
    ownerName: "Registrar",
    ownerUnit: "REG",
    dueDate: new Date("2025-06-01"),
    status: "OVERDUE",
    progressPercent: 20,
  },
  {
    actionRef: "BAI-2025-002",
    description: "Finalise Finance & Audit Committee Terms of Reference",
    sourceMeeting: "Q2 May 25",
    category: "GOVERNANCE",
    ownerName: "Board Chair",
    ownerUnit: "REG",
    dueDate: new Date("2025-06-15"),
    status: "OVERDUE",
    progressPercent: 40,
  },
  {
    actionRef: "BAI-2025-003",
    description:
      "Prepare HEC W-category improvement plan (target: W2 by 2027)",
    sourceMeeting: "Q2 May 25",
    category: "STRATEGIC",
    ownerName: "VC",
    ownerUnit: "DPD",
    dueDate: new Date("2025-07-30"),
    status: "IN_PROGRESS",
    progressPercent: 60,
  },
  {
    actionRef: "BAI-2025-004",
    description: "Submit QEC annual self-assessment report to Academic Committee",
    sourceMeeting: "Q2 May 25",
    category: "ACADEMIC",
    ownerName: "QEC Director",
    ownerUnit: "QEC",
    dueDate: new Date("2025-08-11"),
    status: "OVERDUE",
    progressPercent: 30,
  },
  {
    actionRef: "BAI-2025-005",
    description: "Endowment fund investment policy — annual review",
    sourceMeeting: "Q2 May 25",
    category: "FINANCIAL",
    ownerName: "Treasurer",
    ownerUnit: "TRS",
    dueDate: new Date("2025-08-30"),
    status: "OPEN",
    progressPercent: 0,
  },
  {
    actionRef: "BAI-2025-006",
    description: "Update COI register — all board members",
    sourceMeeting: "Q2 May 25",
    category: "GOVERNANCE",
    ownerName: "Registrar",
    ownerUnit: "REG",
    dueDate: new Date("2025-08-01"),
    status: "AT_RISK",
    progressPercent: 77,
  },
  {
    actionRef: "BAI-2025-007",
    description: "Research grant strategy paper — present to Academic Committee",
    sourceMeeting: "Q1 Feb 25",
    category: "ACADEMIC",
    ownerName: "VC",
    ownerUnit: "ORC",
    dueDate: new Date("2025-09-01"),
    status: "OPEN",
    progressPercent: 10,
  },
  {
    actionRef: "BAI-2025-008",
    description: "Risk register — annual review and board approval",
    sourceMeeting: "Q1 Feb 25",
    category: "GOVERNANCE",
    ownerName: "Infra & Risk Chair",
    ownerUnit: "DPD",
    dueDate: new Date("2025-09-15"),
    status: "OPEN",
    progressPercent: 0,
  },
  {
    actionRef: "BAI-2025-009",
    description: "PhD faculty recruitment plan — 12 new positions by Dec 2026",
    sourceMeeting: "Q1 Feb 25",
    category: "ACADEMIC",
    ownerName: "VC",
    ownerUnit: "DHR",
    dueDate: new Date("2025-10-01"),
    status: "IN_PROGRESS",
    progressPercent: 25,
  },
  {
    actionRef: "BAI-2025-010",
    description: "Conflict of interest training for all board members",
    sourceMeeting: "Q1 Feb 25",
    category: "GOVERNANCE",
    ownerName: "Governance Chair",
    ownerUnit: "REG",
    dueDate: new Date("2025-11-01"),
    status: "OPEN",
    progressPercent: 0,
  },
  {
    actionRef: "BAI-2025-011",
    description: "Annual student satisfaction survey — results to board",
    sourceMeeting: "Q3 Aug 25",
    category: "ACADEMIC",
    ownerName: "Registrar",
    ownerUnit: "DSA",
    dueDate: new Date("2025-11-15"),
    status: "OPEN",
    progressPercent: 0,
  },
  {
    actionRef: "BAI-2025-012",
    description: "Strategic plan mid-year review presentation",
    sourceMeeting: "Q3 Aug 25",
    category: "STRATEGIC",
    ownerName: "VC",
    ownerUnit: "DPD",
    dueDate: new Date("2025-08-18"),
    status: "COMPLETED",
    progressPercent: 100,
  },
  {
    actionRef: "BAI-2025-013",
    description: "External auditors appointment for FY2025",
    sourceMeeting: "Q1 Feb 25",
    category: "FINANCIAL",
    ownerName: "F&A Chair",
    ownerUnit: "TRS",
    dueDate: new Date("2025-03-15"),
    status: "COMPLETED",
    progressPercent: 100,
  },
  // 7 fresh items reflecting Pakistani HE board priorities
  {
    actionRef: "BAI-2026-001",
    description: "HEC W-category submission Q3 2026 — compile institutional profile",
    sourceMeeting: "Q4 Nov 25",
    category: "COMPLIANCE",
    ownerName: "VC",
    ownerUnit: "DPD",
    dueDate: new Date("2026-09-30"),
    status: "IN_PROGRESS",
    progressPercent: 35,
  },
  {
    actionRef: "BAI-2026-002",
    description: "PhD faculty target — 8 new appointments by June 2027",
    sourceMeeting: "Q4 Nov 25",
    category: "ACADEMIC",
    ownerName: "VC",
    ownerUnit: "DHR",
    dueDate: new Date("2027-06-30"),
    status: "IN_PROGRESS",
    progressPercent: 15,
  },
  {
    actionRef: "BAI-2026-003",
    description: "Endowment policy mid-year review — present to F&A Committee",
    sourceMeeting: "Q1 Feb 26",
    category: "FINANCIAL",
    ownerName: "Treasurer",
    ownerUnit: "TRS",
    dueDate: new Date("2026-07-15"),
    status: "OPEN",
    progressPercent: 0,
  },
  {
    actionRef: "BAI-2026-004",
    description: "Strategic plan FY27 drafting — stakeholder consultation phase",
    sourceMeeting: "Q1 Feb 26",
    category: "STRATEGIC",
    ownerName: "VC",
    ownerUnit: "DPD",
    dueDate: new Date("2026-08-31"),
    status: "IN_PROGRESS",
    progressPercent: 10,
  },
  {
    actionRef: "BAI-2026-005",
    description: "PHEC regulatory compliance audit preparation — documentation review",
    sourceMeeting: "Q1 Feb 26",
    category: "COMPLIANCE",
    ownerName: "Registrar",
    ownerUnit: "REG",
    dueDate: new Date("2026-06-30"),
    status: "AT_RISK",
    progressPercent: 45,
  },
  {
    actionRef: "BAI-2026-006",
    description: "Alumni engagement strategy — launch digital platform pilot",
    sourceMeeting: "Q2 May 26",
    category: "STRATEGIC",
    ownerName: "Director Student Affairs",
    ownerUnit: "DSA",
    dueDate: new Date("2026-10-15"),
    status: "OPEN",
    progressPercent: 5,
  },
  {
    actionRef: "BAI-2026-007",
    description: "Board governance training programme — schedule for new members",
    sourceMeeting: "Q2 May 26",
    category: "GOVERNANCE",
    ownerName: "Registrar",
    ownerUnit: "REG",
    dueDate: new Date("2026-07-01"),
    status: "CLOSED",
    progressPercent: 100,
  },
];

async function main() {
  console.log("Seeding board action items...");

  for (const item of ACTION_ITEMS) {
    try {
      const result = await prisma.boardActionItem.upsert({
        where: { actionRef: item.actionRef },
        update: item,
        create: item,
      });
      console.log(`✓ ${item.actionRef}: ${item.status}`);
    } catch (error) {
      console.error(`✗ Failed to seed ${item.actionRef}:`, error);
      process.exit(1);
    }
  }

  console.log(
    `\n✓ Successfully seeded ${ACTION_ITEMS.length} board action items.`
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
