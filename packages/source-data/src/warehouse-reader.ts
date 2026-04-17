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
