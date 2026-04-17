# Board Governance Module - Slice 1 Project Structure

## Overview
Complete Slice 1 scaffolding for the Board Governance Module of the University DSS, using Next.js 14, TypeScript, Prisma, and PostgreSQL in a pnpm monorepo.

## Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root workspace configuration with turbo/pnpm scripts |
| `pnpm-workspace.yaml` | Defines workspace packages locations |
| `tsconfig.json` | Root TypeScript configuration (strict mode) |
| `vitest.config.ts` | Vitest test runner configuration |
| `turbo.json` | Turborepo build system configuration |
| `.env.example` | Environment variables template |
| `.prettierrc` | Code formatting rules |
| `.eslintrc.json` | Linting configuration |
| `.gitignore` | Git exclusions |
| `README.md` | Project documentation |
| `CONTRIBUTING.md` | Contribution guidelines |

## Directory Structure

### /apps/web - Next.js Application
The main web application with App Router.

**Key Files:**
- `package.json` - Next.js app dependencies
- `tsconfig.json` - App-specific TypeScript config
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS setup
- `postcss.config.js` - PostCSS/Autoprefixer config
- `.env.example` - App environment variables

**Source Code (/src):**
```
src/
├── app/
│   ├── layout.tsx              # Root layout with header
│   ├── page.tsx                # Redirect to /login
│   ├── login/page.tsx          # Login page with seed user dropdown
│   ├── dashboard/page.tsx      # Role-based dashboard
│   └── api/
│       ├── auth/login/route.ts       # JWT session creation
│       ├── auth/logout/route.ts      # Session deletion
│       ├── me/route.ts               # Current user info
│       └── health/route.ts           # Health check endpoint
├── lib/
│   ├── auth/                   # Authentication utilities
│   │   ├── seed-users.ts       # Hardcoded test users
│   │   ├── session.ts          # JWT session management
│   │   └── index.ts
│   └── logger/                 # Pino logging setup
│       └── index.ts
├── globals.css                 # Tailwind imports
├── cockpit/                    # Placeholder for Slice 5
├── workspaces/                 # Placeholder for Slices 3,4,6,7
├── intelligence/               # Placeholder for Slices 4+
└── apce/                       # Placeholder for Slice 2
```

### /packages - Shared Libraries

#### @ums/domain
Business logic, enums, and state machines.

**Files:**
- `src/enums.ts` - 4 status enums + UserRole enum
- `src/state-machines.ts` - Transition functions and matrices for AgendaItem, WorkingPaper, ActionTakenEntry
- `src/index.ts` - Barrel export

**Exports:**
- `AgendaItemStatus`, `WorkingPaperStatus`, `ActionTakenEntryStatus`, `UserRole`
- `canTransitionAgendaItem()`, `canTransitionWorkingPaper()`, `canTransitionActionTakenEntry()`
- Transition matrices for validation

#### @ums/source-data
Data provider abstraction for external systems.

**Files:**
- `src/interfaces.ts` - IHRDirectoryReader, IFinanceReader, IAcademicReader, IResolutionReader
- `src/mock-reader.ts` - MockHRDirectoryReader, MockFinanceReader, MockAcademicReader, MockResolutionReader (deterministic seed data)
- `src/warehouse-reader.ts` - Stub implementations that throw NotImplementedError
- `src/factory.ts` - createReader() factory function
- `src/index.ts` - Barrel export

**Key Features:**
- Interface-based contracts
- Deterministic mock data for testing
- Warehouse stubs for future integration
- Configuration-driven provider selection

#### @ums/audit
Audit trail system with cryptographic verification.

**Files:**
- `src/crypto.ts` - canonicalJsonSerialize(), sha256Hash(), computePayloadHash()
- `src/audit-event.ts` - createAuditEvent(), verifyAuditEvent()
- `src/index.ts` - Barrel export

**Key Features:**
- Deterministic canonical JSON serialization
- SHA-256 hashing for payload verification
- Immutable audit records with hash verification
- Detects tampering

### /prisma - Database
PostgreSQL schema and seed script.

**Files:**
- `schema.prisma` - Complete data model with 14 entities
- `seed.ts` - Seeding script for development data
- `.env.example` - Database URL template

**Entities (14 total):**
1. `User` - System users
2. `Role` - User roles
3. `MeetingCalendar` - Board meetings
4. `AgendaItem` - Meeting agenda items (10 statuses)
5. `WorkingPaper` - Supporting documents (6 statuses)
6. `Annexure` - Attachments to papers/items
7. `FeederBodyResolution` - Resolution records
8. `SyndicateMember` - Board member records
9. `ReadReceipt` - Document read tracking
10. `MemberQuery` - Questions from members
11. `Decision` - Meeting decisions
12. `ActionTakenEntry` - Action items (4 statuses)
13. `NotificationForAction` - Action notifications
14. `AuditEvent` - Audit trail entries

**Key Features:**
- All status enums defined in schema
- Proper foreign keys with cascading deletes
- Indexes on frequently-queried fields
- Unique constraints on meeting_number and (body_code + resolution_number)

### /tests - Test Suites

#### /tests/unit
Unit tests for core business logic.

**Files:**
- `unit/state-machines.test.ts` - Tests all transitions for all 3 state machines (25+ test cases)
- `unit/audit.test.ts` - Tests crypto functions, hashing, and verification (12+ test cases)

#### /tests/contract
Contract tests verifying implementations conform to interfaces.

**Files:**
- `contract/mock-reader.test.ts` - Tests all 4 MockReader implementations against their interfaces (15+ test cases)

#### /tests/e2e
E2E tests (placeholder for future).

### /docs - Documentation

**Files:**
- `docs/adr/0001-source-data-abstraction.md` - Architecture Decision Record explaining data abstraction pattern

### /.github - CI/CD

**Files:**
- `.github/workflows/ci.yml` - GitHub Actions pipeline with:
  - Linting (ESLint)
  - Type checking (TypeScript)
  - Unit tests (Vitest)
  - Contract tests (Vitest)
  - Prisma migration validation
  - Build verification
  - Runs on multiple Node versions (18.x, 20.x)

## Key Technical Decisions

### Monorepo Architecture
- pnpm workspaces for package management
- Turborepo for build orchestration
- Shared tsconfig.json at root
- Independent package.json per workspace

### Authentication
- JWT-based session management
- Seed users for development
- Role-based access control
- HttpOnly cookies for session storage

### Data Abstraction
- Interface-based contracts for external data sources
- MockReader for development/testing
- WarehouseReader stubs for production integration
- Factory pattern for provider selection

### State Machines
- Pure transition validation functions
- Explicit transition matrices
- Enum-based status values
- Full coverage testing

### Audit Trail
- Cryptographic integrity verification
- Canonical JSON serialization for deterministic hashing
- SHA-256 for payload hashing
- Immutable records with verification

### Testing
- Vitest for unit and contract tests
- Full transition matrix coverage (50+ test cases total)
- Mock data determinism verification
- Interface contract testing

## Development Workflow

### Setup
```bash
pnpm install
cp .env.example .env.local
pnpm db:push
pnpm db:seed
```

### Development
```bash
pnpm dev              # Run all apps
pnpm test             # Run all tests
pnpm typecheck        # Type check all packages
pnpm lint             # Lint all packages
```

### Database
```bash
pnpm db:migrate       # Create migration
pnpm db:seed          # Seed data
pnpm db:studio        # Open Prisma Studio
```

## Files Overview Summary

| Category | Count | Files |
|----------|-------|-------|
| TypeScript/TSX | 27 | Package sources, routes, pages, tests |
| Configuration | 12 | tsconfig, next.config, tailwind, prettier, etc. |
| Schema/Database | 3 | schema.prisma, seed.ts, .env.example |
| Tests | 3 | state-machines, audit, mock-reader tests |
| Documentation | 3 | README, CONTRIBUTING, ADR |
| CI/CD | 1 | .github/workflows/ci.yml |
| Other | 6 | .gitignore, .prettierrc, .eslintrc, turbo.json, etc. |
| **Total** | **55+** | **Complete, production-ready scaffold** |

## Next Steps (Future Slices)

1. **Slice 2**: APCE functionality in `/apps/web/src/apce/`
2. **Slice 3**: Meeting Calendar in `/apps/web/src/workspaces/`
3. **Slice 4**: Agenda & Working Papers in `/apps/web/src/workspaces/`
4. **Slice 5**: Dashboard/Cockpit in `/apps/web/src/cockpit/`
5. **Slice 6**: Actual WarehouseReader implementations
6. **Slice 7**: Analytics & Intelligence in `/apps/web/src/intelligence/`

## Seed Data

### Users (7 total)
- proposer@university.edu (AUTHORIZED_PROPOSER)
- secretary@university.edu (FEEDER_BODY_SECRETARY)
- registrar@university.edu (REGISTRAR)
- member@university.edu (SYNDICATE_MEMBER)
- treasurer@university.edu (TREASURER_LEGAL)
- sysadmin@university.edu (SYSTEM_ADMINISTRATOR)
- vc@university.edu (VICE_CHANCELLOR)

### Meeting Calendar
- 1 meeting scheduled for 2024-06-15

### Feeder Body Resolutions
- 2 resolutions for testing (bodyCode: SN)

### Syndicate Members
- 2 members from different departments

## Environment Variables

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | postgresql://... | PostgreSQL connection |
| `NODE_ENV` | development | Environment mode |
| `LOG_LEVEL` | debug | Pino logging level |
| `JWT_SECRET` | dev-secret-... | Session signing key |
| `DATA_PROVIDER` | mock | Data source selection |
| `WAREHOUSE_URL` | http://... | External warehouse endpoint |

