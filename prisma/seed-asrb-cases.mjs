import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 20 deterministic ASRBCase fixtures across 6 case types and varied statuses
const cases = [
  // SYNOPSIS_APPROVAL cases (5)
  {
    id: "asrb-case-001", caseType: "SYNOPSIS_APPROVAL", status: "RECEIVED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-01-000001", idempotencyKey: "seed-idem-001",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2022-PHD-CS-001", supervisorEmpId: "EMP-101", programmeCode: "PHD-CS",
    casePayload: JSON.stringify({ similarity_index: 12, proposed_title: "Machine Learning for Crop Disease Detection" }),
  },
  {
    id: "asrb-case-002", caseType: "SYNOPSIS_APPROVAL", status: "COMPLIANCE_EVALUATED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-01-000002", idempotencyKey: "seed-idem-002",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2023-PHD-EE-002", supervisorEmpId: "EMP-102", programmeCode: "PHD-EE",
    casePayload: JSON.stringify({ similarity_index: 8, proposed_title: "5G Antenna Array Optimization" }),
  },
  {
    id: "asrb-case-003", caseType: "SYNOPSIS_APPROVAL", status: "VETTING", urgency: "NORMAL",
    receiptReference: "ASRB-2026-01-000003", idempotencyKey: "seed-idem-003",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2021-PHD-ME-003", supervisorEmpId: "EMP-103", programmeCode: "PHD-ME",
    casePayload: JSON.stringify({ similarity_index: 22, proposed_title: "Thermal Management in EVs" }),
  },
  {
    id: "asrb-case-004", caseType: "SYNOPSIS_APPROVAL", status: "DECIDED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-02-000004", idempotencyKey: "seed-idem-004",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2022-PHD-CH-004", supervisorEmpId: "EMP-104", programmeCode: "PHD-CH",
    casePayload: JSON.stringify({ similarity_index: 5, proposed_title: "Green Synthesis of Nanomaterials" }),
  },
  {
    id: "asrb-case-005", caseType: "SYNOPSIS_APPROVAL", status: "CLOSED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-02-000005", idempotencyKey: "seed-idem-005",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2020-PHD-BIO-005", supervisorEmpId: "EMP-105", programmeCode: "PHD-BIO",
    casePayload: JSON.stringify({ similarity_index: 15, proposed_title: "CRISPR Applications in Wheat Genomics" }),
  },
  // EXAMINER_APPOINTMENT cases (4)
  {
    id: "asrb-case-006", caseType: "EXAMINER_APPOINTMENT", status: "RECEIVED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-02-000006", idempotencyKey: "seed-idem-006",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2021-PHD-CS-006", supervisorEmpId: "EMP-106", programmeCode: "PHD-CS",
    casePayload: JSON.stringify({ proposed_examiners: [{ name: "Dr. A", category: "FOREIGN", institution: "MIT" }, { name: "Dr. B", category: "FOREIGN", institution: "Oxford" }, { name: "Dr. C", category: "NATIONAL", institution: "LUMS" }] }),
  },
  {
    id: "asrb-case-007", caseType: "EXAMINER_APPOINTMENT", status: "COMPLIANCE_EVALUATED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-02-000007", idempotencyKey: "seed-idem-007",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2022-PHD-EE-007", supervisorEmpId: "EMP-107", programmeCode: "PHD-EE",
    casePayload: JSON.stringify({ proposed_examiners: [{ name: "Dr. D", category: "FOREIGN", institution: "Stanford" }, { name: "Dr. E", category: "NATIONAL", institution: "NUST" }, { name: "Dr. F", category: "NATIONAL", institution: "QAU" }] }),
  },
  {
    id: "asrb-case-008", caseType: "EXAMINER_APPOINTMENT", status: "VETTING", urgency: "NORMAL",
    receiptReference: "ASRB-2026-03-000008", idempotencyKey: "seed-idem-008",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2020-PHD-ME-008", supervisorEmpId: "EMP-108", programmeCode: "PHD-ME",
    casePayload: JSON.stringify({ proposed_examiners: [{ name: "Dr. G", category: "FOREIGN", institution: "TU Munich" }, { name: "Dr. H", category: "FOREIGN", institution: "ETH Zurich" }, { name: "Dr. I", category: "NATIONAL", institution: "UET" }] }),
  },
  {
    id: "asrb-case-009", caseType: "EXAMINER_APPOINTMENT", status: "DECIDED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-03-000009", idempotencyKey: "seed-idem-009",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2021-PHD-CH-009", supervisorEmpId: "EMP-109", programmeCode: "PHD-CH",
    casePayload: JSON.stringify({ proposed_examiners: [{ name: "Dr. J", category: "FOREIGN", institution: "Cambridge" }, { name: "Dr. K", category: "FOREIGN", institution: "NUS" }, { name: "Dr. L", category: "NATIONAL", institution: "COMSATS" }] }),
  },
  // SUPERVISOR_CHANGE cases (3)
  {
    id: "asrb-case-010", caseType: "SUPERVISOR_CHANGE", status: "RECEIVED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-03-000010", idempotencyKey: "seed-idem-010",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2022-PHD-CS-010", supervisorEmpId: "EMP-110", programmeCode: "PHD-CS",
    casePayload: JSON.stringify({ current_supervisor: "EMP-110", proposed_supervisor: "EMP-111", reason: "Supervisor sabbatical" }),
  },
  {
    id: "asrb-case-011", caseType: "SUPERVISOR_CHANGE", status: "COMPLIANCE_EVALUATED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-03-000011", idempotencyKey: "seed-idem-011",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2023-PHD-EE-011", supervisorEmpId: "EMP-112", programmeCode: "PHD-EE",
    casePayload: JSON.stringify({ current_supervisor: "EMP-112", proposed_supervisor: "EMP-113", reason: "Research area mismatch" }),
  },
  {
    id: "asrb-case-012", caseType: "SUPERVISOR_CHANGE", status: "DECIDED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000012", idempotencyKey: "seed-idem-012",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2021-PHD-ME-012", supervisorEmpId: "EMP-114", programmeCode: "PHD-ME",
    casePayload: JSON.stringify({ current_supervisor: "EMP-114", proposed_supervisor: "EMP-115", reason: "Co-supervisor promotion to main" }),
  },
  // RESULT_APPROVAL cases (3)
  {
    id: "asrb-case-013", caseType: "RESULT_APPROVAL", status: "RECEIVED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000013", idempotencyKey: "seed-idem-013",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2019-PHD-CS-013", supervisorEmpId: "EMP-116", programmeCode: "PHD-CS",
    casePayload: JSON.stringify({ similarity_index: 10, examiner_reports: ["SATISFACTORY", "SATISFACTORY", "MINOR_REVISION"], viva_date: "2026-03-15" }),
  },
  {
    id: "asrb-case-014", caseType: "RESULT_APPROVAL", status: "VETTING", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000014", idempotencyKey: "seed-idem-014",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2020-PHD-EE-014", supervisorEmpId: "EMP-117", programmeCode: "PHD-EE",
    casePayload: JSON.stringify({ similarity_index: 7, examiner_reports: ["SATISFACTORY", "SATISFACTORY", "SATISFACTORY"], viva_date: "2026-02-20" }),
  },
  {
    id: "asrb-case-015", caseType: "RESULT_APPROVAL", status: "CLOSED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000015", idempotencyKey: "seed-idem-015",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2018-PHD-CH-015", supervisorEmpId: "EMP-118", programmeCode: "PHD-CH",
    casePayload: JSON.stringify({ similarity_index: 3, examiner_reports: ["SATISFACTORY", "SATISFACTORY", "SATISFACTORY"], viva_date: "2025-12-10" }),
  },
  // EXTENSION_CANDIDATURE cases (3)
  {
    id: "asrb-case-016", caseType: "EXTENSION_CANDIDATURE", status: "RECEIVED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000016", idempotencyKey: "seed-idem-016",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2019-PHD-BIO-016", supervisorEmpId: "EMP-119", programmeCode: "PHD-BIO",
    casePayload: JSON.stringify({ enrolment_date: "2019-09-01", current_end_date: "2026-08-31", requested_extension_months: 12, justification: "Lab equipment delays due to import restrictions" }),
  },
  {
    id: "asrb-case-017", caseType: "EXTENSION_CANDIDATURE", status: "COMPLIANCE_EVALUATED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000017", idempotencyKey: "seed-idem-017",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2018-PHD-CS-017", supervisorEmpId: "EMP-120", programmeCode: "PHD-CS",
    casePayload: JSON.stringify({ enrolment_date: "2018-01-15", current_end_date: "2026-01-14", requested_extension_months: 6, justification: "Thesis revision after examiner feedback" }),
  },
  {
    id: "asrb-case-018", caseType: "EXTENSION_CANDIDATURE", status: "DECIDED", urgency: "URGENT_CIRCULATION",
    receiptReference: "ASRB-2026-04-000018", idempotencyKey: "seed-idem-018",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2017-PHD-ME-018", supervisorEmpId: "EMP-121", programmeCode: "PHD-ME",
    casePayload: JSON.stringify({ enrolment_date: "2017-03-01", current_end_date: "2025-09-30", requested_extension_months: 12, justification: "COVID-19 delays and supervisor change" }),
  },
  // COMPREHENSIVE_RESULT cases (2)
  {
    id: "asrb-case-019", caseType: "COMPREHENSIVE_RESULT", status: "RECEIVED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000019", idempotencyKey: "seed-idem-019",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2023-PHD-EE-019", supervisorEmpId: "EMP-122", programmeCode: "PHD-EE",
    casePayload: JSON.stringify({ exam_date: "2026-03-01", result: "PASS", coursework_complete: true, cgpa: 3.7 }),
  },
  {
    id: "asrb-case-020", caseType: "COMPREHENSIVE_RESULT", status: "COMPLIANCE_EVALUATED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000020", idempotencyKey: "seed-idem-020",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2023-PHD-CS-020", supervisorEmpId: "EMP-123", programmeCode: "PHD-CS",
    casePayload: JSON.stringify({ exam_date: "2026-02-15", result: "CONDITIONAL_PASS", coursework_complete: false, cgpa: 3.2 }),
  },
];

async function seedASRBCases() {
  await client.connect();
  console.log("Connected to database for ASRB case seeding");

  // Get feeder client IDs
  const dgscResult = await client.query(`SELECT id FROM "FeederClient" WHERE "feederBodyCode" = 'DGSC'`);
  const fbResult = await client.query(`SELECT id FROM "FeederClient" WHERE "feederBodyCode" = 'FACULTY_BOARD'`);

  if (dgscResult.rows.length === 0 || fbResult.rows.length === 0) {
    console.error("FeederClient records not found. Run migrate-asrb-slice2.mjs first.");
    process.exit(1);
  }

  const dgscId = dgscResult.rows[0].id;
  const fbId = fbResult.rows[0].id;

  let inserted = 0;
  for (const c of cases) {
    const feederClientId = c.feederBodyCode === "DGSC" ? dgscId : fbId;
    try {
      await client.query(
        `INSERT INTO "ASRBCase" (
          "id", "caseType", "status", "urgency", "receiptReference", "idempotencyKey",
          "feederClientId", "feederBodyType", "feederBodyCode",
          "studentRegNo", "supervisorEmpId", "programmeCode", "casePayload",
          "receivedAt", "lastTransitionAt", "createdAt", "updatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now(),now(),now(),now())
        ON CONFLICT ("id") DO NOTHING`,
        [
          c.id, c.caseType, c.status, c.urgency, c.receiptReference, c.idempotencyKey,
          feederClientId, c.feederBodyType, c.feederBodyCode,
          c.studentRegNo, c.supervisorEmpId, c.programmeCode, c.casePayload,
        ]
      );
      inserted++;
    } catch (e) {
      // ON CONFLICT on receiptReference unique constraint
      try {
        await client.query(
          `INSERT INTO "ASRBCase" (
            "id", "caseType", "status", "urgency", "receiptReference", "idempotencyKey",
            "feederClientId", "feederBodyType", "feederBodyCode",
            "studentRegNo", "supervisorEmpId", "programmeCode", "casePayload",
            "receivedAt", "lastTransitionAt", "createdAt", "updatedAt"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now(),now(),now(),now())
          ON CONFLICT ("receiptReference") DO NOTHING`,
          [
            c.id, c.caseType, c.status, c.urgency, c.receiptReference, c.idempotencyKey,
            feederClientId, c.feederBodyType, c.feederBodyCode,
            c.studentRegNo, c.supervisorEmpId, c.programmeCode, c.casePayload,
          ]
        );
      } catch (e2) {
        console.warn(`Skipping case ${c.id}: ${e2.message}`);
      }
    }
  }

  console.log(`Seeded ${inserted} ASRBCase records`);

  // Verify count
  const countResult = await client.query(`SELECT COUNT(*) as total FROM "ASRBCase"`);
  console.log(`Total ASRBCase records in database: ${countResult.rows[0].total}`);

  await client.end();
  console.log("ASRB case seeding complete!");
}

seedASRBCases().catch((e) => {
  console.error("Seeding failed:", e);
  process.exit(1);
});
