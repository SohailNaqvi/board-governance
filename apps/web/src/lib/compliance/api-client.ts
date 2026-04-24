/**
 * Typed fetch wrapper for the compliance rules API.
 *
 * Design decision: raw fetch with typed wrapper (not TanStack Query).
 * Rationale: the app already uses raw fetch everywhere, this is read-only,
 * and three endpoints don't justify adding a caching/state library.
 * This choice is locked for 3b-1, 3b-2, and 3b-3.
 */

import type { ComplianceRuleRecord, RuleFilter } from "@ums/compliance";

// ─── Response Shapes ────────────────────────────────────────────

export interface RulesListResponse {
  rules: ComplianceRuleRecord[];
  count: number;
}

export interface RuleVersionsResponse {
  ruleId: string;
  versions: ComplianceRuleRecord[];
  count: number;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

// ─── Client ─────────────────────────────────────────────────────

class ComplianceApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: ApiError
  ) {
    super(message);
    this.name = "ComplianceApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({
      error: res.statusText,
    }))) as ApiError;
    throw new ComplianceApiError(body.error, res.status, body);
  }

  return res.json() as Promise<T>;
}

/** Fetch all rules, optionally filtered. */
export function fetchRules(
  filter?: RuleFilter
): Promise<RulesListResponse> {
  const params = new URLSearchParams();
  if (filter?.ruleId) params.set("ruleId", filter.ruleId);
  if (filter?.source) params.set("source", filter.source);
  if (filter?.status) params.set("status", filter.status);
  if (filter?.caseType) params.set("caseType", filter.caseType);

  const qs = params.toString();
  return request<RulesListResponse>(
    `/api/admin/compliance/rules${qs ? `?${qs}` : ""}`
  );
}

/** Fetch a single rule by its database ID. */
export function fetchRule(id: string): Promise<ComplianceRuleRecord> {
  return request<ComplianceRuleRecord>(
    `/api/admin/compliance/rules/${encodeURIComponent(id)}`
  );
}

/** Fetch all versions of a rule by its stable ruleId. */
export function fetchRuleVersions(
  ruleId: string
): Promise<RuleVersionsResponse> {
  return request<RuleVersionsResponse>(
    `/api/admin/compliance/rules/${encodeURIComponent(ruleId)}/versions`
  );
}

export { ComplianceApiError };
