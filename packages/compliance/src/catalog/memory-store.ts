/**
 * In-Memory Rule Store — for unit tests and local development.
 */

import { randomUUID } from "crypto";
import type { ComplianceRuleRecord, IRuleStore, RuleFilter } from "./types.js";

export class MemoryRuleStore implements IRuleStore {
  private rules: ComplianceRuleRecord[] = [];

  async findById(id: string): Promise<ComplianceRuleRecord | null> {
    return this.rules.find((r) => r.id === id) ?? null;
  }

  async findByRuleId(ruleId: string): Promise<ComplianceRuleRecord[]> {
    return this.rules
      .filter((r) => r.ruleId === ruleId)
      .sort((a, b) => b.version - a.version);
  }

  async findEffectiveByRuleId(ruleId: string): Promise<ComplianceRuleRecord | null> {
    return this.rules.find((r) => r.ruleId === ruleId && r.status === "EFFECTIVE") ?? null;
  }

  async findAll(filter?: RuleFilter): Promise<ComplianceRuleRecord[]> {
    let result = [...this.rules];

    if (filter?.ruleId) result = result.filter((r) => r.ruleId === filter.ruleId);
    if (filter?.source) result = result.filter((r) => r.source === filter.source);
    if (filter?.status) result = result.filter((r) => r.status === filter.status);
    if (filter?.caseType) {
      result = result.filter((r) => {
        const types: string[] = JSON.parse(r.appliesToCaseTypes);
        return types.includes(filter.caseType!);
      });
    }

    return result.sort((a, b) => a.ruleId.localeCompare(b.ruleId) || b.version - a.version);
  }

  async findEffective(caseType?: string): Promise<ComplianceRuleRecord[]> {
    let result = this.rules.filter((r) => r.status === "EFFECTIVE");

    if (caseType) {
      result = result.filter((r) => {
        const types: string[] = JSON.parse(r.appliesToCaseTypes);
        return types.includes(caseType);
      });
    }

    return result;
  }

  async create(
    data: Omit<ComplianceRuleRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<ComplianceRuleRecord> {
    const now = new Date();
    const record: ComplianceRuleRecord = {
      ...data,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.rules.push(record);
    return { ...record };
  }

  async update(id: string, data: Partial<ComplianceRuleRecord>): Promise<ComplianceRuleRecord> {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Rule not found: ${id}`);

    this.rules[idx] = {
      ...this.rules[idx],
      ...data,
      updatedAt: new Date(),
    };
    return { ...this.rules[idx] };
  }

  /** Test helper: reset the store */
  clear(): void {
    this.rules = [];
  }

  /** Test helper: get count */
  count(): number {
    return this.rules.length;
  }
}
