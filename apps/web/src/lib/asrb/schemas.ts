import { z } from "zod";
import { CaseType, CaseUrgency } from "@ums/domain";

// Attachment metadata schema
const AttachmentMetadataSchema = z.object({
  filename: z.string().min(1).max(255),
  mime_type: z.string().min(5).max(100),
  size_bytes: z.number().int().positive().max(52428800), // 50MB max
  doc_type: z.string().min(1).max(50),
});

// ==========================================
// Case-Type-Specific Payload Schemas
// Authoritative source: asrb_governance_spec.docx Section 3
// and asrb_slice_02_brief.docx "Case-Type-Specific Payloads"
// ==========================================

/**
 * SYNOPSIS_APPROVAL
 * Spec: thesis_title (string, 10-300 chars), keywords (array of strings, 3-8),
 *       similarity_index (number, 0-100), defence_date_proposed (date, nullable).
 */
export const SynopsisApprovalPayloadSchema = z.object({
  case_type: z.literal(CaseType.SYNOPSIS_APPROVAL),
  thesis_title: z.string().min(10).max(300),
  keywords: z.array(z.string().min(1)).min(3).max(8),
  similarity_index: z.number().min(0).max(100),
  defence_date_proposed: z.string().datetime().nullable(),
});

/**
 * GEC_CONSTITUTION
 * Spec: proposed_members (array of { employee_id, role (INTERNAL | EXTERNAL | CHAIR), institution }),
 *       justification (string, 50-1000 chars).
 */
export const GECConstitutionPayloadSchema = z.object({
  case_type: z.literal(CaseType.GEC_CONSTITUTION),
  proposed_members: z.array(
    z.object({
      employee_id: z.string().min(1),
      role: z.enum(["INTERNAL", "EXTERNAL", "CHAIR"]),
      institution: z.string().min(1),
    })
  ).min(1),
  justification: z.string().min(50).max(1000),
});

/**
 * EXAMINER_APPOINTMENT
 * Spec: proposed_examiners (array, length exactly 3), each with
 *       { category (FOREIGN | NATIONAL), full_name, institution, country, cv_attachment_ref }.
 *       At least 2 FOREIGN required (validated via superRefine).
 */
const ExaminerEntrySchema = z.object({
  category: z.enum(["FOREIGN", "NATIONAL"]),
  full_name: z.string().min(1),
  institution: z.string().min(1),
  country: z.string().min(1),
  cv_attachment_ref: z.string().min(1),
});

const ExaminerAppointmentBaseSchema = z.object({
  case_type: z.literal(CaseType.EXAMINER_APPOINTMENT),
  proposed_examiners: z.array(ExaminerEntrySchema).length(3),
});

export const ExaminerAppointmentPayloadSchema = ExaminerAppointmentBaseSchema
  .superRefine((data, ctx) => {
    const foreignCount = data.proposed_examiners.filter(
      (e) => e.category === "FOREIGN"
    ).length;
    if (foreignCount < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least 2 examiners must have category FOREIGN",
        path: ["proposed_examiners"],
      });
    }
  });

/**
 * RESULT_APPROVAL
 * Spec: examiner_report_refs (array of attachment refs, length exactly 3),
 *       revised_thesis_ref (attachment ref, nullable), viva_report_ref (attachment ref).
 */
export const ResultApprovalPayloadSchema = z.object({
  case_type: z.literal(CaseType.RESULT_APPROVAL),
  examiner_report_refs: z.array(z.string().min(1)).length(3),
  revised_thesis_ref: z.string().min(1).nullable(),
  viva_report_ref: z.string().min(1),
});

/**
 * SUPERVISOR_CHANGE
 * Spec: new_supervisor_ref, reason (string, 20-500 chars),
 *       current_supervisor_noc_ref (attachment ref).
 */
export const SupervisorChangePayloadSchema = z.object({
  case_type: z.literal(CaseType.SUPERVISOR_CHANGE),
  new_supervisor_ref: z.string().min(1),
  reason: z.string().min(20).max(500),
  current_supervisor_noc_ref: z.string().min(1),
});

/**
 * TOPIC_CHANGE
 * Spec: new_title (string), revised_synopsis_ref (attachment ref),
 *       rationale (string, 50-1000 chars).
 */
export const TopicChangePayloadSchema = z.object({
  case_type: z.literal(CaseType.TOPIC_CHANGE),
  new_title: z.string().min(1),
  revised_synopsis_ref: z.string().min(1),
  rationale: z.string().min(50).max(1000),
});

/**
 * EXTENSION_CANDIDATURE
 * Spec: requested_extension_months (integer, 1-24),
 *       justification (string, 50-1000 chars), progress_report_ref (attachment ref).
 */
export const ExtensionCandidaturePayloadSchema = z.object({
  case_type: z.literal(CaseType.EXTENSION_CANDIDATURE),
  requested_extension_months: z.number().int().min(1).max(24),
  justification: z.string().min(50).max(1000),
  progress_report_ref: z.string().min(1),
});

/**
 * LEAVE_ABSENCE
 * Spec: reason_category (MEDICAL | PERSONAL | PROFESSIONAL | OTHER),
 *       duration_months (integer, 1-12), supporting_docs_refs (array of attachment refs).
 */
export const LeaveAbsencePayloadSchema = z.object({
  case_type: z.literal(CaseType.LEAVE_ABSENCE),
  reason_category: z.enum(["MEDICAL", "PERSONAL", "PROFESSIONAL", "OTHER"]),
  duration_months: z.number().int().min(1).max(12),
  supporting_docs_refs: z.array(z.string().min(1)).min(0),
});

/**
 * RESEARCH_PROJECT_APPROVAL
 * Spec: project_title, funding_source, total_budget_pkr,
 *       project_duration_months, pi_ref, proposal_ref (attachment ref).
 */
export const ResearchProjectApprovalPayloadSchema = z.object({
  case_type: z.literal(CaseType.RESEARCH_PROJECT_APPROVAL),
  project_title: z.string().min(1),
  funding_source: z.string().min(1),
  total_budget_pkr: z.number().positive(),
  project_duration_months: z.number().int().positive(),
  pi_ref: z.string().min(1),
  proposal_ref: z.string().min(1),
});

/**
 * COMPREHENSIVE_RESULT
 * Spec: examination_date, panel_members (array of employee_ids),
 *       overall_outcome (PASS | FAIL | RE_EXAMINE), panel_report_ref.
 */
export const ComprehensiveResultPayloadSchema = z.object({
  case_type: z.literal(CaseType.COMPREHENSIVE_RESULT),
  examination_date: z.string().datetime(),
  panel_members: z.array(z.string().min(1)).min(1),
  overall_outcome: z.enum(["PASS", "FAIL", "RE_EXAMINE"]),
  panel_report_ref: z.string().min(1),
});

/**
 * COURSEWORK_WAIVER
 * Spec: waiver_credits (integer), basis (TRANSFER_CREDITS | PRIOR_LEARNING | OTHER),
 *       transcript_ref, equivalence_analysis_ref.
 */
export const CourseworkWaiverPayloadSchema = z.object({
  case_type: z.literal(CaseType.COURSEWORK_WAIVER),
  waiver_credits: z.number().int().positive(),
  basis: z.enum(["TRANSFER_CREDITS", "PRIOR_LEARNING", "OTHER"]),
  transcript_ref: z.string().min(1),
  equivalence_analysis_ref: z.string().min(1),
});

/**
 * OTHER
 * Spec: narrative (string, 100-3000 chars),
 *       supporting_docs_refs (array of attachment refs).
 */
export const OtherPayloadSchema = z.object({
  case_type: z.literal(CaseType.OTHER),
  narrative: z.string().min(100).max(3000),
  supporting_docs_refs: z.array(z.string().min(1)).min(0),
});

// Discriminated union needs base object schemas (not refined).
// ExaminerAppointment uses superRefine, so we use the base schema
// in the union and apply the refinement separately during validation.
export const CasePayloadSchema = z.discriminatedUnion("case_type", [
  SynopsisApprovalPayloadSchema,
  GECConstitutionPayloadSchema,
  ExaminerAppointmentBaseSchema,
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
  urgency: z.nativeEnum(CaseUrgency).default(CaseUrgency.NORMAL),
  student_ref: z.string().min(1).optional(),
  supervisor_ref: z.string().min(1).optional(),
  programme_ref: z.string().min(1).optional(),
  case_payload: CasePayloadSchema,
  attachments: z.array(AttachmentMetadataSchema).default([]),
});

export type CaseIntakeEnvelope = z.infer<typeof CaseIntakeEnvelopeSchema>;
export type CasePayload = z.infer<typeof CasePayloadSchema>;
export type AttachmentMetadata = z.infer<typeof AttachmentMetadataSchema>;
