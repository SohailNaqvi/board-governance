import type {
  IHRDirectoryReader,
  HRDirectoryEntry,
  IFinanceReader,
  FinanceRecord,
  IAcademicReader,
  AcademicRecord,
  IResolutionReader,
  ResolutionRecord,
} from "./interfaces";

// Deterministic seed data for testing
const mockHRData: HRDirectoryEntry[] = [
  {
    id: "hr-001",
    name: "Dr. Alice Johnson",
    email: "alice.johnson@university.edu",
    department: "Computer Science",
    designation: "Professor",
  },
  {
    id: "hr-002",
    name: "Prof. Bob Smith",
    email: "bob.smith@university.edu",
    department: "Mathematics",
    designation: "Associate Professor",
  },
  {
    id: "hr-003",
    name: "Dr. Carol White",
    email: "carol.white@university.edu",
    department: "Physics",
    designation: "Lecturer",
  },
];

const mockFinanceData: FinanceRecord[] = [
  {
    id: "fin-001",
    fiscalYear: 2024,
    budget: 1000000,
    spent: 750000,
    department: "Computer Science",
  },
  {
    id: "fin-002",
    fiscalYear: 2024,
    budget: 800000,
    spent: 650000,
    department: "Mathematics",
  },
];

const mockAcademicData: AcademicRecord[] = [
  {
    id: "acad-001",
    courseCode: "CS101",
    courseName: "Introduction to Computer Science",
    department: "Computer Science",
    credits: 3,
    level: "1",
  },
  {
    id: "acad-002",
    courseCode: "MATH201",
    courseName: "Advanced Calculus",
    department: "Mathematics",
    credits: 4,
    level: "2",
  },
];

const mockResolutionData: ResolutionRecord[] = [
  {
    id: "res-001",
    bodyCode: "SN",
    resolutionNumber: 1,
    resolutionText: "Resolution on academic standards",
    date: new Date("2024-01-15"),
  },
  {
    id: "res-002",
    bodyCode: "SN",
    resolutionNumber: 2,
    resolutionText: "Resolution on student welfare",
    date: new Date("2024-02-15"),
  },
];

export class MockHRDirectoryReader implements IHRDirectoryReader {
  async getByEmail(email: string): Promise<HRDirectoryEntry | null> {
    return mockHRData.find((entry) => entry.email === email) || null;
  }

  async getByDepartment(department: string): Promise<HRDirectoryEntry[]> {
    return mockHRData.filter((entry) => entry.department === department);
  }

  async getAll(): Promise<HRDirectoryEntry[]> {
    return [...mockHRData];
  }
}

export class MockFinanceReader implements IFinanceReader {
  async getByFiscalYear(year: number): Promise<FinanceRecord[]> {
    return mockFinanceData.filter((record) => record.fiscalYear === year);
  }

  async getByDepartment(department: string): Promise<FinanceRecord[]> {
    return mockFinanceData.filter((record) => record.department === department);
  }
}

export class MockAcademicReader implements IAcademicReader {
  async getByCourseCode(code: string): Promise<AcademicRecord | null> {
    return mockAcademicData.find((record) => record.courseCode === code) || null;
  }

  async getByDepartment(department: string): Promise<AcademicRecord[]> {
    return mockAcademicData.filter((record) => record.department === department);
  }
}

export class MockResolutionReader implements IResolutionReader {
  async getByBodyCode(code: string): Promise<ResolutionRecord[]> {
    return mockResolutionData.filter((record) => record.bodyCode === code);
  }

  async getByNumber(number: number): Promise<ResolutionRecord | null> {
    return (
      mockResolutionData.find((record) => record.resolutionNumber === number) ||
      null
    );
  }
}
