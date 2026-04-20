import { describe, it, expect } from "vitest";
import {
  MockStudentAcademicReader,
  MockSupervisorProfileReader,
  type IStudentAcademicReader,
  type ISupervisorProfileReader,
} from "@ums/source-data";

describe("MockStudentAcademicReader", () => {
  let reader: IStudentAcademicReader;

  it("should implement all 4 IStudentAcademicReader methods", () => {
    reader = new MockStudentAcademicReader();
    expect(typeof reader.getByRegistrationNumber).toBe("function");
    expect(typeof reader.getByProgramme).toBe("function");
    expect(typeof reader.getByDepartment).toBe("function");
    expect(typeof reader.getActiveBySupervisor).toBe("function");
  });

  it("should have at least 10 students", async () => {
    reader = new MockStudentAcademicReader();
    // Fetch all by a broad search - we know CS and Physics and Math and Chemistry
    const cs = await reader.getByDepartment("Computer Science");
    const phys = await reader.getByDepartment("Physics");
    const math = await reader.getByDepartment("Mathematics");
    const chem = await reader.getByDepartment("Chemistry");
    const total = cs.length + phys.length + math.length + chem.length;
    expect(total).toBeGreaterThanOrEqual(10);
  });

  it("should find student by registration number", async () => {
    reader = new MockStudentAcademicReader();
    const student = await reader.getByRegistrationNumber("REG-2022-001");
    expect(student).toBeDefined();
    expect(student?.name).toBe("Arun Kumar");
    expect(student?.programmeType).toBeDefined();
  });

  it("should return null for unknown registration number", async () => {
    reader = new MockStudentAcademicReader();
    const student = await reader.getByRegistrationNumber("UNKNOWN");
    expect(student).toBeNull();
  });

  it("should filter by programme", async () => {
    reader = new MockStudentAcademicReader();
    const students = await reader.getByProgramme("PhD Computer Science");
    expect(students.length).toBeGreaterThan(0);
    expect(students.every((s) => s.programme === "PhD Computer Science")).toBe(true);
  });

  it("should filter by department", async () => {
    reader = new MockStudentAcademicReader();
    const students = await reader.getByDepartment("Physics");
    expect(students.length).toBeGreaterThan(0);
    expect(students.every((s) => s.department === "Physics")).toBe(true);
  });

  it("should find active students by supervisor", async () => {
    reader = new MockStudentAcademicReader();
    const students = await reader.getActiveBySupervisor("EMP-CSE-001");
    expect(students.length).toBeGreaterThan(0);
    expect(
      students.every(
        (s) => s.supervisorEmpId === "EMP-CSE-001" && s.status === "ACTIVE"
      )
    ).toBe(true);
  });

  it("should not include completed students in getActiveBySupervisor", async () => {
    reader = new MockStudentAcademicReader();
    const students = await reader.getActiveBySupervisor("EMP-PHY-001");
    expect(students.every((s) => s.status === "ACTIVE")).toBe(true);
  });

  it("should return empty array for unknown supervisor", async () => {
    reader = new MockStudentAcademicReader();
    const students = await reader.getActiveBySupervisor("UNKNOWN");
    expect(students).toEqual([]);
  });
});

describe("MockSupervisorProfileReader", () => {
  let reader: ISupervisorProfileReader;

  it("should implement all 4 ISupervisorProfileReader methods", () => {
    reader = new MockSupervisorProfileReader();
    expect(typeof reader.getByEmployeeId).toBe("function");
    expect(typeof reader.getByDepartment).toBe("function");
    expect(typeof reader.getAvailableForSupervision).toBe("function");
    expect(typeof reader.getBySpecialization).toBe("function");
  });

  it("should have at least 5 supervisors", async () => {
    reader = new MockSupervisorProfileReader();
    const cs = await reader.getByDepartment("Computer Science");
    const phys = await reader.getByDepartment("Physics");
    const math = await reader.getByDepartment("Mathematics");
    const chem = await reader.getByDepartment("Chemistry");
    const total = cs.length + phys.length + math.length + chem.length;
    expect(total).toBeGreaterThanOrEqual(5);
  });

  it("should find supervisor by employee ID", async () => {
    reader = new MockSupervisorProfileReader();
    const sup = await reader.getByEmployeeId("EMP-CSE-001");
    expect(sup).toBeDefined();
    expect(sup?.name).toBe("Dr. Alice Johnson");
    expect(sup?.specialization).toBeDefined();
    expect(sup?.maxSupervisionSlots).toBeDefined();
  });

  it("should return null for unknown employee ID", async () => {
    reader = new MockSupervisorProfileReader();
    const sup = await reader.getByEmployeeId("UNKNOWN");
    expect(sup).toBeNull();
  });

  it("should filter by department", async () => {
    reader = new MockSupervisorProfileReader();
    const sups = await reader.getByDepartment("Computer Science");
    expect(sups.length).toBeGreaterThan(0);
    expect(sups.every((s) => s.department === "Computer Science")).toBe(true);
  });

  it("should find available supervisors", async () => {
    reader = new MockSupervisorProfileReader();
    const available = await reader.getAvailableForSupervision();
    expect(available.length).toBeGreaterThan(0);
    expect(
      available.every((s) => s.activeSupervisionCount < s.maxSupervisionSlots)
    ).toBe(true);
  });

  it("should filter by specialization", async () => {
    reader = new MockSupervisorProfileReader();
    const sups = await reader.getBySpecialization("Artificial Intelligence");
    expect(sups.length).toBeGreaterThan(0);
    expect(
      sups.every((s) => s.specialization === "Artificial Intelligence")
    ).toBe(true);
  });

  it("should return empty array for unknown specialization", async () => {
    reader = new MockSupervisorProfileReader();
    const sups = await reader.getBySpecialization("Underwater Basket Weaving");
    expect(sups).toEqual([]);
  });
});
