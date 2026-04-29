import prisma from "@/lib/prisma";
import type { ASRBCase, FeederClient, CaseAttachment, CaseAuditEvent, ComplianceEvaluation } from "@prisma/client";

export type CaseWithRelations = ASRBCase & {
  feederClient: FeederClient;
  attachments: CaseAttachment[];
  auditEvents: CaseAuditEvent[];
  complianceEvaluations: ComplianceEvaluation[];
};

export interface ListCasesFilters {
  status?: string[];
  caseType?: string[];
  urgency?: string[];
  feederBodyType?: string[];
  search?: string;
}

/**
 * List ASRB cases with optional filters.
 * Filters are combined with AND logic between groups, OR within groups.
 */
export async function listCases(filters?: ListCasesFilters) {
  const where: Record<string, unknown> = {};

  // Status filter (OR within group)
  if (filters?.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  // CaseType filter (OR within group)
  if (filters?.caseType && filters.caseType.length > 0) {
    where.caseType = { in: filters.caseType };
  }

  // Urgency filter (OR within group)
  if (filters?.urgency && filters.urgency.length > 0) {
    where.urgency = { in: filters.urgency };
  }

  // FeederBodyType filter (OR within group)
  if (filters?.feederBodyType && filters.feederBodyType.length > 0) {
    where.feederBodyType = { in: filters.feederBodyType };
  }

  // Search filter (OR on receiptReference or studentRegNo)
  if (filters?.search && filters.search.length > 0) {
    const q = filters.search.toLowerCase();
    where.OR = [
      { receiptReference: { contains: q, mode: "insensitive" } },
      { studentRegNo: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.aSRBCase.findMany({
    where,
    include: {
      feederClient: true,
    },
    orderBy: { receivedAt: "desc" },
  });
}

/**
 * Get a single case by ID with all relations.
 * Returns null if not found.
 */
export async function getCase(id: string): Promise<CaseWithRelations | null> {
  return prisma.aSRBCase.findUnique({
    where: { id },
    include: {
      feederClient: true,
      attachments: true,
      auditEvents: {
        orderBy: { occurredAt: "desc" },
      },
      complianceEvaluations: {
        orderBy: { evaluatedAt: "desc" },
      },
    },
  });
}

/**
 * Get total count of ASRB cases.
 */
export async function getCaseCount(): Promise<number> {
  return prisma.aSRBCase.count();
}
