# ASRB Slice 2: Case Intake API - Build Summary

## Overview
Successfully built the complete Case Intake API for the ASRB Governance Module. This implementation provides a production-ready API for feeder bodies (DGSC and Faculty Board) to submit graduate research cases to the Academic Standards Review Board.

## Components Built

### 1. Database Schema Extension (`/prisma/schema.prisma`)
Added 4 new enums and 4 new models:

**Enums:**
- `ASRBCaseStatus` - 11 case lifecycle states (RECEIVED, COMPLIANCE_EVALUATED, VETTING, etc.)
- `CaseType` - 12 case types (SYNOPSIS_APPROVAL, GEC_CONSTITUTION, EXAMINER_APPOINTMENT, etc.)
- `CaseUrgency` - NORMAL, URGENT_CIRCULATION
- `FeederBodyType` - DGSC, FACULTY_BOARD

**Models:**
- `ASRBCase` - Core case entity with idempotency, status tracking, resolution references
- `CaseAttachment` - File attachments with upload tokens and expiry
- `CaseAuditEvent` - Audit trail for case events
- `FeederClient` - API client authentication and rate limiting config

### 2. Domain Package Extensions (`/packages/domain/src/`)

**enums.ts:**
- Added `ASRBCaseStatus`, `CaseType`, `CaseUrgency`, `FeederBodyType` enums

**state-machines.ts:**
- Added `asrbCaseTransitions` transition matrix (11 states with valid transitions)
- Added `canTransitionASRBCase()` function for state validation
- Transitions allow realistic case workflow (RECEIVED → COMPLIANCE_EVALUATED → VETTING → etc.)

### 3. Source-Data Package Extensions (`/packages/source-data/src/`)

**interfaces.ts:**
- `StudentRecord` - Student info (regNo, name, programme, department, enrollment, status)
- `IStudentReader` - Query students by registration number
- `SupervisorRecord` - Supervisor info (empId, name, department, qualification level, supervision count)
- `ISupervisorReader` - Query supervisors by employee ID

**mock-reader.ts:**
- `MockStudentReader` with 3 seed students
- `MockSupervisorReader` with 3 seed supervisors
- `MockASRBResolutionReader` for DGSC and FACULTY_BOARD resolutions
- Deterministic test data for development/testing

### 4. ASRB Zod Schemas (`/apps/web/src/lib/asrb/schemas.ts`)

**Main Validation:**
- `CaseIntakeEnvelopeSchema` - Top-level request envelope
- `CasePayloadSchema` - Discriminated union of 12 case type payloads
- `AttachmentMetadataSchema` - File metadata validation (size limit 50MB)

**12 Case Type Payloads:**
1. SYNOPSIS_APPROVAL - Student synopsis with title/abstract
2. GEC_CONSTITUTION - Committee formation with members
3. EXAMINER_APPOINTMENT - Examiner role assignment (INTERNAL/EXTERNAL)
4. RESULT_APPROVAL - Grade/marks and status
5. SUPERVISOR_CHANGE - Current→New supervisor with reason
6. TOPIC_CHANGE - Old→New research topic with justification
7. EXTENSION_CANDIDATURE - Duration extension request
8. LEAVE_ABSENCE - Leave dates/type/reason
9. RESEARCH_PROJECT_APPROVAL - Project description/area/duration
10. COMPREHENSIVE_RESULT - Exam date/performance/viva marks
11. COURSEWORK_WAIVER - Course waiver with alternative assessment
12. OTHER - Custom cases with flexible data

### 5. API Key Authentication (`/apps/web/src/lib/asrb/api-key-auth.ts`)

**Features:**
- Bearer token extraction from Authorization header
- SHA256 hashing for API key comparison
- Feeder client lookup and activation check
- Case type permission validation
- In-memory rate limiter (60 req/min default, configurable override)
- Context object with client metadata

**Exported Functions:**
- `authenticateAPIKey()` - Validate and lookup feeder client
- `checkRateLimit()` - Enforce rate limits per client
- `canCaseTypeBeProcessed()` - Permission checking
- `validateAndAuthenticateRequest()` - Full auth + permissions pipeline

### 6. Receipt Generator (`/apps/web/src/lib/asrb/receipt.ts`)

**Format:** `ASRB-YYYY-MM-NNNNNN`
- Year and month extracted from current date
- Sequential number per month (zero-padded to 6 digits)
- Database query to find last receipt for current month
- Idempotent (same reference for duplicate idempotency keys)

### 7. Intake Service (`/apps/web/src/lib/asrb/intake-service.ts`)

**Core Functions:**

`submitCase(input)`:
- Reference validation (student, supervisor, resolution)
- Idempotency checking with payload hash comparison
- 409 Conflict response if different payload with same key
- Receipt reference generation
- Transactional case + attachments + audit creation
- Pre-signed upload token generation (HMAC-signed, 60-min expiry)

`getCaseStatus(caseId, feederClientId)`:
- Access control (case must belong to requesting feeder client)
- Returns: caseId, status, receivedAt, lastTransitionAt, receiptReference

`verifyUploadToken(token)`:
- HMAC signature verification
- Expiry timestamp validation
- Returns valid flag + attachmentId

**Upload Token Generation:**
- Format: `{attachmentId}:{expiryISO}:{hmacSignature}`
- 60-minute default expiry
- HMAC-SHA256 with environment secret

### 8. API Routes

**POST /api/asrb/cases (`/apps/web/src/app/api/asrb/cases/route.ts`)**

Accepts: CaseIntakeEnvelope JSON body

Returns (201):
```json
{
  "caseId": "string",
  "status": "RECEIVED",
  "receiptReference": "ASRB-2026-04-000001",
  "receivedAt": "ISO8601",
  "uploadUrls": [
    {
      "attachmentId": "string",
      "uploadUrl": "/api/asrb/attachments/{id}/upload",
      "uploadToken": "string",
      "expiresAt": "ISO8601"
    }
  ]
}
```

Error Responses (RFC 7807 problem+json):
- 400 Bad Request - Invalid JSON/payload
- 401 Unauthorized - Missing/invalid API key
- 403 Forbidden - Case type not permitted for client
- 404 Not Found - Reference validation failed
- 409 Conflict - Different payload with same idempotency key
- 413 Payload Too Large - File exceeds 50MB
- 422 Unprocessable Entity - Validation errors
- 429 Too Many Requests - Rate limit exceeded
- 500 Internal Server Error

**GET /api/asrb/cases/[id]/status (`/apps/web/src/app/api/asrb/cases/[id]/status/route.ts`)**

Authentication: Bearer token required

Returns (200):
```json
{
  "caseId": "string",
  "status": "RECEIVED|COMPLIANCE_EVALUATED|...",
  "receivedAt": "ISO8601",
  "lastTransitionAt": "ISO8601",
  "receiptReference": "ASRB-2026-04-000001"
}
```

Access Control: Feeder client can only access their own cases (403 if unauthorized)

**PUT /api/asrb/attachments/[id]/upload (`/apps/web/src/app/api/asrb/attachments/[id]/upload/route.ts`)**

Query Params: `?token={uploadToken}`

Body: Binary file data

Process:
1. Token verification (HMAC + expiry)
2. Attachment lookup from database
3. File size validation vs. declared size
4. Filesystem storage to `./uploads/asrb/{caseId}/{attachmentId}/{filename}`
5. Database update: mark uploaded=true, set storageRef

Returns (200):
```json
{
  "attachmentId": "string",
  "caseId": "string",
  "filename": "string",
  "uploadedAt": "ISO8601",
  "storageRef": "string"
}
```

Error Handling:
- 400 Bad Request - Invalid token/file size mismatch
- 401 Unauthorized - Invalid/expired token
- 404 Not Found - Attachment not found
- 413 Payload Too Large - Size mismatch
- 500 Internal Server Error

### 9. Database Migration (`/prisma/migrate-asrb-slice2.mjs`)

**Operations:**
1. Create 4 PostgreSQL enums (ASRBCaseStatus, CaseType, CaseUrgency, FeederBodyType)
2. Create FeederClient table with indexes
3. Create ASRBCase table with foreign key to FeederClient
4. Create CaseAttachment table with FK to ASRBCase
5. Create CaseAuditEvent table with FK to ASRBCase
6. Seed two FeederClient records:
   - **DGSC**: displayName="Departmental Graduate Studies Committee", feederBodyCode="DGSC"
     - API Key Hash: SHA256("dgsc-test-key-2026")
     - Permitted case types: SYNOPSIS_APPROVAL, EXAMINER_APPOINTMENT, SUPERVISOR_CHANGE, TOPIC_CHANGE, EXTENSION_CANDIDATURE, COMPREHENSIVE_RESULT
   - **FACULTY_BOARD**: displayName="Faculty Board of Studies", feederBodyCode="FACULTY_BOARD"
     - API Key Hash: SHA256("faculty-board-test-key-2026")
     - Permitted case types: All 12 case types

### 10. Build Configuration Updates

**render-build.sh:**
- Added migration execution for ASRB Slice 2
- Runs after existing Board Governance Slice 2 migration
- Command: `node prisma/migrate-asrb-slice2.mjs`

**apps/web/package.json:**
- Added zod dependency (^3.22.4) for schema validation

**.gitignore:**
- Added `uploads/` directory to prevent committing uploaded files

## Key Design Decisions

1. **Idempotency**: Based on `(feederClientId, idempotencyKey)` tuple with payload hash comparison
2. **Rate Limiting**: In-memory with 60 sec window per client, configurable per-client override
3. **Upload Tokens**: HMAC-signed with 60-min expiry, tied to specific attachment
4. **File Storage**: Filesystem-based in `./uploads/asrb/{caseId}/{attachmentId}/{filename}`
5. **Reference Validation**: Uses mock readers for development (easy to swap for real data sources)
6. **State Machine**: Flexible transitions allowing realistic case workflow (RETURNED → COMPLIANCE_EVALUATED)
7. **Error Responses**: RFC 7807 problem+json format with detailed validation errors

## Testing

**Test API Keys (Development Only):**
- DGSC: `dgsc-test-key-2026`
- Faculty Board: `faculty-board-test-key-2026`

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/asrb/cases \
  -H "Authorization: Bearer dgsc-test-key-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "idempotency_key": "req-001",
    "feeder_body_ref": "DGSC",
    "case_type": "SYNOPSIS_APPROVAL",
    "urgency": "NORMAL",
    "student_ref": "REG-2022-001",
    "supervisor_ref": "EMP-CSE-001",
    "programme_ref": "PhD-CSE",
    "case_payload": {
      "case_type": "SYNOPSIS_APPROVAL",
      "student_reg_no": "REG-2022-001",
      "supervisor_emp_id": "EMP-CSE-001",
      "programme_code": "PhD-CSE",
      "synopsis_title": "...",
      "synopsis_abstract": "...",
      "dept_code": "CSE"
    },
    "attachments": []
  }'
```

## Deployment Notes

- Requires Node.js and PostgreSQL
- Environment variables: `DATABASE_URL`, `UPLOAD_HMAC_SECRET` (optional, defaults to dev value)
- Migration runs automatically on Render during build
- Uploads directory must be writable and persistent (configure in deployment)
- Test keys should be rotated in production

## Files Created/Modified

### Created Files
- `/apps/web/src/lib/asrb/schemas.ts`
- `/apps/web/src/lib/asrb/api-key-auth.ts`
- `/apps/web/src/lib/asrb/receipt.ts`
- `/apps/web/src/lib/asrb/intake-service.ts`
- `/apps/web/src/app/api/asrb/cases/route.ts`
- `/apps/web/src/app/api/asrb/cases/[id]/status/route.ts`
- `/apps/web/src/app/api/asrb/attachments/[id]/upload/route.ts`
- `/prisma/migrate-asrb-slice2.mjs`

### Modified Files
- `/prisma/schema.prisma` (added 4 enums + 4 models)
- `/packages/domain/src/enums.ts` (added ASRB enums)
- `/packages/domain/src/state-machines.ts` (added ASRB transitions)
- `/packages/source-data/src/interfaces.ts` (added StudentRecord, ISupervisorReader, etc.)
- `/packages/source-data/src/mock-reader.ts` (added mock implementations)
- `/apps/web/package.json` (added zod dependency)
- `/render-build.sh` (added ASRB migration)
- `/.gitignore` (added uploads directory)

## Next Steps (Slices 3-7)

The Slice 2 Case Intake API provides the foundation for:
- Slice 3: Case Evaluation & Compliance Checking
- Slice 4: Vetting & Committee Routing
- Slice 5: Agenda Management & Circulation
- Slice 6: Decision Making & Outcomes
- Slice 7: Integration & Notifications

All reference data sources (students, supervisors, resolutions) are pluggable through the source-data package interfaces.
