# Board Governance Module - University DSS

A comprehensive system for managing board meeting processes, including agenda items, working papers, resolutions, and audit trails.

## Slice 1: Foundations

This is Slice 1 of the Board Governance Module, implementing:

- **Project scaffold** with pnpm workspaces, TypeScript strict mode, Prisma ORM
- **14 Prisma entities** with full relational schema and status enums
- **Source data abstraction** (MockReader and WarehouseReader)
- **Audit trail system** with cryptographic verification
- **State machine engines** for AgendaItem, WorkingPaper, ActionTakenEntry
- **SSO stub authentication** with role-based access control
- **Health endpoint** and API middleware
- **Testing framework** (Vitest) with unit and contract tests
- **CI/CD pipeline** (GitHub Actions)

## Project Structure

```
board-governance/
├── apps/
│   └── web/                    # Next.js App Router application
├── packages/
│   ├── source-data/            # Data provider abstraction
│   ├── domain/                 # Core business logic and enums
│   └── audit/                  # Audit trail system
├── prisma/
│   └── schema.prisma           # PostgreSQL data model
├── tests/                      # Test suites
├── docs/                       # Architecture and ADRs
└── .github/workflows/          # CI/CD pipelines
```

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS
- **Testing**: Vitest
- **Logging**: Pino
- **Monorepo**: pnpm workspaces

## Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- PostgreSQL 14+

### Installation

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local

# Setup database
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

## Development

```bash
# Run all development servers
pnpm dev

# Run tests
pnpm test
pnpm test:unit
pnpm test:contract

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Database studio
pnpm db:studio
```

## API Endpoints

- `GET /api/health` - Health check with version and connectivity status
- `GET /api/me` - Get current user info
- `POST /login` - Login with seed users (dev only)
- `GET /dashboard` - Role-specific dashboard

## Documentation

See `docs/adr/` for Architecture Decision Records.

## License

MIT
