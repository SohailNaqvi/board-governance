import { describe, it, expect } from "vitest";
import {
  SynopsisApprovalPayloadSchema,
  GECConstitutionPayloadSchema,
  ExaminerAppointmentPayloadSchema,
  ResultApprovalPayloadSchema,
  SupervisorChangePayloadSchema,
  TopicChangePayloadSchema,
  ExtensionCandidaturePayloadSchema,
  LeaveAbsencePayloadSchema,
  ResearchProjectApprovalPayloadSchema,
  ComprehensiveResultPayloadSchema,
  CourseworkWaiverPayloadSchema,
  OtherPayloadSchema,
} from "../../apps/web/src/lib/asrb/schemas";
import { CaseType } from "@ums/domain";

// ==========================================
// Helper to generate a filler string of given length
// ==========================================
function filler(len: number): string {
  return "x".repeat(len);
}

// ==========================================
// SYNOPSIS_APPROVAL
// ==========================================
describe("SynopsisApprovalPayloadSchema", () => {
  const valid = {
    case_type: CaseType.SYNOPSIS_APPROVAL,
    thesis_title: "Machine Learning for Crop Disease Detection",
    keywords: ["machine learning", "agriculture", "computer vision"],
    similarity_index: 12,
    defence_date_proposed: null,
  };

  it("accepts a spec-compliant payload", () => {
    const result = SynopsisApprovalPayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts defence_date_proposed as ISO datetime", () => {
    const result = SynopsisApprovalPayloadSchema.safeParse({
      ...valid,
      defence_date_proposed: "2026-09-15T10:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects old field name synopsis_title", () => {
    const bad = { case_type: CaseType.SYNOPSIS_APPROVAL, synopsis_title: "Title", keywords: ["a", "b", "c"], similarity_index: 5, defence_date_proposed: null };
    const result = SynopsisApprovalPayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects similarity_index > 100", () => {
    const result = SynopsisApprovalPayloadSchema.safeParse({ ...valid, similarity_index: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects fewer than 3 keywords", () => {
    const result = SynopsisApprovalPayloadSchema.safeParse({ ...valid, keywords: ["a", "b"] });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// GEC_CONSTITUTION
// ==========================================
describe("GECConstitutionPayloadSchema", () => {
  const valid = {
    case_type: CaseType.GEC_CONSTITUTION,
    proposed_members: [
      { employee_id: "EMP-001", role: "CHAIR", institution: "MUST" },
      { employee_id: "EMP-002", role: "INTERNAL", institution: "MUST" },
      { employee_id: "EMP-003", role: "EXTERNAL", institution: "QAU" },
    ],
    justification: filler(60),
  };

  it("accepts a spec-compliant payload", () => {
    const result = GECConstitutionPayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects old field name committee_name", () => {
    const bad = { case_type: CaseType.GEC_CONSTITUTION, committee_name: "GEC", members: [], dept_code: "CS" };
    const result = GECConstitutionPayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects justification shorter than 50 chars", () => {
    const result = GECConstitutionPayloadSchema.safeParse({ ...valid, justification: "too short" });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// EXAMINER_APPOINTMENT
// ==========================================
describe("ExaminerAppointmentPayloadSchema", () => {
  const validExaminer = (category: "FOREIGN" | "NATIONAL", name: string) => ({
    category,
    full_name: name,
    institution: "University X",
    country: "UK",
    cv_attachment_ref: `att-${name}`,
  });

  const valid = {
    case_type: CaseType.EXAMINER_APPOINTMENT,
    proposed_examiners: [
      validExaminer("FOREIGN", "Dr. A"),
      validExaminer("FOREIGN", "Dr. B"),
      validExaminer("NATIONAL", "Dr. C"),
    ],
  };

  it("accepts a spec-compliant payload with 2 FOREIGN + 1 NATIONAL", () => {
    const result = ExaminerAppointmentPayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts 3 FOREIGN examiners", () => {
    const result = ExaminerAppointmentPayloadSchema.safeParse({
      ...valid,
      proposed_examiners: [
        validExaminer("FOREIGN", "A"),
        validExaminer("FOREIGN", "B"),
        validExaminer("FOREIGN", "C"),
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects fewer than 2 FOREIGN examiners", () => {
    const result = ExaminerAppointmentPayloadSchema.safeParse({
      ...valid,
      proposed_examiners: [
        validExaminer("FOREIGN", "A"),
        validExaminer("NATIONAL", "B"),
        validExaminer("NATIONAL", "C"),
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects array with length != 3", () => {
    const result = ExaminerAppointmentPayloadSchema.safeParse({
      ...valid,
      proposed_examiners: [validExaminer("FOREIGN", "A"), validExaminer("FOREIGN", "B")],
    });
    expect(result.success).toBe(false);
  });

  it("rejects old field name examiner_emp_id", () => {
    const bad = {
      case_type: CaseType.EXAMINER_APPOINTMENT,
      examiner_emp_id: "EMP-1",
      examiner_name: "Dr.",
      examiner_affiliation: "X",
      role: "EXTERNAL",
    };
    const result = ExaminerAppointmentPayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

// ==========================================
// RESULT_APPROVAL
// ==========================================
describe("ResultApprovalPayloadSchema", () => {
  const valid = {
    case_type: CaseType.RESULT_APPROVAL,
    examiner_report_refs: ["att-r1", "att-r2", "att-r3"],
    revised_thesis_ref: null,
    viva_report_ref: "att-viva",
  };

  it("accepts a spec-compliant payload", () => {
    const result = ResultApprovalPayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects old field name marks_obtained", () => {
    const bad = { case_type: CaseType.RESULT_APPROVAL, marks_obtained: 85, grade: "A", result_status: "PASS" };
    const result = ResultApprovalPayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects examiner_report_refs with length != 3", () => {
    const result = ResultApprovalPayloadSchema.safeParse({
      ...valid,
      examiner_report_refs: ["a", "b"],
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// SUPERVISOR_CHANGE
// ==========================================
describe("SupervisorChangePayloadSchema", () => {
  const valid = {
    case_type: CaseType.SUPERVISOR_CHANGE,
    new_supervisor_ref: "EMP-201",
    reason: "Supervisor on sabbatical leave, unable to continue supervision",
    current_supervisor_noc_ref: "att-noc-001",
  };

  it("accepts a spec-compliant payload", () => {
    const result = SupervisorChangePayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects old field names current_supervisor_emp_id and new_supervisor_emp_id", () => {
    const bad = {
      case_type: CaseType.SUPERVISOR_CHANGE,
      current_supervisor_emp_id: "EMP-1",
      new_supervisor_emp_id: "EMP-2",
      reason: "Reason text that is 20+ chars long",
    };
    const result = SupervisorChangePayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

// ==========================================
// TOPIC_CHANGE
// ==========================================
describe("TopicChangePayloadSchema", () => {
  const valid = {
    case_type: CaseType.TOPIC_CHANGE,
    new_title: "Revised: Advanced Machine Learning for Climate Modeling",
    revised_synopsis_ref: "att-synopsis-revised",
    rationale: filler(60),
  };

  it("accepts a spec-compliant payload", () => {
    const result = TopicChangePayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects old field names current_topic and proposed_topic", () => {
    const bad = {
      case_type: CaseType.TOPIC_CHANGE,
      current_topic: "Old",
      proposed_topic: "New",
      justification: filler(60),
    };
    const result = TopicChangePayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

// ==========================================
// EXTENSION_CANDIDATURE
// ==========================================
describe("ExtensionCandidaturePayloadSchema", () => {
  const valid = {
    case_type: CaseType.EXTENSION_CANDIDATURE,
    requested_extension_months: 12,
    justification: filler(60),
    progress_report_ref: "att-progress-001",
  };

  it("accepts a spec-compliant payload", () => {
    const result = ExtensionCandidaturePayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects old field name current_deadline", () => {
    const bad = {
      case_type: CaseType.EXTENSION_CANDIDATURE,
      current_deadline: "2026-01-01T00:00:00Z",
      requested_extension_months: 6,
      reason: filler(60),
    };
    const result = ExtensionCandidaturePayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects requested_extension_months > 24", () => {
    const result = ExtensionCandidaturePayloadSchema.safeParse({
      ...valid,
      requested_extension_months: 25,
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// LEAVE_ABSENCE
// ==========================================
describe("LeaveAbsencePayloadSchema", () => {
  const valid = {
    case_type: CaseType.LEAVE_ABSENCE,
    reason_category: "MEDICAL",
    duration_months: 3,
    supporting_docs_refs: ["att-med-cert"],
  };

  it("accepts a spec-compliant payload", () => {
    const result = LeaveAbsencePayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects old field name leave_type", () => {
    const bad = {
      case_type: CaseType.LEAVE_ABSENCE,
      leave_type: "MEDICAL",
      leave_start_date: "2026-01-01T00:00:00Z",
      leave_end_date: "2026-04-01T00:00:00Z",
      reason: "Medical treatment",
    };
    const result = LeaveAbsencePayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects duration_months > 12", () => {
    const result = LeaveAbsencePayloadSchema.safeParse({ ...valid, duration_months: 13 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid reason_category", () => {
    const result = LeaveAbsencePayloadSchema.safeParse({ ...valid, reason_category: "EMERGENCY" });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// RESEARCH_PROJECT_APPROVAL
// ==========================================
describe("ResearchProjectApprovalPayloadSchema", () => {
  const valid = {
    case_type: CaseType.RESEARCH_PROJECT_APPROVAL,
    project_title: "NRPU Grant: AI for Healthcare",
    funding_source: "HEC NRPU",
    total_budget_pkr: 5000000,
    project_duration_months: 36,
    pi_ref: "EMP-301",
    proposal_ref: "att-proposal-001",
  };

  it("accepts a spec-compliant payload", () => {
    const result = ResearchProjectApprovalPayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects old field names project_description and research_area", () => {
    const bad = {
      case_type: CaseType.RESEARCH_PROJECT_APPROVAL,
      project_title: "Title",
      project_description: filler(120),
      research_area: "AI",
      expected_duration_months: 12,
    };
    const result = ResearchProjectApprovalPayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

// ==========================================
// COMPREHENSIVE_RESULT
// ==========================================
describe("ComprehensiveResultPayloadSchema", () => {
  const valid = {
    case_type: CaseType.COMPREHENSIVE_RESULT,
    examination_date: "2026-03-01T10:00:00.000Z",
    panel_members: ["EMP-401", "EMP-402", "EMP-403"],
    overall_outcome: "PASS",
    panel_report_ref: "att-panel-report-001",
  };

  it("accepts a spec-compliant payload", () => {
    const result = ComprehensiveResultPayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects old field name performance_level", () => {
    const bad = {
      case_type: CaseType.COMPREHENSIVE_RESULT,
      exam_date: "2026-03-01T00:00:00Z",
      performance_level: "EXCELLENT",
      viva_marks: 85,
    };
    const result = ComprehensiveResultPayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects invalid overall_outcome value", () => {
    const result = ComprehensiveResultPayloadSchema.safeParse({
      ...valid,
      overall_outcome: "EXCELLENT",
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// COURSEWORK_WAIVER
// ==========================================
describe("CourseworkWaiverPayloadSchema", () => {
  const valid = {
    case_type: CaseType.COURSEWORK_WAIVER,
    waiver_credits: 9,
    basis: "TRANSFER_CREDITS",
    transcript_ref: "att-transcript-001",
    equivalence_analysis_ref: "att-equiv-001",
  };

  it("accepts a spec-compliant payload", () => {
    const result = CourseworkWaiverPayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects old field names course_code and reason_for_waiver", () => {
    const bad = {
      case_type: CaseType.COURSEWORK_WAIVER,
      course_code: "CS101",
      course_name: "Intro CS",
      reason_for_waiver: "Transfer from another university with 20+ chars",
    };
    const result = CourseworkWaiverPayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects invalid basis value", () => {
    const result = CourseworkWaiverPayloadSchema.safeParse({
      ...valid,
      basis: "EQUIVALENCE",
    });
    expect(result.success).toBe(false);
  });
});

// ==========================================
// OTHER
// ==========================================
describe("OtherPayloadSchema", () => {
  const valid = {
    case_type: CaseType.OTHER,
    narrative: filler(150),
    supporting_docs_refs: ["att-doc-001"],
  };

  it("accepts a spec-compliant payload", () => {
    const result = OtherPayloadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects old field name description", () => {
    const bad = {
      case_type: CaseType.OTHER,
      description: filler(100),
    };
    const result = OtherPayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects narrative shorter than 100 chars", () => {
    const result = OtherPayloadSchema.safeParse({ ...valid, narrative: "too short" });
    expect(result.success).toBe(false);
  });
});
