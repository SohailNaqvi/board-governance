export interface HRDirectoryEntry {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
}

export interface IHRDirectoryReader {
  getByEmail(email: string): Promise<HRDirectoryEntry | null>;
  getByDepartment(department: string): Promise<HRDirectoryEntry[]>;
  getAll(): Promise<HRDirectoryEntry[]>;
}

export interface FinanceRecord {
  id: string;
  fiscalYear: number;
  budget: number;
  spent: number;
  department: string;
}

export interface IFinanceReader {
  getByFiscalYear(year: number): Promise<FinanceRecord[]>;
  getByDepartment(department: string): Promise<FinanceRecord[]>;
}

export interface AcademicRecord {
  id: string;
  courseCode: string;
  courseName: string;
  department: string;
  credits: number;
  level: string;
}

export interface IAcademicReader {
  getByCourseCode(code: string): Promise<AcademicRecord | null>;
  getByDepartment(department: string): Promise<AcademicRecord[]>;
}

export interface ResolutionRecord {
  id: string;
  bodyCode: string;
  resolutionNumber: number;
  resolutionText: string;
  date: Date;
}

export interface IResolutionReader {
  getByBodyCode(code: string): Promise<ResolutionRecord[]>;
  getByNumber(number: number): Promise<ResolutionRecord | null>;
}

export interface StudentRecord {
  id: string;
  registrationNumber: string;
  name: string;
  programme: string;
  programmeType: string;
  department: string;
  enrollmentDate: Date;
  status: string;
  supervisorEmpId?: string;
}

/** @deprecated Use IStudentAcademicReader instead. */
export interface IStudentReader {
  getByRegistrationNumber(regNo: string): Promise<StudentRecord | null>;
}

/** Spec-required reader for student academic data (4 methods). */
export interface IStudentAcademicReader {
  getByRegistrationNumber(regNo: string): Promise<StudentRecord | null>;
  getByProgramme(programme: string): Promise<StudentRecord[]>;
  getByDepartment(department: string): Promise<StudentRecord[]>;
  getActiveBySupervisor(supervisorEmpId: string): Promise<StudentRecord[]>;
}

export interface SupervisorRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  specialization: string;
  highestQualification: {
    degree: string;
    level: string;
  };
  activeSupervisionCount: number;
  maxSupervisionSlots: number;
}

/** @deprecated Use ISupervisorProfileReader instead. */
export interface ISupervisorReader {
  getByEmployeeId(empId: string): Promise<SupervisorRecord | null>;
}

/** Spec-required reader for supervisor profile data (4 methods). */
export interface ISupervisorProfileReader {
  getByEmployeeId(empId: string): Promise<SupervisorRecord | null>;
  getByDepartment(department: string): Promise<SupervisorRecord[]>;
  getAvailableForSupervision(): Promise<SupervisorRecord[]>;
  getBySpecialization(specialization: string): Promise<SupervisorRecord[]>;
}
