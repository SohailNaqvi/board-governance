import { z } from "zod";
import { CaseType, CaseUrgency } from "@board-governance/domain/enums";

// Attachment metadata schema
const AttachmentMetadataSchema = z.object({
  filename: z.string().min(1).max(255),
  mime_type: z.string().min(5).max(100),
  size_bytes: z.number().int().positive().max(52428800), // 50MB max
  doc_type: z.string().min(1).max(50),
});

// Discriminated union for case payload types

const SynopsisApprovalPayloadSchema = z.object({
  case_type: z.literal(CaseType.SYNOPSIS_APPROVAL),
  student_reg_no: z.string().min(1),
  supervisor_emp_id: z.string().min(1),
  programme_code: z.string().min(1),
  synopsis_title: z.string().min(1).max(500),
  synopsis_abstract: z.string().min(50).max(2000),
  dept_code: z.string().min(1),
});

const GECConstitutionPayloadSchema = z.object({
  case_type: z.literal(CaseType.GEC_CONSTITUTION),
  committee_name: z.string().min(1),
  members: z.array(
    z.object({
      emp_id: z.string().min(1),
      name: z.string().min(1),
      role: z.string().min(1),
    })
  ),
  dept_code: z.string().min(1),
});

const ExaminerAppointmentPayloadSchema = z.object({
  case_type: z.literal(CaseType.EXAMINER_APPOINTMENT),
  student_reg_no: z.string().min(1),
  programme_code: z.string().min(1),
  examiner_emp_id: z.string().min(1),
  examiner_name: z.string().min(1),
  examiner_affiliation: z.string().min(1),
  role: z.enum(["INTERNAL", "EXTERNAL"]),
});

const ResultApprovalPayloadSchema = z.object({
  case_type: z.literal(CaseType.RESULT_APPROVAL),
  student_reg_no: z.string().min(1),
  programme_code: z.string().min(1),
  marks_obtained: z.number().min(0).max(100).optional(),
  grade: z.string().min(1).max(2),
  result_status: z.enum(["PASS", "FAIL", "INCOMPLETE"]),
});

const SupervisorChangePayloadSchema = z.object({
  case_type: z.literal(CaseType.SUPERVISOR_CHANGE),
  student_reg_no: z.string().min(1),
  programme_code: z.string().min(1),
  current_supervisor_emp_id: z.string().min(1),
  new_supervisor_emp_id: z.string().min(1),
  reason: z.string().min(10).max(500),
});

const TopicChangePayloadSchema = z.object({
  case_type: z.literal(CaseType.TOPIC_CHANGE),
  student_reg_no: z.string().min(1),
  programme_code: z.string().min(1),
  current_topic: z.string().min(1).max(500),
  proposed_topic: z.string().min(1).max(500),
  justification: z.string().min(50).max(2000),
});

const ExtensionCandidaturePayloadSchema = z.object({
  case_type: z.literal(CaseType.EXTENSION_CANDIDATURE),
  student_reg_no: z.string().min(1),
  programme_code: z.string().min(1),
  current_deadline: z.string().datetime(),
  requested_extension_months: z.number().int().positive().max(24),
  reason: z.string().min(50).max(2000),
});

const LeaveAbsencePayloadSchema = z.object({
  case_type: z.literal(CaseType.LEAVE_ABSENCE),
  student_reg_no: z.string().min(1),
  programme_code: z.string().min(1),
  leave_start_date: z.string().datetime(),
  leave_end_date: z.string().datetime(),
  leave_type: z.enum(["MEDICAL", "PERSONAL", "EMERGENCY", "ACADEMIC"]),
  reason: z.string().min(20).max(500),
});

const ResearchProjectApprovalPayloadSchema = z.object({
  case_type: z.literal(CaseType.RESEARCH_PROJECT_APPROVAL),
  student_reg_no: z.string().min(1),
  programme_code: z.string().min(1),
  project_title: z.string().min(1).max(500),
  project_description: z.string().min(100).max(2000),
  research_area: z.string().min(1).max(100),
  expected_duration_months: z.number().int().positive(),
});

const ComprehensiveResultPayloadSchema = z.object({
  case_type: z.literal(CaseType.COMPREHENSIVE_RESULT),
  student_reg_no: z.string().min(1),
  programme_code: z.string().min(1),
  exam_date: z.string().datetime(),
  performance_level: z.enum(["EXCELLENT", "GOOD", "SATISFACTORY", "NEEDS_IMPROVEMENT"]),
  viva_marks: z.number().min(0).max(100).optional(),
});

const CourseworkWaiverPayloadSchema = z.object({
  case_type: z.literal(CaseType.COURSEWORK_WAIVER),
  student_reg_no: z.string().min(1),
  programme_code: z.string().min(1),
  course_code: z.string().min(1),
  course_name: z.string().min(1),
  reason_for_waiver: z.string().min(20).max(500),
  alternative_assessment: z.string().min(1).max(200).optional(),
});

const OtherPayloadSchema = z.object({
  case_type: z.literal(CaseType.OTHER),
  description: z.string().min(50).max(2000),
  student_reg_no: z.string().min(1).optional(),
  programme_code: z.string().min(1).optional(),
  custom_data: z.record(z.any()).optional(),
});

const CasePayloadSchema = z.discriminatedUnion("case_type", [
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
]);

// Main intake envelope schema
export const CaseIntakeEnvelopeSchema = z.object({
  idempotency_key: z.string().min(1).max(255),
  feeder_body_ref: z.string().min(1).max(50),
  feeder_resolution_ref: z
    .object({
      body_code: z.string().min(1).max(50),
      resolution_number: z.number().int().positive(),
      resolution_date: z.string().datetime().optional(),
    })
    .optional(),
  case_type: z.nativeEnum(CaseType),
  urgency: z.nativeEnum(CaseUrgency).default("NORMAL"),
  student_ref: z.string().min(1).optional(),
  supervisor_ref: z.string().min(1).optional(),
  programme_ref: z.string().min(1).optional(),
  case_payload: CasePayloadSchema,
  attachments: z.array(AttachmentMetadataSchema).default([]),
});

export type CaseIntakeEnvelope = z.infer<typeof CaseIntakeEnvelopeSchema>;
export type CasePayload = z.infer<typeof CasePayloadSchema>;
export type AttachmentMetadata = z.infer<typeof AttachmentMetadataSchema>;
