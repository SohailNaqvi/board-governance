import prisma from "@/lib/prisma";
import type { BoardActionItem } from "@prisma/client";

export interface ActionFilters {
  status?: string[];
  category?: string[];
  search?: string;
}

/**
 * List all board action items with optional filtering.
 * Filters by status (IN), category (IN), and search on description/actionRef (iContains).
 * Ordered by dueDate ascending.
 */
export async function listActions(
  filters?: ActionFilters
): Promise<BoardActionItem[]> {
  const where: Record<string, unknown> = {};

  if (filters?.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }

  if (filters?.category && filters.category.length > 0) {
    where.category = { in: filters.category };
  }

  if (filters?.search) {
    where.OR = [
      { description: { contains: filters.search, mode: "insensitive" } },
      { actionRef: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.boardActionItem.findMany({
    where,
    orderBy: { dueDate: "asc" },
  });
}

/**
 * Get a single action item by actionRef (unique identifier).
 * Returns null if not found.
 */
export async function getAction(
  actionRef: string
): Promise<BoardActionItem | null> {
  return prisma.boardActionItem.findUnique({
    where: { actionRef },
  });
}

/**
 * Get total count of board action items.
 */
export async function getActionCount(): Promise<number> {
  return prisma.boardActionItem.count();
}

/**
 * Get action statistics for KPI display.
 * Includes: total, overdue, atRisk, completedThisQuarter.
 */
export async function getActionStats(): Promise<{
  total: number;
  overdue: number;
  atRisk: number;
  completedThisQuarter: number;
}> {
  const total = await prisma.boardActionItem.count();

  const overdue = await prisma.boardActionItem.count({
    where: { status: "OVERDUE" },
  });

  const atRisk = await prisma.boardActionItem.count({
    where: { status: "AT_RISK" },
  });

  // Current quarter: assume Q2 2025 (Apr-Jun), adjust as needed
  const quarterStart = new Date(new Date().getFullYear(), 3, 1); // April 1
  const quarterEnd = new Date(new Date().getFullYear(), 6, 0); // June 30

  const completedThisQuarter = await prisma.boardActionItem.count({
    where: {
      status: { in: ["COMPLETED", "CLOSED"] },
      updatedAt: { gte: quarterStart, lte: quarterEnd },
    },
  });

  return { total, overdue, atRisk, completedThisQuarter };
}
