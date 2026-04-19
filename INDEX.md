# Slice 1 Project - File Index

Quick reference guide to all project files and their purposes.

## 📍 Start Here
- **[README.md](README.md)** - Project overview and setup
- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute quick start guide
- **[MANIFEST.md](MANIFEST.md)** - Complete deliverables checklist

## 📋 Documentation
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Detailed structure explanation
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guidelines
- **[docs/adr/0001-source-data-abstraction.md](docs/adr/0001-source-data-abstraction.md)** - Architecture decision

## ⚙️ Root Configuration

### Monorepo & Build
- **[pnpm-workspace.yaml](pnpm-workspace.yaml)** - Workspace package locations
- **[package.json](package.json)** - Root scripts and dependencies
- **[turbo.json](turbo.json)** - Build orchestration
- **[tsconfig.json](tsconfig.json)** - Root TypeScript config (strict)

### Quality & Standards
- **[.eslintrc.json](.eslintrc.json)** - ESLint configuration
- **[.prettierrc](.prettierrc)** - Code formatter rules
- **[vitest.config.ts](vitest.config.ts)** - Test runner configuration

### Environment & Git
- **[.env.example](.env.example)** - Environment template
- **[.gitignore](.gitignore)** - Git exclusions

### CI/CD
- **[.github/workflows/ci.yml](.github/workflows/ci.yml)** - GitHub Actions pipeline

## 📦 @ums/domain Package
Business logic, enums, and state machines.

- **[packages/domain/package.json](packages/domain/package.json)** - Package config
- **[packages/domain/tsconfig.json](packages/domain/tsconfig.json)** - TypeScript config
- **[packages/domain/src/enums.ts](packages/domain/src/enums.ts)** - All status & role enums
- **[packages/domain/src/state-machines.ts](packages/domain/src/state-machines.ts)** - Transition logic
- **[packages/domain/src/index.ts](packages/domain/src/index.ts)** - Exports

## 🔗 @ums/source-data Package
Data provider abstraction for external systems.

- **[packages/source-data/package.json](packages/source-data/package.json)** - Package config
- **[packages/source-data/tsconfig.json](packages/source-data/tsconfig.json)** - TypeScript config
- **[packages/source-data/src/interfaces.ts](packages/source-data/src/interfaces.ts)** - Interface contracts
- **[packages/source-data/src/mock-reader.ts](packages/source-data/src/mock-reader.ts)** - Mock implementations
- **[packages/source-data/src/warehouse-reader.ts](packages/source-data/src/warehouse-reader.ts)** - Warehouse stubs
- **[packages/source-data/src/factory.ts](packages/source-data/src/factory.ts)** - Provider factory
- **[packages/source-data/src/index.ts](packages/source-data/src/index.ts)** - Exports

## 🔐 @ums/audit Package
Audit trail system with cryptographic verification.

- **[packages/audit/package.json](packages/audit/package.json)** - Package config
- **[packages/audit/tsconfig.json](packages/audit/tsconfig.json)** - TypeScript config
- **[packages/audit/src/crypto.ts](packages/audit/src/crypto.ts)** - Hashing utilities
- **[packages/audit/src/audit-event.ts](packages/audit/src/audit-event.ts)** - Audit event system
- **[packages/audit/src/index.ts](packages/audit/src/index.ts)** - Exports

## 🌐 Next.js Web Application

### Configuration
- **[apps/web/package.json](apps/web/package.json)** - App dependencies & scripts
- **[apps/web/tsconfig.json](apps/web/tsconfig.json)** - TypeScript config with aliases
- **[apps/web/next.config.js](apps/web/next.config.js)** - Next.js config
- **[apps/web/tailwind.config.js](apps/web/tailwind.config.js)** - Tailwind CSS
- **[apps/web/postcss.config.js](apps/web/postcss.config.js)** - PostCSS
- **[apps/web/.env.example](apps/web/.env.example)** - Environment template

### Routes & Pages
- **[apps/web/src/app/layout.tsx](apps/web/src/app/layout.tsx)** - Root layout
- **[apps/web/src/app/page.tsx](apps/web/src/app/page.tsx)** - Redirect to login
- **[apps/web/src/app/login/page.tsx](apps/web/src/app/login/page.tsx)** - Login form
- **[apps/web/src/app/dashboard/page.tsx](apps/web/src/app/dashboard/page.tsx)** - Dashboard

### API Routes
- **[apps/web/src/app/api/auth/login/route.ts](apps/web/src/app/api/auth/login/route.ts)** - Login endpoint
- **[apps/web/src/app/api/auth/logout/route.ts](apps/web/src/app/api/auth/logout/route.ts)** - Logout endpoint
- **[apps/web/src/app/api/me/route.ts](apps/web/src/app/api/me/route.ts)** - Current user endpoint
- **[apps/web/src/app/api/health/route.ts](apps/web/src/app/api/health/route.ts)** - Health check

### Libraries
- **[apps/web/src/lib/logger/index.ts](apps/web/src/lib/logger/index.ts)** - Pino setup
- **[apps/web/src/lib/auth/seed-users.ts](apps/web/src/lib/auth/seed-users.ts)** - Test users
- **[apps/web/src/lib/auth/session.ts](apps/web/src/lib/auth/session.ts)** - JWT management
- **[apps/web/src/lib/auth/index.ts](apps/web/src/lib/auth/index.ts)** - Exports

### Styling
- **[apps/web/src/globals.css](apps/web/src/globals.css)** - Global styles

### Placeholders (Future Slices)
- **[apps/web/src/cockpit/](apps/web/src/cockpit/)** - Slice 5 placeholder
- **[apps/web/src/workspaces/](apps/web/src/workspaces/)** - Slices 3,4,6,7 placeholder
- **[apps/web/src/intelligence/](apps/web/src/intelligence/)** - Slices 4+ placeholder
- **[apps/web/src/apce/](apps/web/src/apce/)** - Slice 2 placeholder

## 🗄️ Prisma & Database

### Schema
- **[prisma/schema.prisma](prisma/schema.prisma)** - PostgreSQL data model
  - 14 entities with relations
  - Status enums
  - Cascading deletes
  - Indexes & unique constraints

### Seeds & Config
- **[prisma/seed.ts](prisma/seed.ts)** - Development data
  - 7 roles
  - 7 users (one per role)
  - Meeting calendar
  - Resolutions & members
- **[prisma/.env.example](prisma/.env.example)** - Database URL template

## 🧪 Tests

### Unit Tests
- **[tests/unit/state-machines.test.ts](tests/unit/state-machines.test.ts)** - Transition validation
  - 25+ test cases
  - All 3 state machines
  - Full transition matrices

- **[tests/unit/audit.test.ts](tests/unit/audit.test.ts)** - Cryptography & audit
  - 12+ test cases
  - Hashing determinism
  - Tampering detection

### Contract Tests
- **[tests/contract/mock-reader.test.ts](tests/contract/mock-reader.test.ts)** - Interface compliance
  - 15+ test cases
  - 4 MockReader implementations
  - Seed data verification

### E2E Tests
- **[tests/e2e/](tests/e2e/)** - Placeholder for future E2E tests

## 🔍 Key Concepts

### Monorepo Structure
The project uses pnpm workspaces with 4 workspace members:
1. `@ums/domain` - Business logic
2. `@ums/source-data` - Data abstraction
3. `@ums/audit` - Audit system
4. `@ums/web` - Next.js frontend

### Database Entities (14 Total)
1. User - System users
2. Role - User roles
3. MeetingCalendar - Board meetings
4. AgendaItem - Meeting items (10 statuses)
5. WorkingPaper - Documents (6 statuses)
6. Annexure - Attachments
7. FeederBodyResolution - Resolutions
8. SyndicateMember - Board members
9. ReadReceipt - Document reads
10. MemberQuery - Member questions
11. Decision - Meeting decisions
12. ActionTakenEntry - Actions (4 statuses)
13. NotificationForAction - Action notifications
14. AuditEvent - Audit trail

### Authentication
- JWT-based sessions
- Seed users for development
- Role-based access control
- HttpOnly secure cookies

### Testing Strategy
- **Unit**: State transitions, hashing, enums
- **Contract**: Interface compliance for data providers
- **E2E**: Future integration tests

## 🚀 Quick Commands

```bash
# Installation
pnpm install

# Development
pnpm dev              # All services
pnpm test             # All tests
pnpm typecheck        # Type checking
pnpm lint             # Linting

# Database
pnpm db:push          # Migrate schema
pnpm db:seed          # Seed data
pnpm db:studio        # Open GUI

# Building
pnpm build            # Production build
pnpm start            # Run build
```

## 📌 Important Notes

### Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL + Prisma
- **Styling**: Tailwind CSS
- **Testing**: Vitest
- **Logging**: Pino
- **Monorepo**: pnpm workspaces
- **Build**: Turborepo

### Seed Users (Dev Only)
All have password-free login via dropdown:
- proposer@university.edu (AUTHORIZED_PROPOSER)
- secretary@university.edu (FEEDER_BODY_SECRETARY)
- registrar@university.edu (REGISTRAR)
- member@university.edu (SYNDICATE_MEMBER)
- treasurer@university.edu (TREASURER_LEGAL)
- sysadmin@university.edu (SYSTEM_ADMINISTRATOR)
- vc@university.edu (VICE_CHANCELLOR)

### Development Workflow
1. Install dependencies: `pnpm install`
2. Setup database: `pnpm db:push && pnpm db:seed`
3. Start dev server: `pnpm dev`
4. Navigate to: http://localhost:3000/login
5. Select a seed user and login
6. Explore role-based dashboard

## 🎯 Next Steps

1. **Review Documentation**
   - Start with QUICKSTART.md
   - Read PROJECT_STRUCTURE.md for details

2. **Understand Architecture**
   - Review docs/adr/0001-source-data-abstraction.md
   - Examine package interfaces

3. **Run & Verify**
   - `pnpm install && pnpm db:push && pnpm dev`
   - Login at http://localhost:3000
   - Run tests: `pnpm test`

4. **Implement Slice 2**
   - Add APCE features in `apps/web/src/apce/`
   - Follow patterns from existing code

---

For detailed information about any file or feature, refer to the documentation files or check the specific file's comments.
