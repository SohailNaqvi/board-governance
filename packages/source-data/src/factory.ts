import type {
  IHRDirectoryReader,
  IFinanceReader,
  IAcademicReader,
  IResolutionReader,
} from "./interfaces";
import {
  MockHRDirectoryReader,
  MockFinanceReader,
  MockAcademicReader,
  MockResolutionReader,
} from "./mock-reader";
import {
  WarehouseHRDirectoryReader,
  WarehouseFinanceReader,
  WarehouseAcademicReader,
  WarehouseResolutionReader,
} from "./warehouse-reader";

export type DataProviderType = "mock" | "warehouse";

export interface ReaderFactory {
  hrDirectory: IHRDirectoryReader;
  finance: IFinanceReader;
  academic: IAcademicReader;
  resolution: IResolutionReader;
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
    };
  }

  throw new Error(`Unknown provider type: ${providerType}`);
}
