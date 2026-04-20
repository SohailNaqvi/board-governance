import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 20 deterministic ASRBCase fixtures across 6 case types and varied statuses
// Case payloads aligned to spec (asrb_governance_spec.docx Section 3 / asrb_slice_02_brief.docx)
const cases = [
  // SYNOPSIS_APPROVAL cases (5)
  // Spec: thesis_title, keywords (3-8), similarity_index (0-100), defence_date_proposed (nullable)
  {
    id: "asrb-case-001", caseType: "SYNOPSIS_APPROVAL", status: "RECEIVED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-01-000001", idempotencyKey: "seed-idem-001",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2022-PHD-CS-001", supervisorEmpId: "EMP-101", programmeCode: "PHD-CS",
    casePayload: JSON.stringify({ case_type: "SYNOPSIS_APPROVAL", thesis_title: "Machine Learning for Crop Disease Detection", keywords: ["machine learning", "agriculture", "computer vision"], similarity_index: 12, defence_date_proposed: null }),
  },
  {
    id: "asrb-case-002", caseType: "SYNOPSIS_APPROVAL", status: "COMPLIANCE_EVALUATED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-01-000002", idempotencyKey: "seed-idem-002",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2023-PHD-EE-002", supervisorEmpId: "EMP-102", programmeCode: "PHD-EE",
    casePayload: JSON.stringify({ case_type: "SYNOPSIS_APPROVAL", thesis_title: "5G Antenna Array Optimization for Rural Connectivity", keywords: ["5G", "antenna", "rural", "optimization"], similarity_index: 8, defence_date_proposed: "2026-09-01T00:00:00.000Z" }),
  },
  {
    id: "asrb-case-003", caseType: "SYNOPSIS_APPROVAL", status: "VETTING", urgency: "NORMAL",
    receiptReference: "ASRB-2026-01-000003", idempotencyKey: "seed-idem-003",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2021-PHD-ME-003", supervisorEmpId: "EMP-103", programmeCode: "PHD-ME",
    casePayload: JSON.stringify({ case_type: "SYNOPSIS_APPROVAL", thesis_title: "Thermal Management in Electric Vehicles Using Phase Change Materials", keywords: ["thermal", "EV", "phase change"], similarity_index: 22, defence_date_proposed: null }),
  },
  {
    id: "asrb-case-004", caseType: "SYNOPSIS_APPROVAL", status: "DECIDED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-02-000004", idempotencyKey: "seed-idem-004",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2022-PHD-CH-004", supervisorEmpId: "EMP-104", programmeCode: "PHD-CH",
    casePayload: JSON.stringify({ case_type: "SYNOPSIS_APPROVAL", thesis_title: "Green Synthesis of Nanomaterials for Water Purification", keywords: ["nanomaterials", "green synthesis", "water purification"], similarity_index: 5, defence_date_proposed: null }),
  },
  {
    id: "asrb-case-005", caseType: "SYNOPSIS_APPROVAL", status: "CLOSED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-02-000005", idempotencyKey: "seed-idem-005",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2020-PHD-BIO-005", supervisorEmpId: "EMP-105", programmeCode: "PHD-BIO",
    casePayload: JSON.stringify({ case_type: "SYNOPSIS_APPROVAL", thesis_title: "CRISPR Applications in Wheat Genomics for Drought Resistance", keywords: ["CRISPR", "wheat", "genomics", "drought"], similarity_index: 15, defence_date_proposed: null }),
  },
  // EXAMINER_APPOINTMENT cases (4)
  // Spec: proposed_examiners (array of 3, each: category, full_name, institution, country, cv_attachment_ref)
  {
    id: "asrb-case-006", caseType: "EXAMINER_APPOINTMENT", status: "RECEIVED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-02-000006", idempotencyKey: "seed-idem-006",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2021-PHD-CS-006", supervisorEmpId: "EMP-106", programmeCode: "PHD-CS",
    casePayload: JSON.stringify({ case_type: "EXAMINER_APPOINTMENT", proposed_examiners: [
      { category: "FOREIGN", full_name: "Dr. A", institution: "MIT", country: "USA", cv_attachment_ref: "att-cv-a" },
      { category: "FOREIGN", full_name: "Dr. B", institution: "Oxford", country: "UK", cv_attachment_ref: "att-cv-b" },
      { category: "NATIONAL", full_name: "Dr. C", institution: "LUMS", country: "Pakistan", cv_attachment_ref: "att-cv-c" },
    ] }),
  },
  {
    id: "asrb-case-007", caseType: "EXAMINER_APPOINTMENT", status: "COMPLIANCE_EVALUATED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-02-000007", idempotencyKey: "seed-idem-007",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2022-PHD-EE-007", supervisorEmpId: "EMP-107", programmeCode: "PHD-EE",
    casePayload: JSON.stringify({ case_type: "EXAMINER_APPOINTMENT", proposed_examiners: [
      { category: "FOREIGN", full_name: "Dr. D", institution: "Stanford", country: "USA", cv_attachment_ref: "att-cv-d" },
      { category: "FOREIGN", full_name: "Dr. E", institution: "TU Delft", country: "Netherlands", cv_attachment_ref: "att-cv-e" },
      { category: "NATIONAL", full_name: "Dr. F", institution: "NUST", country: "Pakistan", cv_attachment_ref: "att-cv-f" },
    ] }),
  },
  {
    id: "asrb-case-008", caseType: "EXAMINER_APPOINTMENT", status: "VETTING", urgency: "NORMAL",
    receiptReference: "ASRB-2026-03-000008", idempotencyKey: "seed-idem-008",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2020-PHD-ME-008", supervisorEmpId: "EMP-108", programmeCode: "PHD-ME",
    casePayload: JSON.stringify({ case_type: "EXAMINER_APPOINTMENT", proposed_examiners: [
      { category: "FOREIGN", full_name: "Dr. G", institution: "TU Munich", country: "Germany", cv_attachment_ref: "att-cv-g" },
      { category: "FOREIGN", full_name: "Dr. H", institution: "ETH Zurich", country: "Switzerland", cv_attachment_ref: "att-cv-h" },
      { category: "NATIONAL", full_name: "Dr. I", institution: "UET", country: "Pakistan", cv_attachment_ref: "att-cv-i" },
    ] }),
  },
  {
    id: "asrb-case-009", caseType: "EXAMINER_APPOINTMENT", status: "DECIDED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-03-000009", idempotencyKey: "seed-idem-009",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2021-PHD-CH-009", supervisorEmpId: "EMP-109", programmeCode: "PHD-CH",
    casePayload: JSON.stringify({ case_type: "EXAMINER_APPOINTMENT", proposed_examiners: [
      { category: "FOREIGN", full_name: "Dr. J", institution: "Cambridge", country: "UK", cv_attachment_ref: "att-cv-j" },
      { category: "FOREIGN", full_name: "Dr. K", institution: "NUS", country: "Singapore", cv_attachment_ref: "att-cv-k" },
      { category: "NATIONAL", full_name: "Dr. L", institution: "COMSATS", country: "Pakistan", cv_attachment_ref: "att-cv-l" },
    ] }),
  },
  // SUPERVISOR_CHANGE cases (3)
  // Spec: new_supervisor_ref, reason (20-500 chars), current_supervisor_noc_ref
  {
    id: "asrb-case-010", caseType: "SUPERVISOR_CHANGE", status: "RECEIVED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-03-000010", idempotencyKey: "seed-idem-010",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2022-PHD-CS-010", supervisorEmpId: "EMP-110", programmeCode: "PHD-CS",
    casePayload: JSON.stringify({ case_type: "SUPERVISOR_CHANGE", new_supervisor_ref: "EMP-111", reason: "Supervisor on sabbatical leave and unable to continue mentoring", current_supervisor_noc_ref: "att-noc-010" }),
  },
  {
    id: "asrb-case-011", caseType: "SUPERVISOR_CHANGE", status: "COMPLIANCE_EVALUATED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-03-000011", idempotencyKey: "seed-idem-011",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2023-PHD-EE-011", supervisorEmpId: "EMP-112", programmeCode: "PHD-EE",
    casePayload: JSON.stringify({ case_type: "SUPERVISOR_CHANGE", new_supervisor_ref: "EMP-113", reason: "Research area mismatch identified after initial assignment phase", current_supervisor_noc_ref: "att-noc-011" }),
  },
  {
    id: "asrb-case-012", caseType: "SUPERVISOR_CHANGE", status: "DECIDED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000012", idempotencyKey: "seed-idem-012",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2021-PHD-ME-012", supervisorEmpId: "EMP-114", programmeCode: "PHD-ME",
    casePayload: JSON.stringify({ case_type: "SUPERVISOR_CHANGE", new_supervisor_ref: "EMP-115", reason: "Co-supervisor promoted to principal supervisor role after retirement", current_supervisor_noc_ref: "att-noc-012" }),
  },
  // RESULT_APPROVAL cases (3)
  // Spec: examiner_report_refs (array of 3), revised_thesis_ref (nullable), viva_report_ref
  {
    id: "asrb-case-013", caseType: "RESULT_APPROVAL", status: "RECEIVED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000013", idempotencyKey: "seed-idem-013",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2019-PHD-CS-013", supervisorEmpId: "EMP-116", programmeCode: "PHD-CS",
    casePayload: JSON.stringify({ case_type: "RESULT_APPROVAL", examiner_report_refs: ["att-er-013a", "att-er-013b", "att-er-013c"], revised_thesis_ref: null, viva_report_ref: "att-viva-013" }),
  },
  {
    id: "asrb-case-014", caseType: "RESULT_APPROVAL", status: "VETTING", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000014", idempotencyKey: "seed-idem-014",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2020-PHD-EE-014", supervisorEmpId: "EMP-117", programmeCode: "PHD-EE",
    casePayload: JSON.stringify({ case_type: "RESULT_APPROVAL", examiner_report_refs: ["att-er-014a", "att-er-014b", "att-er-014c"], revised_thesis_ref: "att-revised-014", viva_report_ref: "att-viva-014" }),
  },
  {
    id: "asrb-case-015", caseType: "RESULT_APPROVAL", status: "CLOSED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000015", idempotencyKey: "seed-idem-015",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2018-PHD-CH-015", supervisorEmpId: "EMP-118", programmeCode: "PHD-CH",
    casePayload: JSON.stringify({ case_type: "RESULT_APPROVAL", examiner_report_refs: ["att-er-015a", "att-er-015b", "att-er-015c"], revised_thesis_ref: null, viva_report_ref: "att-viva-015" }),
  },
  // EXTENSION_CANDIDATURE cases (3)
  // Spec: requested_extension_months (1-24), justification (50-1000 chars), progress_report_ref
  {
    id: "asrb-case-016", caseType: "EXTENSION_CANDIDATURE", status: "RECEIVED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000016", idempotencyKey: "seed-idem-016",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2019-PHD-BIO-016", supervisorEmpId: "EMP-119", programmeCode: "PHD-BIO",
    casePayload: JSON.stringify({ case_type: "EXTENSION_CANDIDATURE", requested_extension_months: 12, justification: "Lab equipment delays due to import restrictions that affected experimental schedule significantly", progress_report_ref: "att-progress-016" }),
  },
  {
    id: "asrb-case-017", caseType: "EXTENSION_CANDIDATURE", status: "COMPLIANCE_EVALUATED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000017", idempotencyKey: "seed-idem-017",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2018-PHD-CS-017", supervisorEmpId: "EMP-120", programmeCode: "PHD-CS",
    casePayload: JSON.stringify({ case_type: "EXTENSION_CANDIDATURE", requested_extension_months: 6, justification: "Thesis revision required after examiner feedback on methodology chapter and data analysis sections", progress_report_ref: "att-progress-017" }),
  },
  {
    id: "asrb-case-018", caseType: "EXTENSION_CANDIDATURE", status: "DECIDED", urgency: "URGENT_CIRCULATION",
    receiptReference: "ASRB-2026-04-000018", idempotencyKey: "seed-idem-018",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2017-PHD-ME-018", supervisorEmpId: "EMP-121", programmeCode: "PHD-ME",
    casePayload: JSON.stringify({ case_type: "EXTENSION_CANDIDATURE", requested_extension_months: 12, justification: "COVID-19 delays compounded by supervisor change in the third year of the candidature period", progress_report_ref: "att-progress-018" }),
  },
  // COMPREHENSIVE_RESULT cases (2)
  // Spec: examination_date, panel_members (array of employee_ids), overall_outcome (PASS|FAIL|RE_EXAMINE), panel_report_ref
  {
    id: "asrb-case-019", caseType: "COMPREHENSIVE_RESULT", status: "RECEIVED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000019", idempotencyKey: "seed-idem-019",
    feederBodyCode: "DGSC", feederBodyType: "DGSC",
    studentRegNo: "2023-PHD-EE-019", supervisorEmpId: "EMP-122", programmeCode: "PHD-EE",
    casePayload: JSON.stringify({ case_type: "COMPREHENSIVE_RESULT", examination_date: "2026-03-01T10:00:00.000Z", panel_members: ["EMP-122", "EMP-130", "EMP-131"], overall_outcome: "PASS", panel_report_ref: "att-panel-019" }),
  },
  {
    id: "asrb-case-020", caseType: "COMPREHENSIVE_RESULT", status: "COMPLIANCE_EVALUATED", urgency: "NORMAL",
    receiptReference: "ASRB-2026-04-000020", idempotencyKey: "seed-idem-020",
    feederBodyCode: "FACULTY_BOARD", feederBodyType: "FACULTY_BOARD",
    studentRegNo: "2023-PHD-CS-020", supervisorEmpId: "EMP-123", programmeCode: "PHD-CS",
    casePayload: JSON.stringify({ case_type: "COMPREHENSIVE_RESULT", examination_date: "2026-02-15T10:00:00.000Z", panel_members: ["EMP-123", "EMP-132", "EMP-133"], overall_outcome: "RE_EXAMINE", panel_report_ref: "att-panel-020" }),
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
