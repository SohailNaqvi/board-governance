import { describe, it, expect, beforeEach } from "vitest";
import {
  getAttributeCatalog,
  resetAttributeCatalog,
  getAttributeEntries,
  getAttributeEntriesBySource,
  resolveAttributePath,
  type AttributeEntry,
} from "@ums/compliance";

describe("Attribute Catalog", () => {
  beforeEach(() => {
    resetAttributeCatalog();
  });

  describe("getAttributeCatalog", () => {
    it("returns a non-empty Map", () => {
      const catalog = getAttributeCatalog();
      expect(catalog).toBeInstanceOf(Map);
      expect(catalog.size).toBeGreaterThan(0);
    });

    it("returns same instance on repeated calls (singleton)", () => {
      const a = getAttributeCatalog();
      const b = getAttributeCatalog();
      expect(a).toBe(b);
    });

    it("returns fresh instance after reset", () => {
      const a = getAttributeCatalog();
      resetAttributeCatalog();
      const b = getAttributeCatalog();
      expect(a).not.toBe(b);
      // But should have same contents
      expect(a.size).toBe(b.size);
    });
  });

  describe("catalog contents", () => {
    it("contains case-level attributes", () => {
      const catalog = getAttributeCatalog();
      expect(catalog.has("case.caseType")).toBe(true);
      expect(catalog.has("case.status")).toBe(true);
      expect(catalog.has("case.urgency")).toBe(true);
      expect(catalog.has("case.studentRegNo")).toBe(true);
      expect(catalog.has("case.programmeCode")).toBe(true);
      expect(catalog.has("case.receivedAt")).toBe(true);
    });

    it("contains student attributes including new fields", () => {
      const catalog = getAttributeCatalog();
      expect(catalog.has("student.registrationNumber")).toBe(true);
      expect(catalog.has("student.enrollmentDate")).toBe(true);
      expect(catalog.has("student.courseworkCompleted")).toBe(true);
      expect(catalog.has("student.comprehensiveExamStatus")).toBe(true);
      expect(catalog.has("student.comprehensiveExamDate")).toBe(true);
    });

    it("contains supervisor attributes including publications", () => {
      const catalog = getAttributeCatalog();
      expect(catalog.has("supervisor.employeeId")).toBe(true);
      expect(catalog.has("supervisor.highestQualification.degree")).toBe(true);
      expect(catalog.has("supervisor.highestQualification.level")).toBe(true);
      expect(catalog.has("supervisor.publications")).toBe(true);
      expect(catalog.has("supervisor.activeSupervisionCount")).toBe(true);
    });

    it("contains programme attributes including ruleParameters map", () => {
      const catalog = getAttributeCatalog();
      expect(catalog.has("programme.code")).toBe(true);
      expect(catalog.has("programme.minimumDuration")).toBe(true);
      expect(catalog.has("programme.ruleParameters")).toBe(true);
      const rp = catalog.get("programme.ruleParameters")!;
      expect(rp.isMap).toBe(true);
      expect(rp.type).toBe("map");
    });

    it("contains computed attributes", () => {
      const catalog = getAttributeCatalog();
      expect(catalog.has("computed.enrollmentDurationMonths")).toBe(true);
      expect(catalog.has("computed.remainingSlots")).toBe(true);
      expect(catalog.has("computed.publicationCount")).toBe(true);
    });

    it("every entry has required fields", () => {
      const entries = getAttributeEntries();
      for (const entry of entries) {
        expect(entry.path).toBeTruthy();
        expect(entry.type).toBeTruthy();
        expect(entry.description).toBeTruthy();
        expect(entry.source).toBeTruthy();
      }
    });
  });

  describe("getAttributeEntries", () => {
    it("returns all entries as an array", () => {
      const entries = getAttributeEntries();
      const catalog = getAttributeCatalog();
      expect(entries.length).toBe(catalog.size);
    });

    it("returns a copy (not the internal array)", () => {
      const a = getAttributeEntries();
      const b = getAttributeEntries();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe("getAttributeEntriesBySource", () => {
    it("filters by case source", () => {
      const entries = getAttributeEntriesBySource("case");
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.source === "case")).toBe(true);
    });

    it("filters by student source", () => {
      const entries = getAttributeEntriesBySource("student");
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.source === "student")).toBe(true);
    });

    it("filters by supervisor source", () => {
      const entries = getAttributeEntriesBySource("supervisor");
      expect(entries.length).toBeGreaterThan(0);
    });

    it("filters by programme source", () => {
      const entries = getAttributeEntriesBySource("programme");
      expect(entries.length).toBeGreaterThan(0);
    });

    it("filters by computed source", () => {
      const entries = getAttributeEntriesBySource("computed");
      expect(entries.length).toBeGreaterThan(0);
    });
  });

  describe("resolveAttributePath", () => {
    it("resolves direct paths", () => {
      const entry = resolveAttributePath("student.status");
      expect(entry).not.toBeNull();
      expect(entry!.path).toBe("student.status");
    });

    it("resolves map sub-key to parent map entry", () => {
      const entry = resolveAttributePath("programme.ruleParameters.plagiarismThreshold");
      expect(entry).not.toBeNull();
      expect(entry!.path).toBe("programme.ruleParameters");
      expect(entry!.isMap).toBe(true);
    });

    it("resolves deeply nested map sub-key", () => {
      const entry = resolveAttributePath("programme.ruleParameters.some.deep.key");
      expect(entry).not.toBeNull();
      expect(entry!.path).toBe("programme.ruleParameters");
    });

    it("returns null for completely unknown paths", () => {
      const entry = resolveAttributePath("nonexistent.path");
      expect(entry).toBeNull();
    });

    it("returns null for partial path that is not a map", () => {
      const entry = resolveAttributePath("student.status.subfield");
      expect(entry).toBeNull();
    });
  });
});
