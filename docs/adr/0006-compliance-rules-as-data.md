# ADR 0006: Compliance Rules as Data with Predicate Language

## Status

Accepted

## Context

ASRB Slice 3 requires a compliance rules catalog that can be authored, versioned,
and evaluated at runtime against incoming cases. HEC regulations and university
policies change periodically; hardcoding compliance checks in application code
creates a maintenance burden and requires developer involvement for every policy
change.

The system needs to support:
- Non-developer authoring of compliance rules
- Versioning with draft/effective/retired lifecycle
- Real-time validation against incoming ASRB cases
- Audit trails showing which rules were evaluated and their outcomes

## Decision

We implement compliance rules as data, using a restricted JSON predicate language
evaluated at runtime. Key components:

### 1. Predicate Language (`@ums/compliance`)

A non-Turing-complete JSON expression language with:
- **Logical operators**: `all`, `any`, `not`
- **Comparison operators**: `eq`, `ne`, `gt`, `lt`, `gte`, `lte`
- **Set operators**: `in`, `not_in`
- **Existence operators**: `exists`, `not_exists`
- **String operators**: `matches_regex`, `contains`
- **Safe functions**: `len`, `count_where`, `years_between`, `months_between`,
  `today`, `lower`, `upper`, `institution_recognized`

Operands are either JSON literals, `{ ref: "path" }` references resolved against
a typed attribute catalog, or safe function calls.

### 2. Attribute-Path Catalog

A typed registry of valid reference paths (e.g., `student.enrollmentDate`,
`supervisor.publications`, `programme.ruleParameters.minHECPublications`).
Used by the validator at authoring time and by the evaluator at runtime.

### 3. Reader Extensions

To support HEC rule requirements, we extended the `@ums/source-data` package:
- `StudentRecord`: added `courseworkCompleted`, `comprehensiveExamStatus`,
  `comprehensiveExamDate`
- `SupervisorRecord`: added `publications[]` (with `indexedIn` for HEC-W
  category checking)
- New `IProgrammeProfileReader` with `ProgrammeRecord` (including `ruleParameters`
  map for programme-specific thresholds)
- New `IRecognizedInstitutionReader` for `institution_recognized` safe function

### 4. CatalogService

Full lifecycle management: create → draft → publish → effective → retire.
Versioning: editing an effective rule creates a new draft at version+1.
Publishing auto-retires the previous effective version.

### 5. Persistence Decoupling

The `IRuleStore` interface decouples the catalog service from Prisma.
`MemoryRuleStore` for tests, `PrismaRuleStore` for production.

## Consequences

**Positive:**
- Policy changes don't require code deployments
- Rules are auditable (version history, who edited, when)
- Predicate language is safe (no arbitrary code execution)
- Validator catches errors at authoring time, not evaluation time
- Attribute catalog provides IDE-like auto-complete for rule authors

**Negative:**
- Learning curve for rule authors (mitigated by predicate builder UI)
- Some complex HEC rules may push the limits of the expression language
- `institution_recognized` requires pre-resolution into CaseContext
  (async reader calls can't happen during synchronous evaluation)

**Risks:**
- Expression language may need extension for future HEC policies
  (mitigated by safe function extensibility)
- Performance of `count_where` on large collections (mitigated by
  the 20-child limit on array operators and practical data sizes)

## References

- HEC PhD Policy 2023, Sections 2-5
- University Statute 2024, Chapter 8-9
- Slice 3 Brief: ASRB Compliance Rules Catalog and Editor
