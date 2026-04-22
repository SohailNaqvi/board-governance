import { describe, it, expect } from "vitest";
import {
  createReader,
  MockProgrammeProfileReader,
  MockRecognizedInstitutionReader,
  MockStudentAcademicReader,
  MockSupervisorProfileReader,
} from "@ums/source-data";

describe("Source Data Reader Extensions", () => {
  // ─── StudentRecord Extended Fields ────────────────────────────
  describe("StudentRecord extended fields", () => {
    const reader = new MockStudentAcademicReader();

    it("student records include courseworkCompleted boolean", async () => {
      const student = await reader.getByRegistrationNumber("REG-2022-001");
      expect(student).not.toBeNull();
      expect(typeof student!.courseworkCompleted).toBe("boolean");
    });

    it("student records include comprehensiveExamStatus", async () => {
      const student = await reader.getByRegistrationNumber("REG-2022-001");
      expect(student).not.toBeNull();
      expect(["NOT_TAKEN", "PASSED", "FAILED"]).toContain(student!.comprehensiveExamStatus);
    });

    it("student with PASSED exam has a comprehensiveExamDate", async () => {
      const student = await reader.getByRegistrationNumber("REG-2022-001");
      expect(student!.comprehensiveExamStatus).toBe("PASSED");
      expect(student!.comprehensiveExamDate).toBeInstanceOf(Date);
    });

    it("student with NOT_TAKEN has null comprehensiveExamDate", async () => {
      const student = await reader.getByRegistrationNumber("REG-2023-002");
      expect(student!.comprehensiveExamStatus).toBe("NOT_TAKEN");
      expect(student!.comprehensiveExamDate).toBeNull();
    });
  });

  // ─── SupervisorRecord Extended Fields ─────────────────────────
  describe("SupervisorRecord extended fields", () => {
    const reader = new MockSupervisorProfileReader();

    it("supervisor records include publications array", async () => {
      const sup = await reader.getByEmployeeId("EMP-CSE-001");
      expect(sup).not.toBeNull();
      expect(Array.isArray(sup!.publications)).toBe(true);
      expect(sup!.publications.length).toBeGreaterThan(0);
    });

    it("publications have correct shape", async () => {
      const sup = await reader.getByEmployeeId("EMP-CSE-001");
      const pub = sup!.publications[0];
      expect(pub).toHaveProperty("title");
      expect(pub).toHaveProperty("journal");
      expect(pub).toHaveProperty("year");
      expect(pub).toHaveProperty("indexedIn");
      expect(Array.isArray(pub.indexedIn)).toBe(true);
    });

    it("supervisor with no publications has empty array", async () => {
      const sup = await reader.getByEmployeeId("EMP-CSE-002");
      expect(sup!.publications).toEqual([]);
    });
  });

  // ─── ProgrammeProfileReader ───────────────────────────────────
  describe("MockProgrammeProfileReader", () => {
    const reader = new MockProgrammeProfileReader();

    it("getByCode returns programme for known code", async () => {
      const prog = await reader.getByCode("PHD-CS");
      expect(prog).not.toBeNull();
      expect(prog!.code).toBe("PHD-CS");
      expect(prog!.type).toBe("PhD");
      expect(prog!.department).toBe("Computer Science");
    });

    it("getByCode returns null for unknown code", async () => {
      const prog = await reader.getByCode("NONEXISTENT");
      expect(prog).toBeNull();
    });

    it("getByDepartment returns programmes for known department", async () => {
      const progs = await reader.getByDepartment("Computer Science");
      expect(progs.length).toBeGreaterThan(0);
      expect(progs.every((p) => p.department === "Computer Science")).toBe(true);
    });

    it("getByType returns programmes of given type", async () => {
      const progs = await reader.getByType("PhD");
      expect(progs.length).toBeGreaterThan(0);
      expect(progs.every((p) => p.type === "PhD")).toBe(true);
    });

    it("programme records have ruleParameters map", async () => {
      const prog = await reader.getByCode("PHD-CS");
      expect(prog!.ruleParameters).toBeDefined();
      expect(prog!.ruleParameters.minHECPublications).toBe(2);
      expect(prog!.ruleParameters.plagiarismThreshold).toBe(19);
    });

    it("programme records have duration fields", async () => {
      const prog = await reader.getByCode("PHD-CS");
      expect(prog!.minimumDuration).toBe(36);
      expect(prog!.maximumDuration).toBe(96);
      expect(prog!.requiredCredits).toBe(18);
    });
  });

  // ─── RecognizedInstitutionReader ──────────────────────────────
  describe("MockRecognizedInstitutionReader", () => {
    const reader = new MockRecognizedInstitutionReader();

    it("recognizes known institution", async () => {
      expect(await reader.isRecognized("MIT", "United States")).toBe(true);
      expect(await reader.isRecognized("LUMS", "Pakistan")).toBe(true);
      expect(await reader.isRecognized("University of Cambridge", "United Kingdom")).toBe(true);
    });

    it("rejects unknown institution", async () => {
      expect(await reader.isRecognized("Fake University", "Nowhere")).toBe(false);
    });

    it("rejects known name with wrong country", async () => {
      expect(await reader.isRecognized("MIT", "Pakistan")).toBe(false);
    });
  });

  // ─── Factory Integration ──────────────────────────────────────
  describe("createReader factory", () => {
    it("mock factory includes programmeProfile reader", () => {
      const factory = createReader("mock");
      expect(factory.programmeProfile).toBeDefined();
      expect(typeof factory.programmeProfile.getByCode).toBe("function");
    });

    it("mock factory includes recognizedInstitution reader", () => {
      const factory = createReader("mock");
      expect(factory.recognizedInstitution).toBeDefined();
      expect(typeof factory.recognizedInstitution.isRecognized).toBe("function");
    });

    it("warehouse factory includes new readers", () => {
      const factory = createReader("warehouse", "http://localhost:3000");
      expect(factory.programmeProfile).toBeDefined();
      expect(factory.recognizedInstitution).toBeDefined();
    });
  });
});
