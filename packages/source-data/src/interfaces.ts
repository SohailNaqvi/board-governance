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
