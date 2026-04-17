import { describe, it, expect } from "vitest";
import {
  MockHRDirectoryReader,
  MockFinanceReader,
  MockAcademicReader,
  MockResolutionReader,
  type IHRDirectoryReader,
  type IFinanceReader,
  type IAcademicReader,
  type IResolutionReader,
} from "@ums/source-data";

describe("MockReader Contracts", () => {
  describe("MockHRDirectoryReader", () => {
    let reader: IHRDirectoryReader;

    it("should implement IHRDirectoryReader interface", () => {
      reader = new MockHRDirectoryReader();
      expect(reader).toBeDefined();
      expect(typeof reader.getByEmail).toBe("function");
      expect(typeof reader.getByDepartment).toBe("function");
      expect(typeof reader.getAll).toBe("function");
    });

    it("should return deterministic seed data", async () => {
      reader = new MockHRDirectoryReader();
      const all = await reader.getAll();
      expect(all.length).toBeGreaterThan(0);
      expect(all[0]).toHaveProperty("id");
      expect(all[0]).toHaveProperty("email");
      expect(all[0]).toHaveProperty("name");
    });

    it("should find entries by email", async () => {
      reader = new MockHRDirectoryReader();
      const entry = await reader.getByEmail("alice.johnson@university.edu");
      expect(entry).toBeDefined();
      expect(entry?.name).toBe("Dr. Alice Johnson");
    });

    it("should return null for unknown email", async () => {
      reader = new MockHRDirectoryReader();
      const entry = await reader.getByEmail("unknown@university.edu");
      expect(entry).toBeNull();
    });

    it("should filter by department", async () => {
      reader = new MockHRDirectoryReader();
      const entries = await reader.getByDepartment("Computer Science");
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.department === "Computer Science")).toBe(
        true
      );
    });
  });

  describe("MockFinanceReader", () => {
    let reader: IFinanceReader;

    it("should implement IFinanceReader interface", () => {
      reader = new MockFinanceReader();
      expect(reader).toBeDefined();
      expect(typeof reader.getByFiscalYear).toBe("function");
      expect(typeof reader.getByDepartment).toBe("function");
    });

    it("should return records by fiscal year", async () => {
      reader = new MockFinanceReader();
      const records = await reader.getByFiscalYear(2024);
      expect(records.length).toBeGreaterThan(0);
      expect(records[0]).toHaveProperty("fiscalYear");
      expect(records[0]).toHaveProperty("budget");
    });

    it("should return empty array for unknown fiscal year", async () => {
      reader = new MockFinanceReader();
      const records = await reader.getByFiscalYear(1999);
      expect(records).toEqual([]);
    });

    it("should filter by department", async () => {
      reader = new MockFinanceReader();
      const records = await reader.getByDepartment("Computer Science");
      expect(records.length).toBeGreaterThan(0);
      expect(
        records.every((r) => r.department === "Computer Science")
      ).toBe(true);
    });
  });

  describe("MockAcademicReader", () => {
    let reader: IAcademicReader;

    it("should implement IAcademicReader interface", () => {
      reader = new MockAcademicReader();
      expect(reader).toBeDefined();
      expect(typeof reader.getByCourseCode).toBe("function");
      expect(typeof reader.getByDepartment).toBe("function");
    });

    it("should find courses by code", async () => {
      reader = new MockAcademicReader();
      const course = await reader.getByCourseCode("CS101");
      expect(course).toBeDefined();
      expect(course?.courseName).toContain("Computer Science");
    });

    it("should return null for unknown course code", async () => {
      reader = new MockAcademicReader();
      const course = await reader.getByCourseCode("UNKNOWN999");
      expect(course).toBeNull();
    });

    it("should filter by department", async () => {
      reader = new MockAcademicReader();
      const courses = await reader.getByDepartment("Mathematics");
      expect(courses.length).toBeGreaterThan(0);
      expect(courses.every((c) => c.department === "Mathematics")).toBe(true);
    });
  });

  describe("MockResolutionReader", () => {
    let reader: IResolutionReader;

    it("should implement IResolutionReader interface", () => {
      reader = new MockResolutionReader();
      expect(reader).toBeDefined();
      expect(typeof reader.getByBodyCode).toBe("function");
      expect(typeof reader.getByNumber).toBe("function");
    });

    it("should find resolutions by body code", async () => {
      reader = new MockResolutionReader();
      const resolutions = await reader.getByBodyCode("SN");
      expect(resolutions.length).toBeGreaterThan(0);
      expect(resolutions.every((r) => r.bodyCode === "SN")).toBe(true);
    });

    it("should find resolutions by number", async () => {
      reader = new MockResolutionReader();
      const resolution = await reader.getByNumber(1);
      expect(resolution).toBeDefined();
      expect(resolution?.resolutionNumber).toBe(1);
    });

    it("should return null for unknown resolution number", async () => {
      reader = new MockResolutionReader();
      const resolution = await reader.getByNumber(9999);
      expect(resolution).toBeNull();
    });
  });
});
