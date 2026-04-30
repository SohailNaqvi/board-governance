import prisma from "@/lib/prisma";
import { GovernanceBodyType, DecisionCategory, DecisionStatus } from "@prisma/client";

export interface DecisionFilters {
  sourceBodyType?: GovernanceBodyType[];
  status?: DecisionStatus[];
  category?: DecisionCategory[];
  search?: string;
}

export async function listDecisions(filters?: DecisionFilters) {
  const where: any = {};

  if (filters?.sourceBodyType && filters.sourceBodyType.length > 0) {
    where.sourceBodyType = {
      in: filters.sourceBodyType,
    };
  }

  if (filters?.status && filters.status.length > 0) {
    where.status = {
      in: filters.status,
    };
  }

  if (filters?.category && filters.category.length > 0) {
    where.category = {
      in: filters.category,
    };
  }

  if (filters?.search) {
    where.OR = [
      {
        title: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        summary: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        decisionRef: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ];
  }

  const decisions = await prisma.governanceDecision.findMany({
    where,
    orderBy: {
      decidedAt: "desc",
    },
  });

  return decisions;
}

export async function getDecision(decisionRef: string) {
  return prisma.governanceDecision.findUnique({
    where: { decisionRef },
  });
}

export async function getDecisionCount() {
  return prisma.governanceDecision.count();
}

export async function getDecisionStats() {
  const total = await prisma.governanceDecision.count();

  // Get approved decisions this quarter (assuming current quarter)
  const quarterStart = new Date();
  quarterStart.setMonth(quarterStart.getMonth() - 3);
  quarterStart.setDate(1);

  const approvedThisQuarter = await prisma.governanceDecision.count({
    where: {
      status: { in: ["APPROVED", "RATIFIED"] },
      decidedAt: {
        gte: quarterStart,
      },
    },
  });

  const deferred = await prisma.governanceDecision.count({
    where: {
      status: "DEFERRED",
    },
  });

  const rejected = await prisma.governanceDecision.count({
    where: {
      status: "REJECTED",
    },
  });

  return {
    total,
    approvedThisQuarter,
    deferred,
    rejected,
  };
}
