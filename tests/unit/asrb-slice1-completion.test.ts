import { describe, it, expect } from "vitest";
import {
  RuleSource,
  RuleSeverity,
  RuleOutcome,
  ComplianceStatus,
  ASRBCaseStatus,
  CaseType,
  CaseUrgency,
  FeederBodyType,
} from "@ums/domain";
import {
  Permissions,
  RolePermissions,
  hasPermission,
} from "@ums/domain";

describe("ASRB Slice 1 Completion - Enum Exports", () => {
  it("exports RuleSource enum with all values", () => {
    expect(RuleSource.HEC).toBe("HEC");
    expect(RuleSource.UNIVERSITY).toBe("UNIVERSITY");
    expect(RuleSource.FACULTY).toBe("FACULTY");
    expect(RuleSource.PROGRAMME).toBe("PROGRAMME");
    expect(Object.keys(RuleSource)).toHaveLength(4);
  });

  it("exports RuleSeverity enum with all values", () => {
    expect(RuleSeverity.BLOCKING).toBe("BLOCKING");
    expect(RuleSeverity.WARNING).toBe("WARNING");
    expect(RuleSeverity.INFORMATIONAL).toBe("INFORMATIONAL");
    expect(Object.keys(RuleSeverity)).toHaveLength(3);
  });

  it("exports RuleOutcome enum with all values", () => {
    expect(RuleOutcome.PASS).toBe("PASS");
    expect(RuleOutcome.FAIL).toBe("FAIL");
    expect(RuleOutcome.WARN).toBe("WARN");
    expect(RuleOutcome.NOT_APPLICABLE).toBe("NOT_APPLICABLE");
    expect(RuleOutcome.ERROR).toBe("ERROR");
    expect(Object.keys(RuleOutcome)).toHaveLength(5);
  });

  it("exports ComplianceStatus enum with all values", () => {
    expect(ComplianceStatus.COMPLIANT).toBe("COMPLIANT");
    expect(ComplianceStatus.NEEDS_REVIEW).toBe("NEEDS_REVIEW");
    expect(ComplianceStatus.NON_COMPLIANT).toBe("NON_COMPLIANT");
    expect(Object.keys(ComplianceStatus)).toHaveLength(3);
  });

  it("exports pre-existing ASRB enums", () => {
    expect(Object.keys(ASRBCaseStatus).length).toBeGreaterThanOrEqual(10);
    expect(Object.keys(CaseType).length).toBeGreaterThanOrEqual(12);
    expect(Object.keys(CaseUrgency)).toHaveLength(2);
    expect(Object.keys(FeederBodyType)).toHaveLength(2);
  });
});

describe("ASRB Slice 1 Completion - Permission Catalog", () => {
  it("defines ASRB_MANAGE_RULES permission", () => {
    expect(Permissions.ASRB_MANAGE_RULES).toBe("ASRB_MANAGE_RULES");
  });

  it("assigns ASRB_MANAGE_RULES to SYSTEM_ADMINISTRATOR role", () => {
    const sysAdminPerms = RolePermissions["SYSTEM_ADMINISTRATOR"];
    expect(sysAdminPerms).toBeDefined();
    expect(sysAdminPerms).toContain(Permissions.ASRB_MANAGE_RULES);
  });

  it("does not assign ASRB_MANAGE_RULES to non-admin roles", () => {
    const nonAdminRoles = [
      "AUTHORIZED_PROPOSER",
      "FEEDER_BODY_SECRETARY",
      "REGISTRAR",
      "TREASURER_LEGAL",
      "VICE_CHANCELLOR",
      "SYNDICATE_MEMBER",
    ];
    for (const role of nonAdminRoles) {
      const perms = RolePermissions[role] || [];
      expect(perms).not.toContain(Permissions.ASRB_MANAGE_RULES);
    }
  });

  it("hasPermission returns true for valid assignment", () => {
    expect(hasPermission("SYSTEM_ADMINISTRATOR", Permissions.ASRB_MANAGE_RULES)).toBe(true);
    expect(hasPermission("REGISTRAR", Permissions.BOARD_MANAGE_MEETINGS)).toBe(true);
  });

  it("hasPermission returns false for invalid assignment", () => {
    expect(hasPermission("SYNDICATE_MEMBER", Permissions.ASRB_MANAGE_RULES)).toBe(false);
    expect(hasPermission("NONEXISTENT_ROLE", Permissions.SYSTEM_ADMIN)).toBe(false);
  });

  it("every role in RolePermissions has at least one permission", () => {
    for (const [role, perms] of Object.entries(RolePermissions)) {
      expect(perms.length).toBeGreaterThan(0);
    }
  });

  it("all permission values are unique strings", () => {
    const values = Object.values(Permissions);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});
