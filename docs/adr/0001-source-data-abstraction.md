# ADR 0001: Source Data Abstraction Pattern

## Status
Accepted

## Context
The Board Governance Module needs to source data from multiple external systems:
- HR Directory (employee information)
- Finance System (budget data)
- Academic Registry (course information)
- Resolution Archive (historical resolutions)

During development and testing, these external systems may not be available. We need a clean way to support both:
1. Mock data for development and testing
2. Real warehouse data in production

## Decision
We implement a data abstraction layer with:
- Interface-based contracts for each data source (IHRDirectoryReader, IFinanceReader, etc.)
- Two concrete implementations: MockReader and WarehouseReader
- Factory pattern to create the appropriate reader based on configuration

## Consequences

### Positive
- Clean separation of concerns - UI code doesn't know about data sources
- Easy to test with deterministic mock data
- Smooth transition to real data sources
- Supports dependency injection pattern
- Each reader interface is independently testable via contract tests

### Negative
- Adds abstraction layer with small performance overhead
- Must maintain interface contracts alongside implementations

## Alternatives Considered
1. Conditional imports based on environment - rejected because it pollutes application code
2. Directly call external APIs - rejected because it makes testing difficult
3. Monolithic DataProvider - rejected because it violates single responsibility

## Implementation Notes
- MockReader returns deterministic seed data for contract test verification
- WarehouseReader stubs throw NotImplementedError, allowing incremental development
- Factory pattern allows configuration-driven provider selection
- Each interface maps to one external system

## Related Files
- `/packages/source-data/src/interfaces.ts` - Interface definitions
- `/packages/source-data/src/mock-reader.ts` - Mock implementations
- `/packages/source-data/src/warehouse-reader.ts` - Warehouse stubs
- `/packages/source-data/src/factory.ts` - Provider factory
- `/tests/contract/mock-reader.test.ts` - Contract tests
