/**
 * Tests for PrismaRuleStore adapter.
 *
 * These tests mock the Prisma client to verify that PrismaRuleStore
 * correctly translates between IRuleStore calls and Prisma queries,
 * and properly maps Prisma rows to ComplianceRuleRecord domain objects.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ComplianceRuleRecord } from "@ums/compliance";

// ─── Prisma mock setup ──────────────────────────────────────────────

const mockComplianceRule = {
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

vi.mock("../../apps/web/src/lib/prisma", () => ({
  default: {
    complianceRule: mockComplianceRule,
  },
}));

// Must import AFTER vi.mock so the mock is in place
const { createPrismaRuleStore } = await import(
  "../../apps/web/src/lib/asrb/prisma-rule-store"
);

// ─── Test fixtures ──────────────────────────────────────────────────

const now = new Date("2025-01-15T10:00:00Z");

function makePrismaRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "clr_abc123",
    ruleId: "HEC_PHD_SUPERVISOR_QUALIFICATION",
    source: "HEC",
    sourceReference: "HEC PhD Policy 2023, Section 4.2",
    appliesToCaseTypes: '["PHD_REGISTRATION","PHD_SUPERVISOR_CHANGE"]',
    appliesToProgrammeTypes: null,
    severity: "BLOCKING",
    evaluation: '{"gte":[{"ref":"supervisor.qualification"},"PhD"]}',
    messageTemplate: "Supervisor must hold a PhD",
    effectiveFrom: now,
    effectiveTo: null,
    version: 1,
    status: "DRAFT",
    lastEditedBy: "admin@example.com",
    lastEditedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("PrismaRuleStore", () => {
  let store: ReturnType<typeof createPrismaRuleStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the singleton so each test gets a fresh store.
    // The module caches `_store`; we re-import to work around that.
    // Since createPrismaRuleStore is a singleton factory, we call it once.
    store = createPrismaRuleStore();
  });

  // ─── findById (read) ────────────────────────────────────────────

  it("findById returns a mapped ComplianceRuleRecord when row exists", async () => {
    const row = makePrismaRow();
    mockComplianceRule.findUnique.mockResolvedValueOnce(row);

    const result = await store.findById("clr_abc123");

    expect(mockComplianceRule.findUnique).toHaveBeenCalledWith({
      where: { id: "clr_abc123" },
    });
    expect(result).not.toBeNull();
    const r = result as ComplianceRuleRecord;
    expect(r.id).toBe("clr_abc123");
    expect(r.ruleId).toBe("HEC_PHD_SUPERVISOR_QUALIFICATION");
    expect(r.source).toBe("HEC");
    expect(r.severity).toBe("BLOCKING");
    expect(r.status).toBe("DRAFT");
    expect(r.version).toBe(1);
    expect(r.createdAt).toEqual(now);
  });

  it("findById returns null when row does not exist", async () => {
    mockComplianceRule.findUnique.mockResolvedValueOnce(null);

    const result = await store.findById("nonexistent");

    expect(result).toBeNull();
  });

  // ─── create ─────────────────────────────────────────────────────

  it("create passes correct data to Prisma and returns mapped record", async () => {
    const row = makePrismaRow();
    mockComplianceRule.create.mockResolvedValueOnce(row);

    const input: Omit<ComplianceRuleRecord, "id" | "createdAt" | "updatedAt"> = {
      ruleId: "HEC_PHD_SUPERVISOR_QUALIFICATION",
      source: "HEC",
      sourceReference: "HEC PhD Policy 2023, Section 4.2",
      appliesToCaseTypes: '["PHD_REGISTRATION","PHD_SUPERVISOR_CHANGE"]',
      appliesToProgrammeTypes: null,
      severity: "BLOCKING",
      evaluation: '{"gte":[{"ref":"supervisor.qualification"},"PhD"]}',
      messageTemplate: "Supervisor must hold a PhD",
      effectiveFrom: now,
      effectiveTo: null,
      version: 1,
      status: "DRAFT",
      lastEditedBy: "admin@example.com",
      lastEditedAt: now,
    };

    const result = await store.create(input);

    expect(mockComplianceRule.create).toHaveBeenCalledTimes(1);
    const callData = mockComplianceRule.create.mock.calls[0][0].data;
    expect(callData.ruleId).toBe("HEC_PHD_SUPERVISOR_QUALIFICATION");
    expect(callData.source).toBe("HEC");
    expect(callData.severity).toBe("BLOCKING");
    expect(callData.version).toBe(1);
    expect(callData.status).toBe("DRAFT");

    expect(result.id).toBe("clr_abc123");
    expect(result.ruleId).toBe("HEC_PHD_SUPERVISOR_QUALIFICATION");
  });

  // ─── findAll with filters ───────────────────────────────────────

  it("findAll builds correct where clause from filter", async () => {
    mockComplianceRule.findMany.mockResolvedValueOnce([]);

    await store.findAll({
      source: "HEC",
      status: "EFFECTIVE",
      caseType: "PHD_REGISTRATION",
    });

    const call = mockComplianceRule.findMany.mock.calls[0][0];
    expect(call.where.source).toBe("HEC");
    expect(call.where.status).toBe("EFFECTIVE");
    expect(call.where.appliesToCaseTypes).toEqual({ contains: "PHD_REGISTRATION" });
    expect(call.orderBy).toEqual([{ ruleId: "asc" }, { version: "desc" }]);
  });

  // ─── error path ─────────────────────────────────────────────────

  it("propagates Prisma errors to the caller", async () => {
    const prismaError = new Error("Unique constraint violation");
    mockComplianceRule.create.mockRejectedValueOnce(prismaError);

    await expect(
      store.create({
        ruleId: "DUPLICATE_RULE",
        source: "HEC",
        sourceReference: null,
        appliesToCaseTypes: '["PHD_REGISTRATION"]',
        appliesToProgrammeTypes: null,
        severity: "BLOCKING",
        evaluation: "{}",
        messageTemplate: "Test",
        effectiveFrom: null,
        effectiveTo: null,
        version: 1,
        status: "DRAFT",
        lastEditedBy: null,
        lastEditedAt: null,
      })
    ).rejects.toThrow("Unique constraint violation");
  });

  // ─── update ─────────────────────────────────────────────────────

  it("update only sends changed fields to Prisma", async () => {
    const updatedRow = makePrismaRow({ status: "EFFECTIVE", version: 2 });
    mockComplianceRule.update.mockResolvedValueOnce(updatedRow);

    const result = await store.update("clr_abc123", {
      status: "EFFECTIVE" as const,
      version: 2,
    });

    const call = mockComplianceRule.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "clr_abc123" });
    expect(call.data.status).toBe("EFFECTIVE");
    expect(call.data.version).toBe(2);
    // Fields not passed should not be in updateData
    expect(call.data.ruleId).toBeUndefined();
    expect(call.data.source).toBeUndefined();

    expect(result.status).toBe("EFFECTIVE");
    expect(result.version).toBe(2);
  });
});
