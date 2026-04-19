import type {
  IHRDirectoryReader,
  HRDirectoryEntry,
  IFinanceReader,
  FinanceRecord,
  IAcademicReader,
  AcademicRecord,
  IResolutionReader,
  ResolutionRecord,
  StudentRecord,
  IStudentReader,
  SupervisorRecord,
  ISupervisorReader,
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

const mockStudentData: StudentRecord[] = [
  {
    id: "std-001",
    registrationNumber: "REG-2022-001",
    name: "Arun Kumar",
    programme: "PhD Computer Science",
    department: "Computer Science",
    enrollmentDate: new Date("2022-07-01"),
    status: "ACTIVE",
  },
  {
    id: "std-002",
    registrationNumber: "REG-2022-002",
    name: "Priya Sharma",
    programme: "MSc Physics",
    department: "Physics",
    enrollmentDate: new Date("2022-08-15"),
    status: "ACTIVE",
  },
  {
    id: "std-003",
    registrationNumber: "REG-2023-001",
    name: "Rajesh Patel",
    programme: "PhD Mathematics",
    department: "Mathematics",
    enrollmentDate: new Date("2023-07-01"),
    status: "ACTIVE",
  },
];

const mockSupervisorData: SupervisorRecord[] = [
  {
    id: "sup-001",
    employeeId: "EMP-CSE-001",
    name: "Dr. Alice Johnson",
    department: "Computer Science",
    highestQualification: {
      degree: "PhD",
      level: "Doctorate",
    },
    activeSupervisionCount: 3,
  },
  {
    id: "sup-002",
    employeeId: "EMP-PHY-001",
    name: "Prof. Bob Smith",
    department: "Physics",
    highestQualification: {
      degree: "PhD",
      level: "Doctorate",
    },
    activeSupervisionCount: 2,
  },
  {
    id: "sup-003",
    employeeId: "EMP-MATH-001",
    name: "Dr. Carol White",
    department: "Mathematics",
    highestQualification: {
      degree: "MSc",
      level: "Masters",
    },
    activeSupervisionCount: 1,
  },
];

const mockDGSCResolutions: ResolutionRecord[] = [
  {
    id: "dgsc-res-001",
    bodyCode: "DGSC",
    resolutionNumber: 1,
    resolutionText: "DGSC approval for research standards",
    date: new Date("2024-01-10"),
  },
  {
    id: "dgsc-res-002",
    bodyCode: "DGSC",
    resolutionNumber: 2,
    resolutionText: "DGSC approval for examination procedures",
    date: new Date("2024-02-10"),
  },
];

const mockFacultyBoardResolutions: ResolutionRecord[] = [
  {
    id: "fb-res-001",
    bodyCode: "FACULTY_BOARD",
    resolutionNumber: 1,
    resolutionText: "Faculty Board approval for course curriculum",
    date: new Date("2024-01-20"),
  },
  {
    id: "fb-res-002",
    bodyCode: "FACULTY_BOARD",
    resolutionNumber: 2,
    resolutionText: "Faculty Board approval for faculty appointments",
    date: new Date("2024-02-20"),
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

export class MockStudentReader implements IStudentReader {
  async getByRegistrationNumber(regNo: string): Promise<StudentRecord | null> {
    return mockStudentData.find((s) => s.registrationNumber === regNo) || null;
  }
}

export class MockSupervisorReader implements ISupervisorReader {
  async getByEmployeeId(empId: string): Promise<SupervisorRecord | null> {
    return mockSupervisorData.find((s) => s.employeeId === empId) || null;
  }
}

export class MockASRBResolutionReader implements IResolutionReader {
  async getByBodyCode(code: string): Promise<ResolutionRecord[]> {
    if (code === "DGSC") {
      return mockDGSCResolutions;
    } else if (code === "FACULTY_BOARD") {
      return mockFacultyBoardResolutions;
    }
    return [];
  }

  async getByNumber(number: number): Promise<ResolutionRecord | null> {
    const allResolutions = [
      ...mockDGSCResolutions,
      ...mockFacultyBoardResolutions,
    ];
    return allResolutions.find((r) => r.resolutionNumber === number) || null;
  }
}
