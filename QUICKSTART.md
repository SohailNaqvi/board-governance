# Quick Start Guide - Board Governance Module

## Prerequisites
- Node.js 18+ installed
- pnpm 9.0.0+ installed
- PostgreSQL 14+ running locally
- Git configured

## Installation (5 minutes)

### 1. Install Dependencies
```bash
cd board-governance
pnpm install
```

### 2. Configure Environment
```bash
# Create local environment files
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
cp prisma/.env.example prisma/.env.local
```

Edit `.env.local` and set your PostgreSQL connection string:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/board_governance"
```

### 3. Setup Database
```bash
# Create database and run migrations
pnpm db:push

# Seed with test data
pnpm db:seed
```

### 4. Start Development Server
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## First Login

1. Navigate to `http://localhost:3000/login`
2. Select any seed user from the dropdown:
   - **Alice Proposer** (AUTHORIZED_PROPOSER)
   - **Bob Secretary** (FEEDER_BODY_SECRETARY)
   - **Carol Registrar** (REGISTRAR)
   - **David Member** (SYNDICATE_MEMBER)
   - **Eva Treasurer** (TREASURER_LEGAL)
   - **Frank Admin** (SYSTEM_ADMINISTRATOR)
   - **Grace Vice Chancellor** (VICE_CHANCELLOR)
3. Click "Login"
4. You'll be redirected to the role-specific dashboard

## Testing

### Run All Tests
```bash
pnpm test
```

### Run Specific Test Suite
```bash
pnpm test:unit        # Unit tests only
pnpm test:contract    # Contract tests only
```

### Run Tests with Coverage
```bash
pnpm test -- --coverage
```

## Code Quality

### Type Check
```bash
pnpm typecheck
```

### Lint
```bash
pnpm lint
```

### Format Code
```bash
pnpm lint -- --fix
```

## Database Management

### Prisma Studio (GUI)
```bash
pnpm db:studio
```

Opens browser-based database viewer at `http://localhost:5555`

### Create Migration
After modifying `prisma/schema.prisma`:
```bash
pnpm db:migrate
```

### Seed Database
```bash
pnpm db:seed
```

## API Endpoints

### Health Check
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "commitSha": "abc1234",
  "dbConnected": true,
  "sourceDataProvider": "mock",
  "timestamp": "2024-04-17T10:00:00Z"
}
```

### Get Current User
```bash
curl -b "session=<jwt_token>" http://localhost:3000/api/me
```

## Build for Production

```bash
pnpm build
pnpm start
```

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env.local`
- Check database exists: `psql -l`

### Port 3000 Already in Use
```bash
# Use different port
PORT=3001 pnpm dev
```

### Module Not Found Errors
```bash
# Rebuild packages
pnpm build
```

### Prisma Issues
```bash
# Regenerate Prisma client
pnpm prisma generate

# Reset database
pnpm prisma migrate reset
```

## Development Tips

### Watch Mode for Tests
```bash
pnpm test -- --watch
```

### Debug with VS Code
Add to `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "runtimeVersion": "18.0.0",
      "request": "launch",
      "program": "${workspaceFolder}/apps/web/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/apps/web"
    }
  ]
}
```

### Code Generation
```bash
# Regenerate Prisma types
pnpm prisma generate
```

## Project Structure

- **apps/web** - Next.js frontend application
- **packages/domain** - Business logic, enums, state machines
- **packages/source-data** - Data provider abstraction
- **packages/audit** - Audit trail system
- **prisma/** - Database schema and migrations
- **tests/** - Unit, contract, and E2E tests
- **docs/adr/** - Architecture Decision Records

## Next Steps

1. **Explore the Code**: Read `PROJECT_STRUCTURE.md` for detailed overview
2. **Run Tests**: `pnpm test` to verify everything works
3. **Review ADRs**: Check `docs/adr/` for design decisions
4. **Start Coding**: Begin implementing Slice 2 features

## Support

For issues:
1. Check `CONTRIBUTING.md` for guidelines
2. Review `docs/adr/` for architectural decisions
3. Run `pnpm lint` and `pnpm typecheck` before committing

## Key Files to Know

- `pnpm-workspace.yaml` - Monorepo configuration
- `turbo.json` - Build orchestration
- `prisma/schema.prisma` - Data model
- `apps/web/src/app/` - Next.js routes and pages
- `packages/*/src/` - Shared library code
- `tests/` - Test suites

Happy coding! 🚀
