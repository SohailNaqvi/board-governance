import type {
  IHRDirectoryReader,
  IFinanceReader,
  IAcademicReader,
  IResolutionReader,
  IStudentAcademicReader,
  ISupervisorProfileReader,
  IProgrammeProfileReader,
  IRecognizedInstitutionReader,
} from "./interfaces";
import {
  MockHRDirectoryReader,
  MockFinanceReader,
  MockAcademicReader,
  MockResolutionReader,
  MockStudentAcademicReader,
  MockSupervisorProfileReader,
  MockASRBResolutionReader,
  MockProgrammeProfileReader,
  MockRecognizedInstitutionReader,
} from "./mock-reader";
import {
  WarehouseHRDirectoryReader,
  WarehouseFinanceReader,
  WarehouseAcademicReader,
  WarehouseResolutionReader,
  WarehouseStudentAcademicReader,
  WarehouseSupervisorProfileReader,
  WarehouseProgrammeProfileReader,
  WarehouseRecognizedInstitutionReader,
} from "./warehouse-reader";

export type DataProviderType = "mock" | "warehouse";

export interface ReaderFactory {
  hrDirectory: IHRDirectoryReader;
  finance: IFinanceReader;
  academic: IAcademicReader;
  resolution: IResolutionReader;
  studentAcademic: IStudentAcademicReader;
  supervisorProfile: ISupervisorProfileReader;
  asrbResolution: IResolutionReader;
  programmeProfile: IProgrammeProfileReader;
  recognizedInstitution: IRecognizedInstitutionReader;
}

export function createReader(
  providerType: DataProviderType,
  warehouseUrl?: string
): ReaderFactory {
  if (providerType === "mock") {
    return {
      hrDirectory: new MockHRDirectoryReader(),
      finance: new MockFinanceReader(),
      academic: new MockAcademicReader(),
      resolution: new MockResolutionReader(),
      studentAcademic: new MockStudentAcademicReader(),
      supervisorProfile: new MockSupervisorProfileReader(),
      asrbResolution: new MockASRBResolutionReader(),
      programmeProfile: new MockProgrammeProfileReader(),
      recognizedInstitution: new MockRecognizedInstitutionReader(),
    };
  }

  if (providerType === "warehouse") {
    if (!warehouseUrl) {
      throw new Error("warehouseUrl is required for warehouse provider");
    }
    return {
      hrDirectory: new WarehouseHRDirectoryReader(warehouseUrl),
      finance: new WarehouseFinanceReader(warehouseUrl),
      academic: new WarehouseAcademicReader(warehouseUrl),
      resolution: new WarehouseResolutionReader(warehouseUrl),
      studentAcademic: new WarehouseStudentAcademicReader(warehouseUrl),
      supervisorProfile: new WarehouseSupervisorProfileReader(warehouseUrl),
      asrbResolution: new WarehouseResolutionReader(warehouseUrl),
      programmeProfile: new WarehouseProgrammeProfileReader(warehouseUrl),
      recognizedInstitution: new WarehouseRecognizedInstitutionReader(warehouseUrl),
    };
  }

  throw new Error(`Unknown provider type: ${providerType}`);
}
