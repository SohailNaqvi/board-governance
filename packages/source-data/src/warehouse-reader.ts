import type {
  IHRDirectoryReader,
  HRDirectoryEntry,
  IFinanceReader,
  FinanceRecord,
  IAcademicReader,
  AcademicRecord,
  IResolutionReader,
  ResolutionRecord,
  IStudentAcademicReader,
  StudentRecord,
  ISupervisorProfileReader,
  SupervisorRecord,
  IProgrammeProfileReader,
  ProgrammeRecord,
  IRecognizedInstitutionReader,
} from "./interfaces";

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

export class WarehouseHRDirectoryReader implements IHRDirectoryReader {
  constructor(private warehouseUrl: string) {}

  async getByEmail(email: string): Promise<HRDirectoryEntry | null> {
    throw new NotImplementedError(
      "WarehouseHRDirectoryReader.getByEmail not yet implemented"
    );
  }

  async getByDepartment(department: string): Promise<HRDirectoryEntry[]> {
    throw new NotImplementedError(
      "WarehouseHRDirectoryReader.getByDepartment not yet implemented"
    );
  }

  async getAll(): Promise<HRDirectoryEntry[]> {
    throw new NotImplementedError(
      "WarehouseHRDirectoryReader.getAll not yet implemented"
    );
  }
}

export class WarehouseFinanceReader implements IFinanceReader {
  constructor(private warehouseUrl: string) {}

  async getByFiscalYear(year: number): Promise<FinanceRecord[]> {
    throw new NotImplementedError(
      "WarehouseFinanceReader.getByFiscalYear not yet implemented"
    );
  }

  async getByDepartment(department: string): Promise<FinanceRecord[]> {
    throw new NotImplementedError(
      "WarehouseFinanceReader.getByDepartment not yet implemented"
    );
  }
}

export class WarehouseAcademicReader implements IAcademicReader {
  constructor(private warehouseUrl: string) {}

  async getByCourseCode(code: string): Promise<AcademicRecord | null> {
    throw new NotImplementedError(
      "WarehouseAcademicReader.getByCourseCode not yet implemented"
    );
  }

  async getByDepartment(department: string): Promise<AcademicRecord[]> {
    throw new NotImplementedError(
      "WarehouseAcademicReader.getByDepartment not yet implemented"
    );
  }
}

export class WarehouseResolutionReader implements IResolutionReader {
  constructor(private warehouseUrl: string) {}

  async getByBodyCode(code: string): Promise<ResolutionRecord[]> {
    throw new NotImplementedError(
      "WarehouseResolutionReader.getByBodyCode not yet implemented"
    );
  }

  async getByNumber(number: number): Promise<ResolutionRecord | null> {
    throw new NotImplementedError(
      "WarehouseResolutionReader.getByNumber not yet implemented"
    );
  }
}

export class WarehouseStudentAcademicReader implements IStudentAcademicReader {
  constructor(private warehouseUrl: string) {}

  async getByRegistrationNumber(regNo: string): Promise<StudentRecord | null> {
    throw new NotImplementedError(
      "WarehouseStudentAcademicReader.getByRegistrationNumber not yet implemented"
    );
  }

  async getByProgramme(programme: string): Promise<StudentRecord[]> {
    throw new NotImplementedError(
      "WarehouseStudentAcademicReader.getByProgramme not yet implemented"
    );
  }

  async getByDepartment(department: string): Promise<StudentRecord[]> {
    throw new NotImplementedError(
      "WarehouseStudentAcademicReader.getByDepartment not yet implemented"
    );
  }

  async getActiveBySupervisor(supervisorEmpId: string): Promise<StudentRecord[]> {
    throw new NotImplementedError(
      "WarehouseStudentAcademicReader.getActiveBySupervisor not yet implemented"
    );
  }
}

export class WarehouseSupervisorProfileReader implements ISupervisorProfileReader {
  constructor(private warehouseUrl: string) {}

  async getByEmployeeId(empId: string): Promise<SupervisorRecord | null> {
    throw new NotImplementedError(
      "WarehouseSupervisorProfileReader.getByEmployeeId not yet implemented"
    );
  }

  async getByDepartment(department: string): Promise<SupervisorRecord[]> {
    throw new NotImplementedError(
      "WarehouseSupervisorProfileReader.getByDepartment not yet implemented"
    );
  }

  async getAvailableForSupervision(): Promise<SupervisorRecord[]> {
    throw new NotImplementedError(
      "WarehouseSupervisorProfileReader.getAvailableForSupervision not yet implemented"
    );
  }

  async getBySpecialization(specialization: string): Promise<SupervisorRecord[]> {
    throw new NotImplementedError(
      "WarehouseSupervisorProfileReader.getBySpecialization not yet implemented"
    );
  }
}

export class WarehouseProgrammeProfileReader implements IProgrammeProfileReader {
  constructor(private warehouseUrl: string) {}

  async getByCode(code: string): Promise<ProgrammeRecord | null> {
    throw new NotImplementedError(
      "WarehouseProgrammeProfileReader.getByCode not yet implemented"
    );
  }

  async getByDepartment(department: string): Promise<ProgrammeRecord[]> {
    throw new NotImplementedError(
      "WarehouseProgrammeProfileReader.getByDepartment not yet implemented"
    );
  }

  async getByType(type: string): Promise<ProgrammeRecord[]> {
    throw new NotImplementedError(
      "WarehouseProgrammeProfileReader.getByType not yet implemented"
    );
  }
}

export class WarehouseRecognizedInstitutionReader implements IRecognizedInstitutionReader {
  constructor(private warehouseUrl: string) {}

  async isRecognized(name: string, country: string): Promise<boolean> {
    throw new NotImplementedError(
      "WarehouseRecognizedInstitutionReader.isRecognized not yet implemented"
    );
  }
}
