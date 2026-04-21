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
  IStudentAcademicReader,
  SupervisorRecord,
  ISupervisorReader,
  ISupervisorProfileReader,
  ProgrammeRecord,
  IProgrammeProfileReader,
  IRecognizedInstitutionReader,
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
    programmeType: "PhD",
    department: "Computer Science",
    enrollmentDate: new Date("2022-07-01"),
    status: "ACTIVE",
    supervisorEmpId: "EMP-CSE-001",
    courseworkCompleted: true,
    comprehensiveExamStatus: "PASSED",
    comprehensiveExamDate: new Date("2023-06-15"),
  },
  {
    id: "std-002",
    registrationNumber: "REG-2022-002",
    name: "Priya Sharma",
    programme: "MSc Physics",
    programmeType: "MSc",
    department: "Physics",
    enrollmentDate: new Date("2022-08-15"),
    status: "ACTIVE",
    supervisorEmpId: "EMP-PHY-001",
    courseworkCompleted: true,
    comprehensiveExamStatus: "NOT_TAKEN",
    comprehensiveExamDate: null,
  },
  {
    id: "std-003",
    registrationNumber: "REG-2023-001",
    name: "Rajesh Patel",
    programme: "PhD Mathematics",
    programmeType: "PhD",
    department: "Mathematics",
    enrollmentDate: new Date("2023-07-01"),
    status: "ACTIVE",
    supervisorEmpId: "EMP-MATH-001",
    courseworkCompleted: true,
    comprehensiveExamStatus: "PASSED",
    comprehensiveExamDate: new Date("2024-06-20"),
  },
  {
    id: "std-004",
    registrationNumber: "REG-2023-002",
    name: "Fatima Zahra",
    programme: "PhD Computer Science",
    programmeType: "PhD",
    department: "Computer Science",
    enrollmentDate: new Date("2023-08-01"),
    status: "ACTIVE",
    supervisorEmpId: "EMP-CSE-001",
    courseworkCompleted: false,
    comprehensiveExamStatus: "NOT_TAKEN",
    comprehensiveExamDate: null,
  },
  {
    id: "std-005",
    registrationNumber: "REG-2023-003",
    name: "Muhammad Ali",
    programme: "MPhil Physics",
    programmeType: "MPhil",
    department: "Physics",
    enrollmentDate: new Date("2023-09-01"),
    status: "ACTIVE",
    supervisorEmpId: "EMP-PHY-001",
    courseworkCompleted: true,
    comprehensiveExamStatus: "NOT_TAKEN",
    comprehensiveExamDate: null,
  },
  {
    id: "std-006",
    registrationNumber: "REG-2024-001",
    name: "Sara Ahmed",
    programme: "PhD Chemistry",
    programmeType: "PhD",
    department: "Chemistry",
    enrollmentDate: new Date("2024-01-15"),
    status: "ACTIVE",
    supervisorEmpId: "EMP-CHEM-001",
    courseworkCompleted: false,
    comprehensiveExamStatus: "NOT_TAKEN",
    comprehensiveExamDate: null,
  },
  {
    id: "std-007",
    registrationNumber: "REG-2024-002",
    name: "Hassan Raza",
    programme: "MSc Computer Science",
    programmeType: "MSc",
    department: "Computer Science",
    enrollmentDate: new Date("2024-02-01"),
    status: "ACTIVE",
    supervisorEmpId: "EMP-CSE-001",
    courseworkCompleted: false,
    comprehensiveExamStatus: "NOT_TAKEN",
    comprehensiveExamDate: null,
  },
  {
    id: "std-008",
    registrationNumber: "REG-2024-003",
    name: "Ayesha Khan",
    programme: "PhD Mathematics",
    programmeType: "PhD",
    department: "Mathematics",
    enrollmentDate: new Date("2024-03-01"),
    status: "ACTIVE",
    supervisorEmpId: "EMP-MATH-001",
    courseworkCompleted: false,
    comprehensiveExamStatus: "NOT_TAKEN",
    comprehensiveExamDate: null,
  },
  {
    id: "std-009",
    registrationNumber: "REG-2021-001",
    name: "Usman Tariq",
    programme: "PhD Physics",
    programmeType: "PhD",
    department: "Physics",
    enrollmentDate: new Date("2021-07-01"),
    status: "COMPLETED",
    supervisorEmpId: "EMP-PHY-001",
    courseworkCompleted: true,
    comprehensiveExamStatus: "PASSED",
    comprehensiveExamDate: new Date("2022-12-10"),
  },
  {
    id: "std-010",
    registrationNumber: "REG-2022-003",
    name: "Zainab Bibi",
    programme: "MPhil Chemistry",
    programmeType: "MPhil",
    department: "Chemistry",
    enrollmentDate: new Date("2022-09-01"),
    status: "ACTIVE",
    supervisorEmpId: "EMP-CHEM-001",
    courseworkCompleted: true,
    comprehensiveExamStatus: "PASSED",
    comprehensiveExamDate: new Date("2023-11-15"),
  },
];

const mockSupervisorData: SupervisorRecord[] = [
  {
    id: "sup-001",
    employeeId: "EMP-CSE-001",
    name: "Dr. Alice Johnson",
    department: "Computer Science",
    specialization: "Artificial Intelligence",
    highestQualification: {
      degree: "PhD",
      level: "Doctorate",
    },
    activeSupervisionCount: 3,
    maxSupervisionSlots: 5,
    publications: [
      { title: "Deep Learning for NLP", journal: "IEEE TPAMI", year: 2023, indexedIn: ["HEC-W", "Scopus", "ISI"] },
      { title: "Transformer Architectures Survey", journal: "ACM Computing Surveys", year: 2024, indexedIn: ["HEC-W", "Scopus"] },
      { title: "Federated Learning in Healthcare", journal: "Nature Machine Intelligence", year: 2024, indexedIn: ["HEC-W", "Scopus", "ISI"] },
    ],
  },
  {
    id: "sup-002",
    employeeId: "EMP-PHY-001",
    name: "Prof. Bob Smith",
    department: "Physics",
    specialization: "Quantum Mechanics",
    highestQualification: {
      degree: "PhD",
      level: "Doctorate",
    },
    activeSupervisionCount: 2,
    maxSupervisionSlots: 4,
    publications: [
      { title: "Quantum Entanglement Experiments", journal: "Physical Review Letters", year: 2022, indexedIn: ["HEC-W", "Scopus", "ISI"] },
      { title: "Topological Quantum Computing", journal: "Nature Physics", year: 2023, indexedIn: ["HEC-W", "Scopus", "ISI"] },
    ],
  },
  {
    id: "sup-003",
    employeeId: "EMP-MATH-001",
    name: "Dr. Carol White",
    department: "Mathematics",
    specialization: "Number Theory",
    highestQualification: {
      degree: "PhD",
      level: "Doctorate",
    },
    activeSupervisionCount: 2,
    maxSupervisionSlots: 4,
    publications: [
      { title: "Prime Distribution in Arithmetic Progressions", journal: "Annals of Mathematics", year: 2023, indexedIn: ["HEC-W", "Scopus", "ISI"] },
    ],
  },
  {
    id: "sup-004",
    employeeId: "EMP-CHEM-001",
    name: "Dr. Danish Malik",
    department: "Chemistry",
    specialization: "Organic Chemistry",
    highestQualification: {
      degree: "PhD",
      level: "Doctorate",
    },
    activeSupervisionCount: 2,
    maxSupervisionSlots: 3,
    publications: [
      { title: "Green Synthesis of Nanoparticles", journal: "Chemical Reviews", year: 2024, indexedIn: ["HEC-W", "Scopus"] },
      { title: "Catalytic Asymmetric Reactions", journal: "JACS", year: 2023, indexedIn: ["HEC-W", "Scopus", "ISI"] },
    ],
  },
  {
    id: "sup-005",
    employeeId: "EMP-CSE-002",
    name: "Prof. Erum Shah",
    department: "Computer Science",
    specialization: "Data Science",
    highestQualification: {
      degree: "PhD",
      level: "Doctorate",
    },
    activeSupervisionCount: 0,
    maxSupervisionSlots: 5,
    publications: [],
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

/** @deprecated Use MockStudentAcademicReader instead. */
export class MockStudentReader implements IStudentReader {
  async getByRegistrationNumber(regNo: string): Promise<StudentRecord | null> {
    return mockStudentData.find((s) => s.registrationNumber === regNo) || null;
  }
}

/** Spec-compliant mock with 10 students and 4 query methods. */
export class MockStudentAcademicReader implements IStudentAcademicReader {
  async getByRegistrationNumber(regNo: string): Promise<StudentRecord | null> {
    return mockStudentData.find((s) => s.registrationNumber === regNo) || null;
  }

  async getByProgramme(programme: string): Promise<StudentRecord[]> {
    return mockStudentData.filter((s) => s.programme === programme);
  }

  async getByDepartment(department: string): Promise<StudentRecord[]> {
    return mockStudentData.filter((s) => s.department === department);
  }

  async getActiveBySupervisor(supervisorEmpId: string): Promise<StudentRecord[]> {
    return mockStudentData.filter(
      (s) => s.supervisorEmpId === supervisorEmpId && s.status === "ACTIVE"
    );
  }
}

/** @deprecated Use MockSupervisorProfileReader instead. */
export class MockSupervisorReader implements ISupervisorReader {
  async getByEmployeeId(empId: string): Promise<SupervisorRecord | null> {
    return mockSupervisorData.find((s) => s.employeeId === empId) || null;
  }
}

/** Spec-compliant mock with 5 supervisors and 4 query methods. */
export class MockSupervisorProfileReader implements ISupervisorProfileReader {
  async getByEmployeeId(empId: string): Promise<SupervisorRecord | null> {
    return mockSupervisorData.find((s) => s.employeeId === empId) || null;
  }

  async getByDepartment(department: string): Promise<SupervisorRecord[]> {
    return mockSupervisorData.filter((s) => s.department === department);
  }

  async getAvailableForSupervision(): Promise<SupervisorRecord[]> {
    return mockSupervisorData.filter(
      (s) => s.activeSupervisionCount < s.maxSupervisionSlots
    );
  }

  async getBySpecialization(specialization: string): Promise<SupervisorRecord[]> {
    return mockSupervisorData.filter((s) => s.specialization === specialization);
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

// ─── Programme Profile Mock ─────────────────────────────────────

const mockProgrammeData: ProgrammeRecord[] = [
  {
    id: "prog-001",
    code: "PHD-CS",
    name: "PhD Computer Science",
    type: "PhD",
    department: "Computer Science",
    faculty: "Faculty of Computing",
    minimumDuration: 36,
    maximumDuration: 96,
    requiredCredits: 18,
    ruleParameters: {
      minHECPublications: 2,
      plagiarismThreshold: 19,
      requireComprehensiveExam: true,
      maxExtensions: 2,
    },
  },
  {
    id: "prog-002",
    code: "MPHIL-PHY",
    name: "MPhil Physics",
    type: "MPhil",
    department: "Physics",
    faculty: "Faculty of Sciences",
    minimumDuration: 24,
    maximumDuration: 48,
    requiredCredits: 30,
    ruleParameters: {
      minHECPublications: 1,
      plagiarismThreshold: 19,
      requireComprehensiveExam: false,
      maxExtensions: 1,
    },
  },
  {
    id: "prog-003",
    code: "PHD-MATH",
    name: "PhD Mathematics",
    type: "PhD",
    department: "Mathematics",
    faculty: "Faculty of Sciences",
    minimumDuration: 36,
    maximumDuration: 96,
    requiredCredits: 18,
    ruleParameters: {
      minHECPublications: 2,
      plagiarismThreshold: 19,
      requireComprehensiveExam: true,
      maxExtensions: 2,
    },
  },
];

/** Spec-compliant mock with 3 programmes. */
export class MockProgrammeProfileReader implements IProgrammeProfileReader {
  async getByCode(code: string): Promise<ProgrammeRecord | null> {
    return mockProgrammeData.find((p) => p.code === code) || null;
  }

  async getByDepartment(department: string): Promise<ProgrammeRecord[]> {
    return mockProgrammeData.filter((p) => p.department === department);
  }

  async getByType(type: string): Promise<ProgrammeRecord[]> {
    return mockProgrammeData.filter((p) => p.type === type);
  }
}

// ─── Recognized Institution Mock ────────────────────────────────

const mockRecognizedInstitutions = new Set([
  "MIT|United States",
  "Stanford University|United States",
  "University of Cambridge|United Kingdom",
  "University of Oxford|United Kingdom",
  "ETH Zurich|Switzerland",
  "Quaid-i-Azam University|Pakistan",
  "LUMS|Pakistan",
  "NUST|Pakistan",
  "COMSATS University|Pakistan",
  "University of Karachi|Pakistan",
  "University of the Punjab|Pakistan",
  "IIT Bombay|India",
  "IIT Delhi|India",
  "University of Tokyo|Japan",
  "Tsinghua University|China",
]);

/** Mock institution recognition lookup with 15 institutions. */
export class MockRecognizedInstitutionReader implements IRecognizedInstitutionReader {
  async isRecognized(name: string, country: string): Promise<boolean> {
    return mockRecognizedInstitutions.has(`${name}|${country}`);
  }
}
