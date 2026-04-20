-- CreateEnum
CREATE TYPE "AgendaItemStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VETTED', 'APPROVED_FOR_AGENDA', 'CIRCULATED', 'DECIDED', 'CLOSED', 'RETURNED', 'DEFERRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "WorkingPaperStatus" AS ENUM ('INSTANTIATED', 'IN_AUTHORING', 'IN_REVIEW', 'FINALIZED', 'CIRCULATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActionTakenEntryStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('AUTHORIZED_PROPOSER', 'FEEDER_BODY_SECRETARY', 'REGISTRAR', 'TREASURER_LEGAL', 'VICE_CHANCELLOR', 'SYNDICATE_MEMBER', 'SYSTEM_ADMINISTRATOR', 'ASRB_CHAIR', 'ASRB_SECRETARY', 'ASRB_INTERNAL_MEMBER', 'ASRB_EXTERNAL_MEMBER', 'ASRB_COMPLIANCE_OFFICER', 'ASRB_VETTING_OFFICER', 'ASRB_NOTIFICATION_RECIPIENT');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'CALL_ISSUED', 'SUBMISSIONS_OPEN', 'SUBMISSIONS_CLOSED', 'AGENDA_APPROVED', 'PAPERS_CIRCULATED', 'IN_SESSION', 'CONCLUDED', 'MINUTES_DRAFTED', 'MINUTES_CONFIRMED');

-- CreateEnum
CREATE TYPE "APCEEventStatus" AS ENUM ('PENDING', 'TRIGGERED', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ASRBCaseStatus" AS ENUM ('RECEIVED', 'COMPLIANCE_EVALUATED', 'VETTING', 'READY_FOR_AGENDA', 'ON_AGENDA', 'DECIDED', 'CLOSED', 'RETURNED', 'HELD', 'WITHDRAWN', 'URGENT_CIRCULATION', 'DEFERRED');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('SYNOPSIS_APPROVAL', 'GEC_CONSTITUTION', 'EXAMINER_APPOINTMENT', 'RESULT_APPROVAL', 'SUPERVISOR_CHANGE', 'TOPIC_CHANGE', 'EXTENSION_CANDIDATURE', 'LEAVE_ABSENCE', 'RESEARCH_PROJECT_APPROVAL', 'COMPREHENSIVE_RESULT', 'COURSEWORK_WAIVER', 'OTHER');

-- CreateEnum
CREATE TYPE "CaseUrgency" AS ENUM ('NORMAL', 'URGENT_CIRCULATION');

-- CreateEnum
CREATE TYPE "FeederBodyType" AS ENUM ('DGSC', 'FACULTY_BOARD');

-- CreateEnum
CREATE TYPE "ASRBMeetingStatus" AS ENUM ('SCHEDULED', 'IN_SESSION', 'CONCLUDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ASRBMemberRoleType" AS ENUM ('CHAIR', 'INTERNAL', 'EXTERNAL', 'SECRETARY');

-- CreateEnum
CREATE TYPE "ComplianceEvaluationStatus" AS ENUM ('IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "RuleSource" AS ENUM ('HEC', 'UNIVERSITY', 'FACULTY', 'PROGRAMME');

-- CreateEnum
CREATE TYPE "RuleSeverity" AS ENUM ('BLOCKING', 'WARNING', 'INFORMATIONAL');

-- CreateEnum
CREATE TYPE "RuleOutcome" AS ENUM ('PASS', 'FAIL', 'WARN', 'NOT_APPLICABLE', 'ERROR');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'NEEDS_REVIEW', 'NON_COMPLIANT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingCalendar" (
    "id" TEXT NOT NULL,
    "meetingNumber" INTEGER NOT NULL,
    "title" TEXT,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "meetingLocation" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'DRAFT',
    "onlineMeetingLink" TEXT,
    "quorum" TEXT,
    "callNoticeAt" TIMESTAMP(3),
    "cutoffAt" TIMESTAMP(3),
    "vcApprovalDueAt" TIMESTAMP(3),
    "circulationAt" TIMESTAMP(3),
    "queryCloseAt" TIMESTAMP(3),
    "concludedAt" TIMESTAMP(3),
    "minutesDraftDueAt" TIMESTAMP(3),
    "minutesConfirmAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APCEEvent" (
    "id" TEXT NOT NULL,
    "meetingCalendarId" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "triggeredAt" TIMESTAMP(3),
    "status" "APCEEventStatus" NOT NULL DEFAULT 'PENDING',
    "offsetDays" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "APCEEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "recipientRole" "UserRole" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "apceEventId" TEXT,
    "meetingCalendarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaItem" (
    "id" TEXT NOT NULL,
    "meetingCalendarId" TEXT NOT NULL,
    "itemNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AgendaItemStatus" NOT NULL DEFAULT 'DRAFT',
    "proposedBy" TEXT NOT NULL,
    "submittedDate" TIMESTAMP(3),
    "vetted" BOOLEAN NOT NULL DEFAULT false,
    "vettedDate" TIMESTAMP(3),
    "vetterNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingPaper" (
    "id" TEXT NOT NULL,
    "meetingCalendarId" TEXT NOT NULL,
    "agendaItemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" "WorkingPaperStatus" NOT NULL DEFAULT 'INSTANTIATED',
    "authoredBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkingPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annexure" (
    "id" TEXT NOT NULL,
    "agendaItemId" TEXT NOT NULL,
    "workingPaperId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Annexure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeederBodyResolution" (
    "id" TEXT NOT NULL,
    "meetingCalendarId" TEXT NOT NULL,
    "agendaItemId" TEXT NOT NULL,
    "bodyCode" TEXT NOT NULL,
    "resolutionNumber" INTEGER NOT NULL,
    "resolutionText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeederBodyResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyndicateMember" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memberNumber" TEXT NOT NULL,
    "department" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyndicateMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadReceipt" (
    "id" TEXT NOT NULL,
    "workingPaperId" TEXT NOT NULL,
    "syndicateMemberId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberQuery" (
    "id" TEXT NOT NULL,
    "syndicateMemberId" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "queryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseText" TEXT,
    "responseDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "meetingCalendarId" TEXT NOT NULL,
    "agendaItemId" TEXT NOT NULL,
    "decisionText" TEXT NOT NULL,
    "decisionDate" TIMESTAMP(3) NOT NULL,
    "decidedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionTakenEntry" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ActionTakenEntryStatus" NOT NULL DEFAULT 'OPEN',
    "completedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionTakenEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationForAction" (
    "id" TEXT NOT NULL,
    "actionTakenEntryId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "notificationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationForAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ASRBCase" (
    "id" TEXT NOT NULL,
    "caseType" "CaseType" NOT NULL,
    "status" "ASRBCaseStatus" NOT NULL DEFAULT 'RECEIVED',
    "urgency" "CaseUrgency" NOT NULL DEFAULT 'NORMAL',
    "receiptReference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "feederClientId" TEXT NOT NULL,
    "feederBodyType" "FeederBodyType" NOT NULL,
    "feederBodyCode" TEXT NOT NULL,
    "feederResolutionBody" TEXT,
    "feederResolutionNum" TEXT,
    "feederResolutionDate" TIMESTAMP(3),
    "studentRegNo" TEXT,
    "supervisorEmpId" TEXT,
    "programmeCode" TEXT,
    "casePayload" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTransitionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ASRBCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAttachment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "docType" TEXT NOT NULL,
    "storageRef" TEXT,
    "uploadToken" TEXT,
    "uploadExpiry" TIMESTAMP(3),
    "uploaded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAuditEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "details" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeederClient" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "feederBodyType" "FeederBodyType" NOT NULL,
    "feederBodyCode" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "permittedCaseTypes" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitOverride" INTEGER,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeederClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRule" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "source" "RuleSource" NOT NULL,
    "sourceReference" TEXT,
    "appliesToCaseTypes" TEXT NOT NULL,
    "appliesToProgrammeTypes" TEXT,
    "severity" "RuleSeverity" NOT NULL,
    "evaluation" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "lastEditedBy" TEXT,
    "lastEditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceEvaluation" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" "ComplianceStatus" NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rulesVersionSet" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleEvaluation" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleVersion" INTEGER NOT NULL,
    "complianceRuleId" TEXT,
    "outcome" "RuleOutcome" NOT NULL,
    "evidence" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ASRBMeeting" (
    "id" TEXT NOT NULL,
    "meetingNumber" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "ASRBMeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "cycleCode" TEXT,
    "concludedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ASRBMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ASRBMember" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "roleType" "ASRBMemberRoleType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ASRBMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingCalendar_meetingNumber_key" ON "MeetingCalendar"("meetingNumber");

-- CreateIndex
CREATE INDEX "MeetingCalendar_status_idx" ON "MeetingCalendar"("status");

-- CreateIndex
CREATE INDEX "MeetingCalendar_meetingDate_idx" ON "MeetingCalendar"("meetingDate");

-- CreateIndex
CREATE INDEX "APCEEvent_meetingCalendarId_idx" ON "APCEEvent"("meetingCalendarId");

-- CreateIndex
CREATE INDEX "APCEEvent_eventCode_idx" ON "APCEEvent"("eventCode");

-- CreateIndex
CREATE INDEX "APCEEvent_status_idx" ON "APCEEvent"("status");

-- CreateIndex
CREATE INDEX "APCEEvent_scheduledAt_idx" ON "APCEEvent"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "APCEEvent_meetingCalendarId_eventCode_key" ON "APCEEvent"("meetingCalendarId", "eventCode");

-- CreateIndex
CREATE INDEX "InAppNotification_recipientRole_idx" ON "InAppNotification"("recipientRole");

-- CreateIndex
CREATE INDEX "InAppNotification_read_idx" ON "InAppNotification"("read");

-- CreateIndex
CREATE INDEX "InAppNotification_createdAt_idx" ON "InAppNotification"("createdAt");

-- CreateIndex
CREATE INDEX "InAppNotification_apceEventId_idx" ON "InAppNotification"("apceEventId");

-- CreateIndex
CREATE INDEX "AgendaItem_meetingCalendarId_idx" ON "AgendaItem"("meetingCalendarId");

-- CreateIndex
CREATE INDEX "AgendaItem_status_idx" ON "AgendaItem"("status");

-- CreateIndex
CREATE INDEX "AgendaItem_proposedBy_idx" ON "AgendaItem"("proposedBy");

-- CreateIndex
CREATE UNIQUE INDEX "AgendaItem_meetingCalendarId_itemNumber_key" ON "AgendaItem"("meetingCalendarId", "itemNumber");

-- CreateIndex
CREATE INDEX "WorkingPaper_meetingCalendarId_idx" ON "WorkingPaper"("meetingCalendarId");

-- CreateIndex
CREATE INDEX "WorkingPaper_agendaItemId_idx" ON "WorkingPaper"("agendaItemId");

-- CreateIndex
CREATE INDEX "WorkingPaper_status_idx" ON "WorkingPaper"("status");

-- CreateIndex
CREATE INDEX "WorkingPaper_authoredBy_idx" ON "WorkingPaper"("authoredBy");

-- CreateIndex
CREATE INDEX "Annexure_agendaItemId_idx" ON "Annexure"("agendaItemId");

-- CreateIndex
CREATE INDEX "Annexure_workingPaperId_idx" ON "Annexure"("workingPaperId");

-- CreateIndex
CREATE INDEX "FeederBodyResolution_meetingCalendarId_idx" ON "FeederBodyResolution"("meetingCalendarId");

-- CreateIndex
CREATE INDEX "FeederBodyResolution_agendaItemId_idx" ON "FeederBodyResolution"("agendaItemId");

-- CreateIndex
CREATE INDEX "FeederBodyResolution_bodyCode_idx" ON "FeederBodyResolution"("bodyCode");

-- CreateIndex
CREATE UNIQUE INDEX "FeederBodyResolution_bodyCode_resolutionNumber_key" ON "FeederBodyResolution"("bodyCode", "resolutionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SyndicateMember_email_key" ON "SyndicateMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SyndicateMember_memberNumber_key" ON "SyndicateMember"("memberNumber");

-- CreateIndex
CREATE INDEX "SyndicateMember_status_idx" ON "SyndicateMember"("status");

-- CreateIndex
CREATE INDEX "ReadReceipt_workingPaperId_idx" ON "ReadReceipt"("workingPaperId");

-- CreateIndex
CREATE INDEX "ReadReceipt_syndicateMemberId_idx" ON "ReadReceipt"("syndicateMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadReceipt_workingPaperId_syndicateMemberId_key" ON "ReadReceipt"("workingPaperId", "syndicateMemberId");

-- CreateIndex
CREATE INDEX "MemberQuery_syndicateMemberId_idx" ON "MemberQuery"("syndicateMemberId");

-- CreateIndex
CREATE INDEX "MemberQuery_status_idx" ON "MemberQuery"("status");

-- CreateIndex
CREATE INDEX "Decision_meetingCalendarId_idx" ON "Decision"("meetingCalendarId");

-- CreateIndex
CREATE INDEX "Decision_agendaItemId_idx" ON "Decision"("agendaItemId");

-- CreateIndex
CREATE INDEX "Decision_decidedBy_idx" ON "Decision"("decidedBy");

-- CreateIndex
CREATE INDEX "ActionTakenEntry_decisionId_idx" ON "ActionTakenEntry"("decisionId");

-- CreateIndex
CREATE INDEX "ActionTakenEntry_assignedTo_idx" ON "ActionTakenEntry"("assignedTo");

-- CreateIndex
CREATE INDEX "ActionTakenEntry_status_idx" ON "ActionTakenEntry"("status");

-- CreateIndex
CREATE INDEX "ActionTakenEntry_dueDate_idx" ON "ActionTakenEntry"("dueDate");

-- CreateIndex
CREATE INDEX "NotificationForAction_actionTakenEntryId_idx" ON "NotificationForAction"("actionTakenEntryId");

-- CreateIndex
CREATE INDEX "NotificationForAction_recipientEmail_idx" ON "NotificationForAction"("recipientEmail");

-- CreateIndex
CREATE INDEX "AuditEvent_eventType_idx" ON "AuditEvent"("eventType");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_idx" ON "AuditEvent"("entityType");

-- CreateIndex
CREATE INDEX "AuditEvent_entityId_idx" ON "AuditEvent"("entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_idx" ON "AuditEvent"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_timestamp_idx" ON "AuditEvent"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ASRBCase_receiptReference_key" ON "ASRBCase"("receiptReference");

-- CreateIndex
CREATE INDEX "ASRBCase_status_idx" ON "ASRBCase"("status");

-- CreateIndex
CREATE INDEX "ASRBCase_caseType_idx" ON "ASRBCase"("caseType");

-- CreateIndex
CREATE INDEX "ASRBCase_feederClientId_idx" ON "ASRBCase"("feederClientId");

-- CreateIndex
CREATE INDEX "ASRBCase_receiptReference_idx" ON "ASRBCase"("receiptReference");

-- CreateIndex
CREATE UNIQUE INDEX "ASRBCase_feederClientId_idempotencyKey_key" ON "ASRBCase"("feederClientId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "CaseAttachment_uploadToken_key" ON "CaseAttachment"("uploadToken");

-- CreateIndex
CREATE INDEX "CaseAttachment_caseId_idx" ON "CaseAttachment"("caseId");

-- CreateIndex
CREATE INDEX "CaseAttachment_uploadToken_idx" ON "CaseAttachment"("uploadToken");

-- CreateIndex
CREATE INDEX "CaseAuditEvent_caseId_idx" ON "CaseAuditEvent"("caseId");

-- CreateIndex
CREATE INDEX "CaseAuditEvent_eventType_idx" ON "CaseAuditEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "FeederClient_feederBodyCode_key" ON "FeederClient"("feederBodyCode");

-- CreateIndex
CREATE INDEX "FeederClient_apiKeyHash_idx" ON "FeederClient"("apiKeyHash");

-- CreateIndex
CREATE INDEX "FeederClient_feederBodyCode_idx" ON "FeederClient"("feederBodyCode");

-- CreateIndex
CREATE INDEX "ComplianceRule_ruleId_idx" ON "ComplianceRule"("ruleId");

-- CreateIndex
CREATE INDEX "ComplianceRule_source_idx" ON "ComplianceRule"("source");

-- CreateIndex
CREATE INDEX "ComplianceRule_status_idx" ON "ComplianceRule"("status");

-- CreateIndex
CREATE INDEX "ComplianceRule_effectiveFrom_idx" ON "ComplianceRule"("effectiveFrom");

-- CreateIndex
CREATE INDEX "ComplianceRule_effectiveTo_idx" ON "ComplianceRule"("effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceRule_ruleId_version_key" ON "ComplianceRule"("ruleId", "version");

-- CreateIndex
CREATE INDEX "ComplianceEvaluation_caseId_idx" ON "ComplianceEvaluation"("caseId");

-- CreateIndex
CREATE INDEX "ComplianceEvaluation_status_idx" ON "ComplianceEvaluation"("status");

-- CreateIndex
CREATE INDEX "ComplianceEvaluation_evaluatedAt_idx" ON "ComplianceEvaluation"("evaluatedAt");

-- CreateIndex
CREATE INDEX "RuleEvaluation_evaluationId_idx" ON "RuleEvaluation"("evaluationId");

-- CreateIndex
CREATE INDEX "RuleEvaluation_ruleId_idx" ON "RuleEvaluation"("ruleId");

-- CreateIndex
CREATE INDEX "RuleEvaluation_outcome_idx" ON "RuleEvaluation"("outcome");

-- CreateIndex
CREATE INDEX "RuleEvaluation_complianceRuleId_idx" ON "RuleEvaluation"("complianceRuleId");

-- CreateIndex
CREATE UNIQUE INDEX "ASRBMeeting_meetingNumber_key" ON "ASRBMeeting"("meetingNumber");

-- CreateIndex
CREATE INDEX "ASRBMeeting_status_idx" ON "ASRBMeeting"("status");

-- CreateIndex
CREATE INDEX "ASRBMeeting_scheduledAt_idx" ON "ASRBMeeting"("scheduledAt");

-- CreateIndex
CREATE INDEX "ASRBMeeting_cycleCode_idx" ON "ASRBMeeting"("cycleCode");

-- CreateIndex
CREATE INDEX "ASRBMember_roleType_idx" ON "ASRBMember"("roleType");

-- CreateIndex
CREATE INDEX "ASRBMember_active_idx" ON "ASRBMember"("active");

-- AddForeignKey
ALTER TABLE "APCEEvent" ADD CONSTRAINT "APCEEvent_meetingCalendarId_fkey" FOREIGN KEY ("meetingCalendarId") REFERENCES "MeetingCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_apceEventId_fkey" FOREIGN KEY ("apceEventId") REFERENCES "APCEEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_meetingCalendarId_fkey" FOREIGN KEY ("meetingCalendarId") REFERENCES "MeetingCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingPaper" ADD CONSTRAINT "WorkingPaper_meetingCalendarId_fkey" FOREIGN KEY ("meetingCalendarId") REFERENCES "MeetingCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingPaper" ADD CONSTRAINT "WorkingPaper_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annexure" ADD CONSTRAINT "Annexure_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annexure" ADD CONSTRAINT "Annexure_workingPaperId_fkey" FOREIGN KEY ("workingPaperId") REFERENCES "WorkingPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeederBodyResolution" ADD CONSTRAINT "FeederBodyResolution_meetingCalendarId_fkey" FOREIGN KEY ("meetingCalendarId") REFERENCES "MeetingCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeederBodyResolution" ADD CONSTRAINT "FeederBodyResolution_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadReceipt" ADD CONSTRAINT "ReadReceipt_workingPaperId_fkey" FOREIGN KEY ("workingPaperId") REFERENCES "WorkingPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadReceipt" ADD CONSTRAINT "ReadReceipt_syndicateMemberId_fkey" FOREIGN KEY ("syndicateMemberId") REFERENCES "SyndicateMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberQuery" ADD CONSTRAINT "MemberQuery_syndicateMemberId_fkey" FOREIGN KEY ("syndicateMemberId") REFERENCES "SyndicateMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_meetingCalendarId_fkey" FOREIGN KEY ("meetingCalendarId") REFERENCES "MeetingCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionTakenEntry" ADD CONSTRAINT "ActionTakenEntry_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationForAction" ADD CONSTRAINT "NotificationForAction_actionTakenEntryId_fkey" FOREIGN KEY ("actionTakenEntryId") REFERENCES "ActionTakenEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ASRBCase" ADD CONSTRAINT "ASRBCase_feederClientId_fkey" FOREIGN KEY ("feederClientId") REFERENCES "FeederClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAttachment" ADD CONSTRAINT "CaseAttachment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ASRBCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAuditEvent" ADD CONSTRAINT "CaseAuditEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ASRBCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceEvaluation" ADD CONSTRAINT "ComplianceEvaluation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ASRBCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEvaluation" ADD CONSTRAINT "RuleEvaluation_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "ComplianceEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleEvaluation" ADD CONSTRAINT "RuleEvaluation_complianceRuleId_fkey" FOREIGN KEY ("complianceRuleId") REFERENCES "ComplianceRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

