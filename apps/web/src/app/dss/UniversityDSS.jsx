"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck,
  Trophy, Heart, Building2, ChevronRight, ChevronDown, Clock, Bell,
  TrendingUp, AlertTriangle, CheckCircle, Target,
  Calendar, DollarSign, Award, BarChart3, Settings, FileText,
  ArrowUp, ArrowDown, Minus, Activity, Briefcase, Globe, Lightbulb,
  Shield, Layers, GitBranch, Zap, X, Flag, Link2, Eye,
  PlayCircle, ArrowRight, Monitor, Database, Server,
  Cpu, Filter, Beaker, PauseCircle, Circle, Info,
  UserCheck, BookMarked, Wifi, WifiOff,
  Plus, Trash2, Edit3, Save, Copy, Download, Upload, Move,
  ChevronUp, FolderTree, Search, Landmark, Scale, FileCheck, Send
} from "lucide-react";

/* ══════════════════════════════════════════════════════════
   SECTION 1 — SHARED CONSTANTS & HELPERS
   ══════════════════════════════════════════════════════════ */
const CX = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16","#f97316","#14b8a6"];

const DECISION_STATUS = {
  pending:    { label: "Pending",     color: "#f59e0b", bg: "#fffbeb" },
  inProgress: { label: "In Progress", color: "#3b82f6", bg: "#eff6ff" },
  escalated:  { label: "Escalated",   color: "#ef4444", bg: "#fef2f2" },
  resolved:   { label: "Resolved",    color: "#10b981", bg: "#ecfdf5" },
};

const ALERT_TYPE = {
  critical: { color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  warning:  { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  info:     { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  success:  { color: "#10b981", bg: "#ecfdf5", border: "#bbf7d0" },
};

const TASK_STATUS = {
  completed: { label: "Completed", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", icon: CheckCircle },
  onTrack:   { label: "On Track",  color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", icon: Circle },
  atRisk:    { label: "At Risk",   color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", icon: AlertTriangle },
  overdue:   { label: "Overdue",   color: "#ef4444", bg: "#fef2f2", border: "#fecaca", icon: AlertTriangle },
  pending:   { label: "Pending",   color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", icon: Clock },
  upcoming:  { label: "Upcoming",  color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icon: Clock },
  blocked:   { label: "Blocked",   color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", icon: PauseCircle },
};

const OWNER_COLORS = {
  "HoD":"#ec4899","Dean":"#8b5cf6","Registrar":"#10b981","Timetable Office":"#f59e0b",
  "Provost":"#3b82f6","VP Operations":"#06b6d4","Labs Coordinator":"#84cc16",
  "Finance Office":"#ef4444","IT Services":"#6366f1","Student Affairs":"#f97316",
  "QA / IQAE":"#14b8a6","VP Research":"#a855f7","ORIC":"#0ea5e9",
  "Controller":"#d97706","HR":"#6366f1","Fundraising":"#b45309",
};

/* ══════════════════════════════════════════════════════════
   SECTION 1.5 — MUST FACULTY REPORTING API CONFIGURATION
   Integration with MUST Reporting System backend
   ══════════════════════════════════════════════════════════ */
const REPORTING_API_BASE = "";

const REPORT_TEMPLATE = {
  "templateName": "Faculty Monthly Report",
  "templateVersion": "1.0",
  "sections": [
    {
      "sectionId": 1,
      "sectionNumber": "1",
      "sectionName": "Teaching & Course Management",
      "fields": [
        { "key": "classesScheduled", "label": "Classes Scheduled", "type": "number", "defaultValue": 0 },
        { "key": "classesDelivered", "label": "Classes Delivered", "type": "number", "defaultValue": 0 },
        { "key": "attendanceMarkingCompliance", "label": "Attendance Marking Compliance", "type": "checkbox", "defaultValue": false, "conditional": true, "conditionalFields": ["attendanceMarkingPercentage"] },
        { "key": "attendanceMarkingPercentage", "label": "% Classes Marked within 24hrs", "type": "number", "defaultValue": 0, "visibleIf": "attendanceMarkingCompliance" },
        { "key": "studentsFlaggedLowAttendance", "label": "Students Flagged for Low Attendance (<75%)", "type": "number", "defaultValue": 0 },
        { "key": "studentsMissing3Classes", "label": "Students Missing 3+ Consecutive Classes", "type": "number", "defaultValue": 0 },
        { "key": "lmsCompliance", "label": "LMS Compliance", "type": "checklist", "isComposite": true, "subType": "grouped-checkboxes", "options": [{ "key": "courseOutlineUploaded", "label": "Course Outline Uploaded" }, { "key": "gradeAssessmentTemplateUpdated", "label": "Grade Assessment Template Updated" }, { "key": "weeklyLecturePlanUploaded", "label": "Weekly Lecture Plan Uploaded" }, { "key": "coursePackAvailable", "label": "Course Pack Available" }], "defaultValue": {} },
        { "key": "curriculumOnTrack", "label": "Curriculum Delivery On Track Per Lecture Plan", "type": "checkbox", "defaultValue": false, "conditional": true, "conditionalFields": ["curriculumComments"] },
        { "key": "curriculumComments", "label": "Comments", "type": "textarea", "defaultValue": "", "rows": 2 }
      ]
    },
    {
      "sectionId": 2,
      "sectionNumber": "2",
      "sectionName": "Assessment & Evaluation",
      "fields": [
        { "key": "assessmentsQuizzes", "label": "Quizzes", "type": "number", "defaultValue": 0 },
        { "key": "assessmentsAssignments", "label": "Assignments", "type": "number", "defaultValue": 0 },
        { "key": "assessmentsMidterm", "label": "Midterm", "type": "checkbox", "defaultValue": false },
        { "key": "assessmentsFinal", "label": "Final", "type": "checkbox", "defaultValue": false },
        { "key": "gradingInstrumentsOnTime", "label": "Grading Instruments Uploaded On Time", "type": "checkbox", "defaultValue": false },
        { "key": "gradesSubmittedOnTime", "label": "Grades Submitted Within Deadline", "type": "checkbox", "defaultValue": false },
        { "key": "midtermReviewAppropriate", "label": "Midterm Review Appropriate", "type": "checkbox", "defaultValue": false },
        { "key": "feedbackProvidedStudents", "label": "Feedback Provided to Students", "type": "checkbox", "defaultValue": false, "conditional": true, "conditionalFields": ["feedbackMethod"] },
        { "key": "feedbackMethod", "label": "Feedback Method", "type": "text", "defaultValue": "", "visibleIf": "feedbackProvidedStudents" },
        { "key": "assessmentComments", "label": "Comments", "type": "textarea", "defaultValue": "", "rows": 2 }
      ]
    },
    {
      "sectionId": 3,
      "sectionNumber": "3",
      "sectionName": "Student Counseling & Mentorship",
      "fields": [
        { "key": "studentsAssignedAdvising", "label": "Students Assigned for Advising", "type": "number", "defaultValue": 0 },
        { "key": "advisingSessionsHeld", "label": "Advising Sessions Held This Month", "type": "number", "defaultValue": 0 },
        { "key": "vulnerableStudentsIdentified", "label": "Vulnerable/At-Risk Students Identified", "type": "number", "defaultValue": 0 },
        { "key": "supportActionsTaken", "label": "Support Actions Taken", "type": "text", "defaultValue": "" },
        { "key": "counselingTopics", "label": "Counseling Topics Covered", "type": "checklist", "isMultiSelect": true, "options": [{ "value": "course_selection", "label": "Course Selection" }, { "value": "career_planning", "label": "Career Planning" }, { "value": "academic_progress", "label": "Academic Progress" }, { "value": "personal_challenges", "label": "Personal Challenges" }], "defaultValue": [] },
        { "key": "counselingComments", "label": "Comments", "type": "textarea", "defaultValue": "", "rows": 2 }
      ]
    },
    {
      "sectionId": 4,
      "sectionNumber": "4",
      "sectionName": "Office Hours & Student Support",
      "fields": [
        { "key": "officeHoursAnnounced", "label": "Weekly Office Hours Announced", "type": "checkbox", "defaultValue": false, "conditional": true, "conditionalFields": ["officeHoursPerWeek"] },
        { "key": "officeHoursPerWeek", "label": "Office Hours Per Week", "type": "number", "defaultValue": 0, "visibleIf": "officeHoursAnnounced" },
        { "key": "studentConsultations", "label": "Student Consultations This Month", "type": "number", "defaultValue": 0 },
        { "key": "academicWeakStudentSupport", "label": "Support for Weak Students", "type": "checkbox", "defaultValue": false, "conditional": true, "conditionalFields": ["academicWeakDetails"] },
        { "key": "academicWeakDetails", "label": "Details", "type": "textarea", "defaultValue": "", "rows": 2, "visibleIf": "academicWeakStudentSupport" }
      ]
    },
    {
      "sectionId": 5,
      "sectionNumber": "5",
      "sectionName": "Supervision of Projects & Research",
      "fields": [
        { "key": "fypSupervised", "label": "FYPs Supervised (UG)", "type": "number", "defaultValue": 0 },
        { "key": "pgThesisSupervised", "label": "Thesis Supervised (PG)", "type": "number", "defaultValue": 0 },
        { "key": "industryPartneredProjects", "label": "Industry-Partnered Projects", "type": "number", "defaultValue": 0 },
        { "key": "progressReviewsConducted", "label": "Progress Reviews Conducted", "type": "number", "defaultValue": 0 },
        { "key": "vivaDefensesParticipated", "label": "Viva Voce / Thesis Defenses Participated", "type": "number", "defaultValue": 0 },
        { "key": "projectComments", "label": "Comments", "type": "textarea", "defaultValue": "", "rows": 2 }
      ]
    },
    {
      "sectionId": 6,
      "sectionNumber": "6",
      "sectionName": "Research & Scholarly Activities",
      "fields": [
        { "key": "papersSubmitted", "label": "Papers Submitted/Under Review", "type": "number", "defaultValue": 0 },
        { "key": "conferencePapersPresented", "label": "Conference Papers Presented", "type": "number", "defaultValue": 0 },
        { "key": "grantsAppliedFor", "label": "Research Grants Applied For (Count)", "type": "number", "defaultValue": 0 },
        { "key": "grantsAppliedAmount", "label": "Applied For (Amount PKR)", "type": "number", "defaultValue": 0 },
        { "key": "grantsActive", "label": "Research Grants Active (Count)", "type": "number", "defaultValue": 0 },
        { "key": "grantsActiveAmount", "label": "Active Grants (Amount PKR)", "type": "number", "defaultValue": 0 },
        { "key": "conferencesAttended", "label": "Conferences/Seminars/Workshops Attended", "type": "array", "subType": "textarea-array", "defaultValue": [], "rows": 3 },
        { "key": "researchComments", "label": "Comments", "type": "textarea", "defaultValue": "", "rows": 2 }
      ]
    },
    {
      "sectionId": 7,
      "sectionNumber": "7",
      "sectionName": "Institutional Service & Committees",
      "fields": [
        { "key": "committeesServed", "label": "Committees Served On", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "curriculumActivities", "label": "Curriculum Development/Review Activities", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "qecActivities", "label": "QEC Activities Participated In", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "accreditationWork", "label": "Accreditation-Related Work", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "selfAssessmentActivities", "label": "Self-Assessment Review Activities", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "institutionalComments", "label": "Comments", "type": "textarea", "defaultValue": "", "rows": 2 }
      ]
    },
    {
      "sectionId": 8,
      "sectionNumber": "8",
      "sectionName": "Meetings & Academic Participation",
      "fields": [
        { "key": "departmentMeetingsAttended", "label": "Department Meetings Attended / Total", "type": "number", "defaultValue": 0, "subLabel": "Attended" },
        { "key": "departmentMeetingsTotal", "label": "Department Meetings Total", "type": "number", "defaultValue": 0, "subLabel": "Total", "isCompanion": "departmentMeetingsAttended" },
        { "key": "facultyMeetingsAttended", "label": "Faculty Meetings Attended", "type": "number", "defaultValue": 0 },
        { "key": "universityMeetingsAttended", "label": "University-Level Meetings Attended", "type": "number", "defaultValue": 0 },
        { "key": "keyContributions", "label": "Key Contributions/Decisions", "type": "textarea", "defaultValue": "", "rows": 3 }
      ]
    },
    {
      "sectionId": 9,
      "sectionNumber": "9",
      "sectionName": "Student Activities & Clubs",
      "fields": [
        { "key": "societiesAdvised", "label": "Societies/Clubs Advised", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "coCurricularEventsFacilitated", "label": "Co-Curricular Events Facilitated", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "studentCompetitions", "label": "Student Competitions/Hackathons Facilitated", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "activitiesComments", "label": "Comments", "type": "textarea", "defaultValue": "", "rows": 2 }
      ]
    },
    {
      "sectionId": 10,
      "sectionNumber": "10",
      "sectionName": "Industry Liaison & Community Engagement",
      "fields": [
        { "key": "industryVisits", "label": "Industry Visits/Interactions Count", "type": "number", "defaultValue": 0 },
        { "key": "industryOrganizations", "label": "Organizations Involved", "type": "text", "defaultValue": "" },
        { "key": "guestLecturesFacilitated", "label": "Guest Lectures Facilitated", "type": "number", "defaultValue": 0 },
        { "key": "internshipPlacementsFacilitated", "label": "Internship Placements Facilitated", "type": "number", "defaultValue": 0 },
        { "key": "studyToursOrganized", "label": "Study Tours Organized", "type": "number", "defaultValue": 0 },
        { "key": "communityOutreach", "label": "Community Outreach Activities", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "softSkillsActivities", "label": "Soft Skills Enhancement Activities", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "industryComments", "label": "Comments", "type": "textarea", "defaultValue": "", "rows": 2 }
      ]
    },
    {
      "sectionId": 11,
      "sectionNumber": "11",
      "sectionName": "Administrative Responsibilities",
      "fields": [
        { "key": "admissionsSupport", "label": "Admissions Support Activities", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "examinationDuties", "label": "Examination Duties Performed", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "documentationMaintained", "label": "Documentation/Records Maintained", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "auditInspectionSupport", "label": "Audit/Inspection/Accreditation Visit Support", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "complianceIssues", "label": "Compliance Issues (if any)", "type": "textarea", "defaultValue": "", "rows": 2 }
      ]
    },
    {
      "sectionId": 12,
      "sectionNumber": "12",
      "sectionName": "Professional Development",
      "fields": [
        { "key": "trainingPrograms", "label": "Training Programs Attended", "type": "array", "subType": "textarea-array", "defaultValue": [], "rows": 3 },
        { "key": "pdWorkshopsAttended", "label": "Workshops/Conferences for PD", "type": "array", "subType": "textarea-array", "defaultValue": [], "rows": 3 },
        { "key": "teachingInnovations", "label": "New Teaching Methods/Innovations Adopted", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "certificationObtained", "label": "Certifications Obtained", "type": "textarea", "defaultValue": "", "rows": 2 },
        { "key": "pdComments", "label": "Comments", "type": "textarea", "defaultValue": "", "rows": 2 }
      ]
    },
    {
      "sectionId": 13,
      "sectionNumber": "13",
      "sectionName": "Overall Summary & Self-Assessment",
      "fields": [
        { "key": "overallAssessment", "label": "Self-Assessment Rating (1-5)", "type": "composite", "subType": "rating-select", "isComposite": true, "options": [{ "key": "teaching", "label": "Teaching" }, { "key": "research", "label": "Research" }, { "key": "service", "label": "Service" }, { "key": "studentSupport", "label": "Student Support" }], "ratingScale": { "min": 1, "max": 5, "defaultValue": 3 }, "defaultValue": {} },
        { "key": "keyAchievements", "label": "Key Achievements This Month", "type": "textarea", "defaultValue": "", "rows": 3 },
        { "key": "challengesFaced", "label": "Challenges Faced", "type": "textarea", "defaultValue": "", "rows": 3 },
        { "key": "supportNeeded", "label": "Support Needed from Department/University", "type": "textarea", "defaultValue": "", "rows": 3 },
        { "key": "plansNextMonth", "label": "Plans for Next Month", "type": "textarea", "defaultValue": "", "rows": 3 }
      ]
    }
  ]
};

/* ══════════════════════════════════════════════════════════
   SECTION 2 — API SERVICE LAYER
   Simulates REST API calls with Promise-based interface
   ══════════════════════════════════════════════════════════ */
const DSSApiService = {
  /**
   * Load configuration for a role
   * @param {string} configName - Name of config file (e.g., 'workspace-vc.json')
   * @returns {Promise} Resolves with config object
   * Real endpoint: GET /api/v1/config/workspace/{role_id}
   */
  loadConfig: (configName) => new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        configName,
        timestamp: new Date().toISOString(),
        dataSourceCount: 8,
      });
    }, 250);
  }),

  /**
   * Get workspace data for a role
   * @param {string} roleId - Role identifier
   * @param {string} scopeLevel - Data scope level (institutional, faculty, department, etc)
   * @param {string} instanceId - Instance ID for multi-instance roles
   * @returns {Promise} Resolves with decisions, KPIs, alerts, playbook
   * Real endpoint: GET /api/v1/workspace/{role_id}/dashboard
   */
  getWorkspaceData: (roleId, scopeLevel, instanceId) => new Promise(resolve => {
    setTimeout(() => {
      resolve({
        roleId,
        scopeLevel,
        instanceId,
        decisionCount: Math.floor(Math.random() * 8) + 2,
        kpiCount: 5,
        alertCount: Math.floor(Math.random() * 4) + 1,
        playbookItems: 2,
        lastSync: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      });
    }, 350);
  }),

  /**
   * Get APCE tasks for a workflow
   * @param {string} workflowId - Workflow identifier (e.g., 'semester-prep')
   * @returns {Promise} Resolves with task array
   * Real endpoint: GET /api/v1/apce/workflows/{workflow_id}/tasks
   */
  getAPCETasks: (workflowId) => new Promise(resolve => {
    setTimeout(() => {
      resolve({
        workflowId,
        taskCount: 30,
        completedCount: Math.floor(Math.random() * 15),
        atRiskCount: Math.floor(Math.random() * 4),
        overallProgress: Math.floor(Math.random() * 60) + 20,
      });
    }, 300);
  }),

  /**
   * Submit a decision action
   * @param {string} decisionId - Decision identifier
   * @param {string} action - Action (approve, reject, escalate, defer)
   * @param {string} notes - Additional notes
   * @returns {Promise} Resolves with updated decision
   * Real endpoint: PATCH /api/v1/workspace/{role_id}/decisions/{decision_id}
   */
  submitDecision: (decisionId, action, notes) => new Promise(resolve => {
    setTimeout(() => {
      resolve({
        decisionId,
        action,
        status: action === 'escalate' ? 'escalated' : 'inProgress',
        submittedAt: new Date().toISOString(),
        auditLog: 'Decision recorded with full trace',
      });
    }, 400);
  }),

  /**
   * Get KPI time series data for chart rendering
   * @param {string} kpiId - KPI identifier
   * @param {string} period - Time period (monthly, quarterly, yearly)
   * @returns {Promise} Resolves with time series array
   * Real endpoint: GET /api/v1/workspace/{role_id}/kpis/{kpi_id}/timeseries
   */
  getKPITimeSeries: (kpiId, period) => new Promise(resolve => {
    setTimeout(() => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const data = months.map((m, i) => ({
        period: m,
        value: Math.floor(Math.random() * 40) + 60,
        target: 80,
      }));
      resolve(data);
    }, 280);
  }),

  /**
   * Get filtered alerts for a role
   * @param {string} roleId - Role identifier
   * @param {string} severity - Filter by severity (critical, warning, info, success)
   * @returns {Promise} Resolves with filtered alerts
   * Real endpoint: GET /api/v1/workspace/{role_id}/alerts
   */
  getAlerts: (roleId, severity) => new Promise(resolve => {
    setTimeout(() => {
      resolve({
        roleId,
        severity,
        count: Math.floor(Math.random() * 5),
        unacknowledged: Math.floor(Math.random() * 3),
        lastRefresh: new Date().toISOString(),
      });
    }, 220);
  }),

  /**
   * Trigger escalation for an APCE task
   * @param {string} taskId - Task identifier
   * @param {string} reason - Escalation reason
   * @returns {Promise} Resolves with escalation details
   * Real endpoint: POST /api/v1/apce/tasks/{task_id}/escalate
   */
  triggerEscalation: (taskId, reason) => new Promise(resolve => {
    setTimeout(() => {
      resolve({
        taskId,
        reason,
        escalatedTo: 'line-manager',
        escalationTime: new Date().toISOString(),
        notificationsSent: 3,
      });
    }, 320);
  }),

  /**
   * Get cascade impact analysis for a task
   * @param {string} taskId - Task identifier
   * @returns {Promise} Resolves with downstream impact data
   * Real endpoint: GET /api/v1/apce/tasks/{task_id}/cascade
   */
  getCascadeImpact: (taskId) => new Promise(resolve => {
    setTimeout(() => {
      const delays = [1, 3, 5, 7];
      const impact = delays[Math.floor(Math.random() * delays.length)];
      resolve({
        taskId,
        downstreamTasks: Math.floor(Math.random() * 6) + 2,
        criticalMilestones: Math.floor(Math.random() * 3) + 1,
        minCascadeDelayDays: impact,
        affectedRoles: Math.floor(Math.random() * 4) + 1,
      });
    }, 350);
  }),

  /**
   * Get status of all integrated data sources
   * @returns {Promise} Resolves with health/sync status of all sources
   * Real endpoint: GET /api/v1/system/data-sources/status
   */
  getDataSourceStatus: () => new Promise(resolve => {
    setTimeout(() => {
      resolve({
        timestamp: new Date().toISOString(),
        healthySources: 9,
        totalSources: 11,
        lastFullSync: new Date(Date.now() - 3600000).toISOString(),
        averageResponseTime: Math.floor(Math.random() * 200) + 100,
      });
    }, 300);
  }),
};

/* ══════════════════════════════════════════════════════════
   SECTION 3 — CONFIG REGISTRY & DATA SOURCES
   ══════════════════════════════════════════════════════════ */
const ConfigRegistry = {
  roleConfigs: {
    vc: 'workspace-vc.json',
    provost: 'workspace-provost.json',
    vpOps: 'workspace-vpOps.json',
    vpResearch: 'workspace-vpResearch.json',
    dean: 'workspace-dean.json',
    hod: 'workspace-hod.json',
    registrar: 'workspace-registrar.json',
    controller: 'workspace-controller.json',
    finance: 'workspace-finance.json',
    hr: 'workspace-hr.json',
    it: 'workspace-it.json',
    iqae: 'workspace-iqae.json',
    oric: 'workspace-oric.json',
    gradAffairs: 'workspace-gradAffairs.json',
    studentAffairs: 'workspace-studentAffairs.json',
    fundraising: 'workspace-fundraising.json',
  },
};

const DATA_SOURCES = [
  { name: 'PeopleSoft', syncMode: 'nightly-batch', status: 'healthy', endpoints: 8, lastSync: '2026-03-26T02:00:00Z' },
  { name: 'SAP SLM', syncMode: 'nightly-batch', status: 'healthy', endpoints: 3, lastSync: '2026-03-26T02:15:00Z' },
  { name: 'Finance System', syncMode: 'nightly-batch', status: 'healthy', endpoints: 7, lastSync: '2026-03-26T02:30:00Z' },
  { name: 'HR System', syncMode: 'nightly-batch', status: 'healthy', endpoints: 7, lastSync: '2026-03-26T02:45:00Z' },
  { name: 'QA System', syncMode: 'weekly', status: 'healthy', endpoints: 6, lastSync: '2026-03-22T03:00:00Z' },
  { name: 'ORIC System', syncMode: 'weekly', status: 'healthy', endpoints: 6, lastSync: '2026-03-22T03:30:00Z' },
  { name: 'Graduate Affairs', syncMode: 'daily', status: 'healthy', endpoints: 5, lastSync: '2026-03-26T01:00:00Z' },
  { name: 'LMS', syncMode: 'daily', status: 'healthy', endpoints: 3, lastSync: '2026-03-26T01:30:00Z' },
  { name: 'APCE', syncMode: 'realtime', status: 'healthy', endpoints: 6, lastSync: '2026-03-26T16:45:32Z' },
  { name: 'HR Payroll', syncMode: 'nightly-batch', status: 'healthy', endpoints: 4, lastSync: '2026-03-26T03:00:00Z' },
  { name: 'Faculty Records', syncMode: 'daily', status: 'degraded', endpoints: 5, lastSync: '2026-03-26T00:30:00Z' },
];

const ESCALATION_CHAIN = {
  defaultGracePeriodHours: 72,
  criticalGracePeriodHours: 24,
  chain: 'owner → lineManager → VP → VC → Board',
  iqaeBypassProvost: true,
};

/* ══════════════════════════════════════════════════════════
   BOARD GOVERNANCE — Data Models & Constants
   ══════════════════════════════════════════════════════════ */
const GOVERNANCE_SCHEMES = {
  A: { name: "Scheme A — Board of Governors (Federal Ordinance)", apexBody: "Board of Governors", executiveCommittee: "Finance Committee", academicAuthority: "Academic Council", ratifyingBody: null, vcChairsApex: false, chancellor: "President of Pakistan" },
  B: { name: "Scheme B — Syndicate + Senate", apexBody: "Senate", executiveCommittee: "Syndicate", academicAuthority: "Academic Council", ratifyingBody: null, vcChairsApex: true, chancellor: "Governor of Province" },
  C: { name: "Scheme C — Old University (Syndicate as Board)", apexBody: "Syndicate", executiveCommittee: "Syndicate", academicAuthority: "Academic Council", ratifyingBody: "Senate", vcChairsApex: false, chancellor: "Governor of Province" },
};

const BOARD_ORG_UNITS = [
  { code: "REG", name: "Registrar", fullName: "Office of the Registrar", level: 1, committee: "Board Secretary", subunits: ["Administration", "Board Secretariat", "Legal Cell", "Estate Management"] },
  { code: "TRS", name: "Treasurer / CFO", fullName: "Treasury & Finance", level: 1, committee: "Finance & Audit", subunits: ["Budget & Finance", "Accounts", "Procurement", "Investments", "Audit Coordination"] },
  { code: "COE", name: "Controller of Examinations", fullName: "Examination Office", level: 1, committee: "Academic & Quality", subunits: ["Exam Operations", "Grade Management", "Degree Conferral"] },
  { code: "QEC", name: "Director QEC", fullName: "Quality Enhancement Cell", level: 1, committee: "Academic & Quality", subunits: ["Programme Review", "Accreditation Liaison", "Data & Reporting"] },
  { code: "ORC", name: "Director ORIC", fullName: "Office of Research", level: 1, committee: "Research & Innovation", subunits: ["Research Grants", "Technology Transfer", "IPR & Commercialisation"] },
  { code: "DIT", name: "Director IT", fullName: "IT Directorate", level: 1, committee: "Infrastructure & Risk", subunits: ["LMS & ERP", "Network & Infrastructure", "Cybersecurity", "Portal & Email"] },
  { code: "DSA", name: "Director Student Affairs", fullName: "Student Affairs", level: 1, committee: "Board (student welfare KPIs)", subunits: ["Counselling", "Sports", "Hostels", "Career Services", "Student Discipline"] },
  { code: "DHR", name: "Director HR", fullName: "Human Resources", level: 1, committee: "HR & Remuneration", subunits: ["Recruitment & Talent", "Payroll & Benefits", "Staff Development", "Compliance & Welfare"] },
  { code: "DPD", name: "Director Planning & Dev", fullName: "Planning & Development", level: 1, committee: "Board (strategic plan)", subunits: ["Strategic Planning", "Data & Statistics", "Infrastructure Master Plan"] },
  { code: "DEAN", name: "Deans of Faculties", fullName: "Faculty Deans", level: 1, committee: "Academic & Quality", subunits: ["Faculty Offices", "Department Chairs", "Lab Managers"] },
  { code: "LIB", name: "Chief Librarian", fullName: "University Library", level: 1, committee: "Academic & Quality", subunits: ["Digital Library", "Archives", "E-Resources"] },
  { code: "ADM", name: "Director Admissions", fullName: "Admissions Office", level: 1, committee: "Board (enrolment KPIs)", subunits: ["Outreach & Marketing", "Merit Processing", "Scholarships", "International Students"] },
];

const BOARD_COMMITTEES = [
  { id: "fac", name: "Finance & Audit", chair: "Mr. Tariq Mahmood", meetingsReq: 4, meetingsHeld: 3, lastReport: "12 May 2025", torApproved: true, torReviewed: "Feb 2024", decisionRights: "Partial", status: "amber" },
  { id: "aqc", name: "Academic & Quality", chair: "Dr. Sadia Butt", meetingsReq: 4, meetingsHeld: 4, lastReport: "10 May 2025", torApproved: true, torReviewed: "Feb 2024", decisionRights: "Yes", status: "green" },
  { id: "hrc", name: "HR & Remuneration", chair: "Prof. Aisha Rahman", meetingsReq: 3, meetingsHeld: 2, lastReport: null, torApproved: false, torReviewed: null, decisionRights: "No", status: "red" },
  { id: "irc", name: "Infrastructure & Risk", chair: "Engr. Hassan Ali", meetingsReq: 2, meetingsHeld: 2, lastReport: "20 Apr 2025", torApproved: true, torReviewed: "Mar 2024", decisionRights: "Yes", status: "green" },
  { id: "gnc", name: "Governance & Nominations", chair: "Ms. Zainab Qureshi", meetingsReq: 2, meetingsHeld: 1, lastReport: null, torApproved: false, torReviewed: null, decisionRights: "Partial", status: "red" },
];

const BOARD_ACTION_ITEMS = [
  { id:"A-01", desc:"Submit VC performance contract draft to board chair", meeting:"Q2 May 25", category:"governance", owner:"Registrar", ownerUnit:"REG", due:"2025-06-01", status:"overdue", progress:20 },
  { id:"A-02", desc:"Finalise Finance & Audit Committee Terms of Reference", meeting:"Q2 May 25", category:"governance", owner:"Board Chair", ownerUnit:"REG", due:"2025-06-15", status:"overdue", progress:40 },
  { id:"A-03", desc:"Prepare HEC W-category improvement plan (target: W2 by 2027)", meeting:"Q2 May 25", category:"strategic", owner:"VC", ownerUnit:"DPD", due:"2025-07-30", status:"in_progress", progress:60 },
  { id:"A-04", desc:"Submit QEC annual self-assessment report to Academic Committee", meeting:"Q2 May 25", category:"academic", owner:"QEC Director", ownerUnit:"QEC", due:"2025-08-11", status:"overdue", progress:30 },
  { id:"A-05", desc:"Endowment fund investment policy — annual review", meeting:"Q2 May 25", category:"financial", owner:"Treasurer", ownerUnit:"TRS", due:"2025-08-30", status:"open", progress:0 },
  { id:"A-06", desc:"Update COI register — all board members", meeting:"Q2 May 25", category:"governance", owner:"Registrar", ownerUnit:"REG", due:"2025-08-01", status:"overdue", progress:77 },
  { id:"A-07", desc:"Research grant strategy paper — present to Academic Committee", meeting:"Q1 Feb 25", category:"academic", owner:"VC", ownerUnit:"ORC", due:"2025-09-01", status:"open", progress:10 },
  { id:"A-08", desc:"Risk register — annual review and board approval", meeting:"Q1 Feb 25", category:"governance", owner:"Infra & Risk Chair", ownerUnit:"DPD", due:"2025-09-15", status:"open", progress:0 },
  { id:"A-09", desc:"PhD faculty recruitment plan — 12 new positions by Dec 2026", meeting:"Q1 Feb 25", category:"academic", owner:"VC", ownerUnit:"DHR", due:"2025-10-01", status:"in_progress", progress:25 },
  { id:"A-10", desc:"Conflict of interest training for all board members", meeting:"Q1 Feb 25", category:"governance", owner:"Governance Chair", ownerUnit:"REG", due:"2025-11-01", status:"open", progress:0 },
  { id:"A-11", desc:"Annual student satisfaction survey — results to board", meeting:"Q3 Aug 25", category:"academic", owner:"Registrar", ownerUnit:"DSA", due:"2025-11-15", status:"open", progress:0 },
  { id:"A-12", desc:"Strategic plan mid-year review presentation", meeting:"Q3 Aug 25", category:"strategic", owner:"VC", ownerUnit:"DPD", due:"2025-08-18", status:"completed", progress:100 },
  { id:"A-13", desc:"External auditors appointment for FY2025", meeting:"Q1 Feb 25", category:"financial", owner:"F&A Chair", ownerUnit:"TRS", due:"2025-03-15", status:"completed", progress:100 },
];

const BOARD_MEMBERS = [
  { name: "Prof. Aisha Rahman", role: "Chair", category: "Independent", coiStatus: "current", coiDate: "15 Jan 2025", coiDetails: "Nil declared" },
  { name: "Mr. Tariq Mahmood", role: "Member", category: "Finance Expert", coiStatus: "current", coiDate: "15 Jan 2025", coiDetails: "Director, ABC Bank Ltd." },
  { name: "Dr. Sadia Butt", role: "Member", category: "Academic", coiStatus: "current", coiDate: "15 Jan 2025", coiDetails: "Nil declared" },
  { name: "PHEC Nominee (DG)", role: "Member", category: "Regulatory", coiStatus: "pending", coiDate: null, coiDetails: null },
  { name: "Engr. Hassan Ali", role: "Member", category: "Industry", coiStatus: "action_required", coiDate: "Jan 2024", coiDetails: "Construction co. directorship undisclosed" },
  { name: "Ms. Zainab Qureshi", role: "Member", category: "Alumni", coiStatus: "renewal_due", coiDate: "Feb 2024", coiDetails: "Nil declared" },
  { name: "Prof. Nasir Khan (VC)", role: "Ex-officio / Non-voting", category: "Executive", coiStatus: "current", coiDate: "15 Jan 2025", coiDetails: "Nil declared" },
];

const BOARD_KPI_DATA = {
  academic: [
    { kpi: "Total student enrolment", current: "4,820", target: "5,000", prior: "4,610", trend: "+4.6%", trendUp: true, rag: "amber", action: "Monitor" },
    { kpi: "PhD-qualified faculty ratio", current: "58%", target: "HEC min: 65%", prior: "55%", trend: "+3pp", trendUp: true, rag: "amber", action: "Remediation plan" },
    { kpi: "On-time graduation rate", current: "74%", target: "70%", prior: "71%", trend: "+3pp", trendUp: true, rag: "green", action: "None" },
    { kpi: "Research publications (indexed)", current: "87", target: "130", prior: "102", trend: "-15%", trendUp: false, rag: "red", action: "VC to present plan" },
    { kpi: "Student retention rate", current: "89%", target: "85%", prior: "87%", trend: "+2pp", trendUp: true, rag: "green", action: "None" },
    { kpi: "HEC QEC compliance score", current: "62%", target: "Min: 75%", prior: "68%", trend: "-6pp", trendUp: false, rag: "red", action: "Board resolution" },
    { kpi: "Graduate employment (6 months)", current: "71%", target: "75%", prior: "69%", trend: "+2pp", trendUp: true, rag: "amber", action: "Monitor" },
    { kpi: "Student-to-faculty ratio", current: "22:1", target: "≤20:1", prior: "24:1", trend: "Improving", trendUp: true, rag: "amber", action: "Monitor" },
  ],
  financial: [
    { kpi: "Total revenue", current: "PKR 890M", target: "950M", prior: "810M", trend: "+9.9%", trendUp: true, rag: "amber" },
    { kpi: "Operating surplus/(deficit)", current: "PKR 8M", target: "15M", prior: "12M", trend: "-33%", trendUp: false, rag: "amber" },
    { kpi: "Fee collection rate", current: "91%", target: "90%", prior: "88%", trend: "+3pp", trendUp: true, rag: "green" },
    { kpi: "Salary bill as % of revenue", current: "68%", target: "≤65%", prior: "66%", trend: "Worsening", trendUp: false, rag: "amber" },
    { kpi: "Endowment fund value", current: "PKR 210M", target: "250M", prior: "195M", trend: "+7.7%", trendUp: true, rag: "amber" },
    { kpi: "Research grant income", current: "PKR 22M", target: "35M", prior: "18M", trend: "+22%", trendUp: true, rag: "amber" },
    { kpi: "Outstanding audit paras", current: "7", target: "≤3", prior: "9", trend: "Reducing", trendUp: true, rag: "amber" },
  ],
  governance: [
    { kpi: "Board meetings held (vs required)", current: "4/5", target: "100%", rag: "amber", action: "Schedule deferred meeting" },
    { kpi: "Average board attendance", current: "78%", target: "≥80%", rag: "amber", action: "Board chair to follow up" },
    { kpi: "Action items closed on time", current: "54%", target: "≥85%", rag: "red", action: "Registrar discipline needed" },
    { kpi: "COI register — annual renewal", current: "10/13", target: "100%", rag: "amber", action: "3 members outstanding" },
    { kpi: "Policies reviewed (vs due)", current: "8/11", target: "100%", rag: "amber", action: "3 overdue for review" },
    { kpi: "HEC annual submission (on time)", current: "Yes", target: "Yes", rag: "green", action: "None" },
    { kpi: "External audit (on time)", current: "Yes", target: "Within 6 months", rag: "green", action: "None" },
  ],
  reputation: [
    { kpi: "HEC Ranking Category", current: "W3", target: "W2 by 2027", prior: "W3", rag: "amber" },
    { kpi: "Active industry MOUs", current: "14", target: "20", prior: "11", rag: "amber" },
    { kpi: "Active legal cases", current: "6", target: "≤3", prior: "4", rag: "amber" },
    { kpi: "Student satisfaction (overall)", current: "3.8/5", target: "3.5", prior: "3.6", rag: "green" },
    { kpi: "Alumni engagement rate", current: "28%", target: "40%", prior: "22%", rag: "amber" },
  ],
};

const BOARD_CALENDAR_EVENTS = [
  { date: "Feb 2025", event: "Q1 BoG Meeting", type: "BoG", responsible: "Registrar", status: "completed", deliverable: "Audit approved, VC review initiated" },
  { date: "Mar 2025", event: "Finance & Audit Committee — Q1", type: "Committee", responsible: "F&A Chair", status: "completed", deliverable: "Q4 FY24 accounts reviewed" },
  { date: "Apr 2025", event: "HEC Annual QA Self-Assessment", type: "Compliance", responsible: "QEC Director", status: "completed", deliverable: "Submitted on time" },
  { date: "May 2025", event: "Q2 BoG Meeting — Budget approval", type: "BoG", responsible: "Registrar", status: "completed", deliverable: "FY26 budget approved, 4 actions raised" },
  { date: "Jul 2025", event: "VC self-assessment due", type: "VC Eval", responsible: "VC / HR Chair", status: "completed", deliverable: "Received 1 May" },
  { date: "11 Aug 2025", event: "Q3 Board Pack circulation deadline", type: "BoG", responsible: "Registrar", status: "upcoming", deliverable: "All committee reports needed" },
  { date: "18 Aug 2025", event: "Q3 BoG Meeting — Strategic Review", type: "BoG", responsible: "Registrar", status: "scheduled", deliverable: "Strategic plan, VC evaluation, capex" },
  { date: "Sep 2025", event: "Finance & Audit — Q3 accounts", type: "Committee", responsible: "F&A Chair", status: "open", deliverable: "Management accounts + audit paras" },
  { date: "Oct 2025", event: "Academic & Quality — QEC annual report", type: "Committee", responsible: "A&Q Chair", status: "open", deliverable: "QEC compliance, accreditation status" },
  { date: "Nov 2025", event: "Q4 BoG Meeting — Self-Assessment + Succession", type: "BoG", responsible: "Gov Nom Chair", status: "scheduled", deliverable: "Board self-assessment results" },
  { date: "Dec 2025", event: "Board member COI register — annual renewal", type: "Compliance", responsible: "Registrar", status: "open", deliverable: "All 13 members must complete" },
  { date: "Jan 2026", event: "External auditors appointed for FY26", type: "Finance", responsible: "F&A Committee", status: "open", deliverable: "Board resolution required" },
  { date: "Feb 2026", event: "Q1 BoG Meeting — Audit results FY25", type: "BoG", responsible: "Registrar", status: "scheduled", deliverable: "Audited accounts approval" },
];

const BOARD_AGENDA_DEFAULT = {
  meeting: "Q3 BoG Meeting", date: "18 August 2025", quorum: "7 of 13 members", packDue: "11 August 2025", totalMinutes: 240,
  items: [
    { num: 1, title: "Opening: Call to order, quorum confirmation, conflict declarations", time: 10, category: "governance", presenter: "Registrar" },
    { num: 2, title: "Minutes of Q2 meeting & action tracker review (overdue items only)", time: 20, category: "governance", presenter: "Registrar" },
    { num: 3, title: "STRATEGIC DEEP DIVE: 3-Year Strategic Plan — Mid-Year Review & FY26 Priorities", time: 60, category: "strategic", presenter: "VC presents | Board debates" },
    { num: 4, title: "Finance & Audit Committee report — Q2 accounts, audit findings, endowment", time: 40, category: "financial", presenter: "Committee Chair" },
    { num: 5, title: "Academic & Quality Committee — QEC report, accreditation, PhD faculty gap", time: 30, category: "academic", presenter: "Committee Chair" },
    { num: 6, title: "CONSENT AGENDA: Routine approvals below threshold (14 items)", time: 5, category: "governance", presenter: "Approve as block" },
    { num: 7, title: "Policy approvals: VC performance framework; COI register renewal", time: 20, category: "governance", presenter: "Board vote required" },
    { num: 8, title: "Capital expenditure: Science block expansion — PKR 45M", time: 25, category: "financial", presenter: "Requires board resolution" },
    { num: 9, title: "Meeting quality review: Was this meeting strategic?", time: 10, category: "governance", presenter: "Board Chair leads" },
    { num: 10, title: "Next meeting date confirmed: Q4 — November 2025", time: 5, category: "governance", presenter: "" },
  ],
  packItems: [
    { label: "Agenda & cover note", done: true },
    { label: "Draft minutes of Q2 meeting", done: true },
    { label: "Action tracker (current status)", done: true },
    { label: "VC strategic report", done: true },
    { label: "Finance & Audit Committee report", done: true },
    { label: "Management accounts (Q1+Q2 FY26)", done: false },
    { label: "Academic & Quality Committee report", done: false },
    { label: "QEC compliance summary", done: false },
    { label: "Risk register update", done: true },
    { label: "Capital expenditure proposal (Science block)", done: true },
    { label: "Draft VC evaluation scorecard", done: false },
    { label: "Consent agenda (routine items list)", done: true },
    { label: "Conflict of interest declaration forms", done: false },
  ],
  redirectedItems: [
    { item: "Approval of 3 faculty leave applications", redirectTo: "Syndicate", why: "Below delegation threshold — operational HR" },
    { item: "Vendor invoice — PKR 180,000", redirectTo: "Treasurer", why: "Below PKR 5M board threshold" },
    { item: "Departmental timetable changes", redirectTo: "Academic Council", why: "Academic operational matter" },
  ],
};

/* ══════════════════════════════════════════════════════════
   AGENDA BUILDER — INTERACTIVE COMPONENT
   Workflow: Upload PDF → Parse Items → Edit/Add/Reorder → Set Meeting Details → Generate Agenda
   ══════════════════════════════════════════════════════════ */

const AGENDA_CATEGORIES = {
  governance: { label: "Governance", color: "#6b7280" },
  strategic: { label: "Strategic", color: "#7c3aed" },
  financial: { label: "Financial", color: "#ef4444" },
  academic: { label: "Academic", color: "#3b82f6" },
  compliance: { label: "Compliance", color: "#10b981" },
  hr: { label: "HR / Personnel", color: "#ec4899" },
  policy: { label: "Policy", color: "#f59e0b" },
  information: { label: "Information", color: "#06b6d4" },
  other: { label: "Other", color: "#9ca3af" },
};

function AgendaBuilderInteractive() {
  /* ── State ── */
  const FALLBACK_MEETINGS = [{
    id: "mtg_hec46",
    title: "46th Meeting of the Commission",
    date: "Thursday, April 09, 2026",
    time: "10:00 AM",
    venue: "HEC Secretariat, H-9, Islamabad",
    onlineLink: "",
    organization: "Higher Education Commission — Coordination Division",
    quorum: "",
    createdAt: "2026-04-01T00:00:00Z",
    items: [
      { id: "hec_1", num: 1, title: "Confirmation of the Minutes of the 45th (Regular) Meeting and the 12th and 13th Urgent Meetings of the Commission", time: 10, category: "governance", presenter: "", notes: "" },
      { id: "hec_2", num: 2, title: "Action Taken Report on the Decisions of the 45th (Regular) Meeting and 12th and 13th Urgent Meetings of the Commission", time: 15, category: "governance", presenter: "", notes: "" },
      { id: "hec_3", num: 3, title: "Initiatives Taken by the Incumbent Chairperson", time: 15, category: "strategic", presenter: "Chairperson", notes: "" },
      { id: "hec_4", num: 4, title: "Framework on Use of Generative AI (GenAI) Tools in HEIs", time: 20, category: "policy", presenter: "", notes: "" },
      { id: "hec_5", num: 5, title: "Guidelines for Engagement of Visiting Faculty in HEIs", time: 15, category: "academic", presenter: "", notes: "" },
      { id: "hec_6", num: 6, title: "Policy on Dual, Double and Joint Degree Programs, 2026", time: 15, category: "policy", presenter: "", notes: "" },
      { id: "hec_7", num: 7, title: "Revision of SOPs for Recognition/Attestation and Equivalence of Degrees", time: 10, category: "policy", presenter: "", notes: "" },
      { id: "hec_8", num: 8, title: "Amendments in Transnational Education (TNE) Policy, 2024", time: 10, category: "policy", presenter: "", notes: "" },
      { id: "hec_9", num: 9, title: "Resumption of Pearson UK HND Programmes in Pakistan", time: 10, category: "academic", presenter: "", notes: "" },
      { id: "hec_10", num: 10, title: "Accreditation Matters of Malir University of Science & Technology, Karachi", time: 10, category: "academic", presenter: "", notes: "" },
      { id: "hec_11a", num: 11, title: "Recognition of Students of Unauthorized Campuses/Colleges of University of South Asia, Lahore; Newports Institute of Communications and Economics (NICE), Karachi; and Preston Institute of Management, Science and Technology (PIMSAT), Karachi", time: 15, category: "compliance", presenter: "", notes: "" },
      { id: "hec_11b", num: 12, title: "Resolution of Issues Faced by Graduates of Unauthorized Campuses the Degrees of Whom Were Earlier Attested but the Attestations Stand Suspended", time: 10, category: "compliance", presenter: "", notes: "" },
      { id: "hec_12", num: 13, title: "HEC Constituent Colleges Policy, 2025", time: 10, category: "policy", presenter: "", notes: "" },
      { id: "hec_13", num: 14, title: "Establishment of the Consortium of Emerging Engineering & Technology Universities (P-5)", time: 10, category: "academic", presenter: "", notes: "" },
      { id: "hec_14", num: 15, title: "Extending Access to NAHE Training Programmes for Private Sector Universities and Self-Funded Faculty on a Cost-Sharing Basis", time: 10, category: "academic", presenter: "", notes: "" },
      { id: "hec_15", num: 16, title: "Composition of the Board of Governors (BOG) of National Academy of Higher Education (NAHE)", time: 10, category: "governance", presenter: "", notes: "" },
      { id: "hec_16", num: 17, title: "Composition of the Board of Governors (BoG) of Education Testing Council (ETC)", time: 10, category: "governance", presenter: "", notes: "" },
      { id: "hec_17", num: 18, title: "Recommendations of the HEC Selection Board Meetings held on 18.03.2025, 17.07.2025, 11.12.2025 & 06.03.2026", time: 10, category: "hr", presenter: "", notes: "" },
      { id: "hec_18", num: 19, title: "Recommendations of the Inquiry Committee Constituted Under the Civil Servants (Efficiency & Discipline) Rules, 2020 to Conduct Inquiry Against a Director (BPS-19)", time: 10, category: "hr", presenter: "", notes: "" },
      { id: "hec_19", num: 20, title: "HEC Employees Medical Treatment Policy, 2025", time: 10, category: "hr", presenter: "", notes: "" },
      { id: "hec_20", num: 21, title: "Extension in the Period of Deputation Appointment of Dr. Syed Shahbaz Hussain Shamsi as Director (BPS-19)", time: 5, category: "hr", presenter: "", notes: "" },
      { id: "hec_21", num: 22, title: "Adoption of Federal Government's Office Memoranda", time: 5, category: "governance", presenter: "", notes: "" },
      { id: "hec_22", num: 23, title: "Audit Para No. 16.4.4 — Unauthorized Payment of Islamabad Club Membership Fee (Rs. 1.000 Million)", time: 10, category: "financial", presenter: "", notes: "" },
      { id: "hec_23", num: 24, title: "Data Protection Policy for Sharing Institutional Data via APIs with External Government Organizations", time: 10, category: "compliance", presenter: "", notes: "" },
      { id: "hec_24", num: 25, title: "Rules of Business of the Commission", time: 10, category: "governance", presenter: "", notes: "" },
    ],
    packItems: [],
  }];

  const [meetings, setMeetings] = useState([]);          // saved meetings list
  const [dbSynced, setDbSynced] = useState(false);       // whether data is synced with database
  const [activeMeeting, setActiveMeeting] = useState(null); // currently editing meeting
  const [view, setView] = useState("list");               // "list" | "editor" | "preview"
  const [editingItemId, setEditingItemId] = useState(null);
  const [showNewMeetingForm, setShowNewMeetingForm] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);  // null | "parsing" | "done" | "error"
  const [parsedText, setParsedText] = useState("");
  const [workflowPanel, setWorkflowPanel] = useState(null); // item id showing workflow panel
  const [workflowLog, setWorkflowLog] = useState([]);       // audit log of workflow actions

  // New meeting form defaults
  const [newMeeting, setNewMeeting] = useState({
    title: "", date: "", time: "10:00", venue: "",
    onlineLink: "", organization: "", quorum: "",
  });

  // Workflow constants
  const WORKFLOW_STATES = {
    draft:              { label: "Draft",              color: "#6b7280", bg: "#f9fafb", icon: Edit3 },
    sent_for_review:    { label: "Sent for Review",    color: "#f59e0b", bg: "#fffbeb", icon: Send },
    under_review:       { label: "Under Review",       color: "#3b82f6", bg: "#eff6ff", icon: Eye },
    reviewed:           { label: "Reviewed",           color: "#8b5cf6", bg: "#f5f3ff", icon: CheckCircle },
    sent_for_approval:  { label: "Sent for Approval",  color: "#f97316", bg: "#fff7ed", icon: Send },
    approved:           { label: "Approved",           color: "#10b981", bg: "#ecfdf5", icon: CheckCircle },
    rejected:           { label: "Returned",           color: "#ef4444", bg: "#fef2f2", icon: X },
  };

  const SAMPLE_PEOPLE = [
    { id: "p1", name: "Prof. Sohail Naqvi", role: "Chairperson" },
    { id: "p2", name: "Dr. Nasra Naqvi", role: "Director HR" },
    { id: "p3", name: "Mr. Ahmed Khan", role: "Registrar" },
    { id: "p4", name: "Dr. Sarah Malik", role: "Dean Academics" },
    { id: "p5", name: "Mr. Imran Ali", role: "VP Operations" },
    { id: "p6", name: "Dr. Fatima Zahra", role: "Director QA" },
    { id: "p7", name: "Mr. Tariq Mehmood", role: "Director Finance" },
    { id: "p8", name: "Dr. Ayesha Siddiqui", role: "Director Research" },
  ];

  /* ── API & Database Sync ── */
  const mapApiMeetingToLocal = (apiMeeting) => {
    const { meetingCalendar, agendaItems } = apiMeeting;
    return {
      id: meetingCalendar.id,
      meetingNumber: meetingCalendar.meetingNumber,
      title: `${meetingCalendar.meetingNumber}${meetingCalendar.meetingNumber ? ' — ' : ''}Meeting`,
      date: new Date(meetingCalendar.meetingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: "10:00 AM",
      venue: meetingCalendar.meetingLocation || "",
      onlineLink: "",
      organization: "",
      quorum: "",
      createdAt: new Date().toISOString(),
      items: (agendaItems || []).map(item => ({
        id: item.id,
        num: item.itemNumber,
        title: item.title,
        time: 10,
        category: guessCategory(item.title),
        presenter: "",
        notes: item.description || "",
        attachments: [],
        workflow: mapApiStatusToWorkflow(item.status),
        reviewer: null,
        approver: null,
        reviewComment: "",
        approvalComment: "",
        reviewDate: item.vettedDate || null,
        approvalDate: null,
      })),
      packItems: [],
    };
  };

  const mapApiStatusToWorkflow = (status) => {
    const statusMap = {
      DRAFT: "draft",
      SUBMITTED: "sent_for_review",
      VETTED: "reviewed",
      APPROVED_FOR_AGENDA: "approved",
      CIRCULATED: "approved",
      DECIDED: "approved",
      CLOSED: "approved",
      RETURNED: "rejected",
      DEFERRED: "under_review",
      WITHDRAWN: "rejected",
    };
    return statusMap[status] || "draft";
  };

  const fetchMeetingsFromApi = async () => {
    try {
      const response = await fetch("/api/board/meetings");
      if (!response.ok) throw new Error("Failed to fetch meetings");
      const data = await response.json();
      const localMeetings = data.map(mapApiMeetingToLocal);
      setMeetings(localMeetings);
      setDbSynced(true);
    } catch (error) {
      console.error("API fetch error, using fallback data:", error);
      setMeetings(FALLBACK_MEETINGS);
      setDbSynced(false);
    }
  };

  useEffect(() => {
    fetchMeetingsFromApi();
  }, []);

  /* ── Helpers ── */
  const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  const renumberItems = (items) => items.map((item, idx) => ({ ...item, num: idx + 1 }));

  const totalTime = (items) => items.reduce((sum, i) => sum + (i.time || 0), 0);

  const formatMinutes = (mins) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  /* ── PDF text parsing ── */
  const parseAgendaFromText = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const items = [];
    const numPatterns = [
      /^(\d+[a-z]?)\.\s+(.+)/i,     // "01. Description" or "11a. Description"
      /^(\d+[a-z]?)\)\s+(.+)/i,     // "1) Description"
      /^(\d+[a-z]?)\s{2,}(.+)/i,    // "01   Description" (table with padding)
      /^(\d+[a-z]?)\s+([A-Z].{5,})/,  // "01 Capitalized description..." (at least 5 chars after capital)
      /^(\d+[a-z]?)\s+(.+)/i,        // "01 Description" or "11a Description"
      /^[Ss]\.?[Nn]\.?\s*(\d+[a-z]?)\s+(.+)/i,  // "S.N. 01 Description"
      /^Item\s+(\d+[a-z]?)[.:]\s*(.+)/i,  // "Item 1: Description"
    ];

    let titleCandidate = "";
    let dateCandidate = "";
    let venueCandidate = "";

    for (const line of lines) {
      // Try to detect meeting title (all caps, contains "meeting" or "agenda")
      if (/meeting|agenda/i.test(line) && /^\d/.test(line) === false && line.length < 120) {
        if (!titleCandidate || line.toUpperCase() === line) titleCandidate = line;
      }
      // Date patterns
      const dateMatch = line.match(/(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i)
        || line.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i)
        || line.match(/(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})/);
      if (dateMatch && !dateCandidate) dateCandidate = dateMatch[0];
      // Venue
      if (/secretariat|campus|room|hall|venue|building/i.test(line) && !venueCandidate) {
        venueCandidate = line.replace(/^(at|venue[:\s]*)/i, "").trim();
      }

      // Try to match numbered agenda items
      for (const pattern of numPatterns) {
        const match = line.match(pattern);
        if (match) {
          const description = match[2].trim();
          // Skip header rows like "Description"
          if (description.toLowerCase() === "description" || description.length < 3) continue;
          items.push({
            id: generateId(),
            num: items.length + 1,
            title: description,
            time: 10,
            category: guessCategory(description),
            presenter: "",
            notes: "",
          });
          break;
        }
      }
    }

    return {
      items: renumberItems(items),
      detectedTitle: titleCandidate,
      detectedDate: dateCandidate,
      detectedVenue: venueCandidate,
    };
  };

  const guessCategory = (title) => {
    const t = title.toLowerCase();
    if (/minutes|confirmation|quorum|call to order|action taken/i.test(t)) return "governance";
    if (/financ|budget|audit|account|expenditure|payment/i.test(t)) return "financial";
    if (/strategic|plan|initiative/i.test(t)) return "strategic";
    if (/academic|faculty|degree|program|accreditation|qec|curriculum|university|college/i.test(t)) return "academic";
    if (/compliance|regulation|rule|sop|policy/i.test(t)) return "policy";
    if (/hr|employee|appointment|deputation|medical|selection board|inquiry/i.test(t)) return "hr";
    if (/data|api|protection|security/i.test(t)) return "compliance";
    return "other";
  };

  /* ── File Upload Handler with PDF.js support ── */
  const loadPdfJs = () => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const extractPdfText = async (arrayBuffer) => {
    const pdfjsLib = await loadPdfJs();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // Group text items by approximate Y position to reconstruct lines
      const items = content.items.filter(item => item.str.trim().length > 0);
      if (items.length === 0) continue;
      const lines = [];
      let currentLine = items[0].str;
      let lastY = items[0].transform[5];
      for (let j = 1; j < items.length; j++) {
        const y = items[j].transform[5];
        if (Math.abs(y - lastY) > 3) {
          // New line
          lines.push(currentLine.trim());
          currentLine = items[j].str;
        } else {
          currentLine += " " + items[j].str;
        }
        lastY = y;
      }
      if (currentLine.trim()) lines.push(currentLine.trim());
      fullText += lines.join("\n") + "\n";
    }
    return fullText;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus("parsing");

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractPdfText(arrayBuffer);
        setParsedText(text);
        processUploadedText(text);
      } catch (err) {
        console.error("PDF parse error:", err);
        // Fallback: show textarea for manual paste
        setUploadStatus("pdf-manual");
        setParsedText("");
      }
    } else {
      // Text / CSV / other — read as text
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        setParsedText(text);
        processUploadedText(text);
      };
      reader.readAsText(file);
    }
    // Reset the input so the same file can be re-uploaded
    e.target.value = "";
  };

  const processUploadedText = (text) => {
    const result = parseAgendaFromText(text);
    if (result.items.length === 0) {
      setUploadStatus("error");
      return;
    }
    setActiveMeeting(prev => ({
      ...prev,
      title: result.detectedTitle || prev.title,
      date: result.detectedDate || prev.date,
      venue: result.detectedVenue || prev.venue,
      items: result.items,
    }));
    setUploadStatus("done");
    setView("editor");
  };

  const handlePasteAgenda = () => {
    if (!parsedText.trim()) return;
    processUploadedText(parsedText);
  };

  /* ── CRUD operations ── */
  const createNewMeeting = async () => {
    try {
      const meetingNumber = meetings.length + 1;
      const response = await fetch("/api/board/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingNumber,
          meetingDate: newMeeting.date || new Date().toISOString().split('T')[0],
          meetingLocation: newMeeting.venue || "",
        }),
      });
      if (!response.ok) throw new Error("Failed to create meeting");
      const apiMeeting = await response.json();
      
      const meeting = {
        id: apiMeeting.meetingCalendar?.id || `mtg_${Date.now()}`,
        meetingNumber,
        title: newMeeting.title || `Meeting ${meetingNumber}`,
        date: newMeeting.date || "",
        time: newMeeting.time || "10:00",
        venue: newMeeting.venue || "",
        onlineLink: newMeeting.onlineLink || "",
        organization: newMeeting.organization || "",
        quorum: newMeeting.quorum || "",
        items: [],
        packItems: [],
        createdAt: new Date().toISOString(),
      };
      setActiveMeeting(meeting);
      setMeetings(prev => [...prev, meeting]);
      setDbSynced(true);
      setView("editor");
      setShowNewMeetingForm(false);
      setUploadStatus(null);
      setNewMeeting({ title: "", date: "", time: "10:00", venue: "", onlineLink: "", organization: "", quorum: "" });
    } catch (error) {
      console.error("Create meeting error:", error);
      // Fallback: create locally without API
      const meetingNumber = meetings.length + 1;
      const meeting = {
        id: `mtg_${Date.now()}`,
        meetingNumber,
        title: newMeeting.title || `Meeting ${meetingNumber}`,
        date: newMeeting.date || "",
        time: newMeeting.time || "10:00",
        venue: newMeeting.venue || "",
        onlineLink: newMeeting.onlineLink || "",
        organization: newMeeting.organization || "",
        quorum: newMeeting.quorum || "",
        items: [],
        packItems: [],
        createdAt: new Date().toISOString(),
      };
      setActiveMeeting(meeting);
      setMeetings(prev => [...prev, meeting]);
      setDbSynced(false);
      setView("editor");
      setShowNewMeetingForm(false);
      setUploadStatus(null);
      setNewMeeting({ title: "", date: "", time: "10:00", venue: "", onlineLink: "", organization: "", quorum: "" });
    }
  };

  const saveMeeting = async () => {
    if (!activeMeeting) return;
    try {
      // Sync changed items to API
      for (const item of activeMeeting.items || []) {
        if (item.id && !item.id.startsWith("item_")) {
          // API item — update it
          await fetch(`/api/board/agenda-items`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: item.id,
              itemNumber: item.num,
              title: item.title,
              description: item.notes,
              status: mapWorkflowToApiStatus(item.workflow),
              proposedBy: item.presenter || "",
            }),
          });
        }
      }
      
      setMeetings(prev => {
        const exists = prev.findIndex(m => m.id === activeMeeting.id);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = { ...activeMeeting, updatedAt: new Date().toISOString() };
          return updated;
        }
        return [...prev, { ...activeMeeting, updatedAt: new Date().toISOString() }];
      });
      setDbSynced(true);
    } catch (error) {
      console.error("Save meeting error:", error);
      setDbSynced(false);
      // Still update locally
      setMeetings(prev => {
        const exists = prev.findIndex(m => m.id === activeMeeting.id);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = { ...activeMeeting, updatedAt: new Date().toISOString() };
          return updated;
        }
        return [...prev, { ...activeMeeting, updatedAt: new Date().toISOString() }];
      });
    }
  };

  const mapWorkflowToApiStatus = (workflow) => {
    const workflowMap = {
      draft: "DRAFT",
      sent_for_review: "SUBMITTED",
      reviewed: "VETTED",
      approved: "APPROVED_FOR_AGENDA",
      rejected: "RETURNED",
      under_review: "SUBMITTED",
    };
    return workflowMap[workflow] || "DRAFT";
  };

  const addItem = async () => {
    if (!activeMeeting) return;
    try {
      const itemNumber = (activeMeeting.items || []).length + 1;
      const response = await fetch("/api/board/agenda-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingCalendarId: activeMeeting.id,
          itemNumber,
          title: "",
          description: "",
          status: "DRAFT",
          proposedBy: "",
        }),
      });
      if (!response.ok) throw new Error("Failed to create agenda item");
      const apiItem = await response.json();
      
      const newItem = {
        id: apiItem.id || generateId(),
        num: itemNumber,
        title: "",
        time: 10,
        category: "other",
        presenter: "",
        notes: "",
        attachments: [],
        workflow: "draft",
        reviewer: null,
        approver: null,
        reviewComment: "",
        approvalComment: "",
        reviewDate: null,
        approvalDate: null,
      };
      setActiveMeeting(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
      setDbSynced(true);
      setEditingItemId(newItem.id);
    } catch (error) {
      console.error("Add item error:", error);
      // Fallback: create locally
      const newItem = {
        id: generateId(),
        num: (activeMeeting.items || []).length + 1,
        title: "",
        time: 10,
        category: "other",
        presenter: "",
        notes: "",
        attachments: [],
        workflow: "draft",
        reviewer: null,
        approver: null,
        reviewComment: "",
        approvalComment: "",
        reviewDate: null,
        approvalDate: null,
      };
      setActiveMeeting(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
      setDbSynced(false);
      setEditingItemId(newItem.id);
    }
  };

  /* ── File Attachment Handlers ── */
  const handleItemFileUpload = (itemId, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const attachment = {
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: evt.target.result,
          addedAt: new Date().toISOString(),
        };
        setActiveMeeting(prev => ({
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId
              ? { ...item, attachments: [...(item.attachments || []), attachment] }
              : item
          ),
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeAttachment = (itemId, attachmentId) => {
    setActiveMeeting(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { ...item, attachments: (item.attachments || []).filter(a => a.id !== attachmentId) }
          : item
      ),
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  /* ── Workflow Actions ── */
  const sendForReview = (itemId, reviewerId) => {
    updateItem(itemId, "workflow", "sent_for_review");
    updateItem(itemId, "reviewer", reviewerId);
    addWorkflowLog(itemId, "sent_for_review", `Sent for review to ${SAMPLE_PEOPLE.find(p => p.id === reviewerId)?.name || reviewerId}`);
  };

  const submitReview = (itemId, comment, decision) => {
    // decision: "reviewed" or "rejected"
    updateItem(itemId, "workflow", decision);
    updateItem(itemId, "reviewComment", comment);
    updateItem(itemId, "reviewDate", new Date().toISOString());
    addWorkflowLog(itemId, decision, comment || (decision === "reviewed" ? "Review completed" : "Returned with comments"));
  };

  const sendForApproval = (itemId, approverId) => {
    updateItem(itemId, "workflow", "sent_for_approval");
    updateItem(itemId, "approver", approverId);
    addWorkflowLog(itemId, "sent_for_approval", `Sent for approval to ${SAMPLE_PEOPLE.find(p => p.id === approverId)?.name || approverId}`);
  };

  const submitApproval = (itemId, comment, decision) => {
    // decision: "approved" or "rejected"
    updateItem(itemId, "workflow", decision);
    updateItem(itemId, "approvalComment", comment);
    updateItem(itemId, "approvalDate", new Date().toISOString());
    addWorkflowLog(itemId, decision, comment || (decision === "approved" ? "Approved" : "Returned with comments"));
  };

  const resetWorkflow = (itemId) => {
    updateItem(itemId, "workflow", "draft");
    updateItem(itemId, "reviewer", null);
    updateItem(itemId, "approver", null);
    updateItem(itemId, "reviewComment", "");
    updateItem(itemId, "approvalComment", "");
    updateItem(itemId, "reviewDate", null);
    updateItem(itemId, "approvalDate", null);
    addWorkflowLog(itemId, "draft", "Workflow reset to draft");
  };

  const addWorkflowLog = (itemId, action, detail) => {
    setWorkflowLog(prev => [...prev, {
      id: generateId(),
      itemId,
      action,
      detail,
      timestamp: new Date().toISOString(),
      user: "Current User",
    }]);
  };

  const updateItem = (id, field, value) => {
    setActiveMeeting(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item),
    }));
  };

  const deleteItem = async (id) => {
    try {
      // Delete from API if it's an API item
      if (id && !id.startsWith("item_")) {
        await fetch(`/api/board/agenda-items?id=${id}`, { method: "DELETE" });
        setDbSynced(true);
      }
      setActiveMeeting(prev => ({
        ...prev,
        items: renumberItems(prev.items.filter(item => item.id !== id)),
      }));
      if (editingItemId === id) setEditingItemId(null);
    } catch (error) {
      console.error("Delete item error:", error);
      setDbSynced(false);
      // Still delete locally
      setActiveMeeting(prev => ({
        ...prev,
        items: renumberItems(prev.items.filter(item => item.id !== id)),
      }));
      if (editingItemId === id) setEditingItemId(null);
    }
  };

  const moveItem = async (id, direction) => {
    setActiveMeeting(prev => {
      const items = [...prev.items];
      const idx = items.findIndex(i => i.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= items.length) return prev;
      [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
      const reordered = renumberItems(items);
      
      // Sync to API
      (async () => {
        try {
          await fetch("/api/board/agenda-items/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: reordered.map(item => ({ id: item.id, itemNumber: item.num })),
            }),
          });
          setDbSynced(true);
        } catch (error) {
          console.error("Reorder error:", error);
          setDbSynced(false);
        }
      })();
      
      return { ...prev, items: reordered };
    });
  };

  const duplicateItem = (id) => {
    setActiveMeeting(prev => {
      const idx = prev.items.findIndex(i => i.id === id);
      if (idx < 0) return prev;
      const orig = prev.items[idx];
      const dup = { ...orig, id: generateId(), title: orig.title + " (copy)" };
      const items = [...prev.items];
      items.splice(idx + 1, 0, dup);
      return { ...prev, items: renumberItems(items) };
    });
  };

  /* ── Generate formal agenda HTML ── */
  const generateAgendaHTML = () => {
    if (!activeMeeting) return "";
    const m = activeMeeting;
    const rows = (m.items || []).map(item => `
      <tr>
        <td style="border:1px solid #999;padding:8px 12px;text-align:center;font-weight:bold;width:60px">${item.num}</td>
        <td style="border:1px solid #999;padding:8px 12px">${item.title}</td>
        <td style="border:1px solid #999;padding:8px 12px;text-align:center;width:80px">${item.time ? item.time + ' min' : ''}</td>
        <td style="border:1px solid #999;padding:8px 12px;width:140px">${item.presenter || ''}</td>
      </tr>
    `).join("");
    return `
      <div style="font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:40px">
        <div style="text-align:center;margin-bottom:30px">
          <h2 style="margin:0;font-size:18px;text-transform:uppercase;letter-spacing:1px">${m.organization || ''}</h2>
          <div style="margin:8px 0;font-size:14px;color:#666">*****</div>
          <h3 style="margin:10px 0 4px;font-size:16px;text-decoration:underline">${m.title || 'Meeting Agenda'}</h3>
          ${m.date ? `<p style="margin:4px 0;font-size:14px">${m.date}${m.time ? ' at ' + m.time : ''}</p>` : ''}
          ${m.venue ? `<p style="margin:4px 0;font-size:14px">${m.venue}</p>` : ''}
          ${m.onlineLink ? `<p style="margin:4px 0;font-size:13px;color:#3b82f6">Online: ${m.onlineLink}</p>` : ''}
          ${m.quorum ? `<p style="margin:4px 0;font-size:13px;color:#666">Quorum: ${m.quorum}</p>` : ''}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="border:1px solid #999;padding:8px 12px;text-align:center">S.N.</th>
              <th style="border:1px solid #999;padding:8px 12px;text-align:left">Description</th>
              <th style="border:1px solid #999;padding:8px 12px;text-align:center">Time</th>
              <th style="border:1px solid #999;padding:8px 12px;text-align:left">Presenter</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="background:#f3f4f6;font-weight:bold">
              <td style="border:1px solid #999;padding:8px 12px" colspan="2">Total</td>
              <td style="border:1px solid #999;padding:8px 12px;text-align:center">${formatMinutes(totalTime(m.items || []))}</td>
              <td style="border:1px solid #999;padding:8px 12px"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  };

  /* ══════ RENDER ══════ */

  /* ── Meeting List View ── */
  if (view === "list") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">Agenda Builder</h3>
              <div className={`w-2 h-2 rounded-full ${dbSynced ? 'bg-green-500' : 'bg-yellow-500'}`} title={dbSynced ? "Synced with database" : "Unsync — changes not saved to database"}></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Create, edit and manage meeting agendas</p>
          </div>
          <button onClick={() => setShowNewMeetingForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
            <Plus size={16} /> New Meeting Agenda
          </button>
        </div>

        {/* New Meeting Form */}
        {showNewMeetingForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-4">
            <h4 className="font-bold text-blue-900 flex items-center gap-2"><FileText size={18} /> Create New Meeting Agenda</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Meeting Title *</label>
                <input type="text" value={newMeeting.title} onChange={e => setNewMeeting(p => ({...p, title: e.target.value}))}
                  placeholder="e.g. 46th Meeting of the Commission" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Organization</label>
                <input type="text" value={newMeeting.organization} onChange={e => setNewMeeting(p => ({...p, organization: e.target.value}))}
                  placeholder="e.g. Higher Education Commission" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input type="text" value={newMeeting.date} onChange={e => setNewMeeting(p => ({...p, date: e.target.value}))}
                  placeholder="e.g. Thursday, April 09, 2026" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                <input type="text" value={newMeeting.time} onChange={e => setNewMeeting(p => ({...p, time: e.target.value}))}
                  placeholder="e.g. 10:00 AM" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Venue</label>
                <input type="text" value={newMeeting.venue} onChange={e => setNewMeeting(p => ({...p, venue: e.target.value}))}
                  placeholder="e.g. HEC Secretariat, H-9, Islamabad" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Online Meeting Link</label>
                <input type="text" value={newMeeting.onlineLink} onChange={e => setNewMeeting(p => ({...p, onlineLink: e.target.value}))}
                  placeholder="e.g. https://zoom.us/j/..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quorum</label>
                <input type="text" value={newMeeting.quorum} onChange={e => setNewMeeting(p => ({...p, quorum: e.target.value}))}
                  placeholder="e.g. 7 of 13 members" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={createNewMeeting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Create &amp; Open Editor
              </button>
              <button onClick={() => setShowNewMeetingForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Saved Meetings */}
        {meetings.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 text-sm">Saved Agendas</h4>
            {meetings.map(m => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-blue-300 cursor-pointer"
                onClick={() => { setActiveMeeting(m); setView("editor"); }}>
                <div>
                  <div className="font-medium text-gray-900">{m.title || "Untitled Meeting"}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {m.date && <span>{m.date}</span>}{m.venue && <span> — {m.venue}</span>}
                    <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">{(m.items || []).length} items</span>
                    <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded">{formatMinutes(totalTime(m.items || []))}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            ))}
          </div>
        )}

        {meetings.length === 0 && !showNewMeetingForm && (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h4 className="text-gray-600 font-medium">No meeting agendas yet</h4>
            <p className="text-sm text-gray-400 mt-1">Click "New Meeting Agenda" to get started</p>
          </div>
        )}
      </div>
    );
  }

  /* ── Editor View ── */
  if (view === "editor" && activeMeeting) {
    const m = activeMeeting;
    const items = m.items || [];
    const catColor = (cat) => (AGENDA_CATEGORIES[cat] || AGENDA_CATEGORIES.other).color;

    return (
      <div className="p-6 space-y-5">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { saveMeeting(); setView("list"); setActiveMeeting(null); setUploadStatus(null); }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight size={18} className="rotate-180" /></button>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{m.title || "Untitled Meeting"}</h3>
              <div className="text-xs text-gray-500 flex gap-3 mt-0.5">
                {m.date && <span>{m.date}</span>}
                {m.time && <span>{m.time}</span>}
                {items.length > 0 && <span>{items.length} items — {formatMinutes(totalTime(items))}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { saveMeeting(); setView("preview"); }}
              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700">
              <Eye size={15} /> Preview Agenda
            </button>
            <button onClick={saveMeeting}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
              <Save size={15} /> Save
            </button>
          </div>
        </div>

        {/* Meeting Details (collapsible) */}
        <details className="bg-gray-50 border border-gray-200 rounded-lg">
          <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 flex items-center gap-2">
            <Settings size={15} /> Meeting Details
          </summary>
          <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input type="text" value={m.title} onChange={e => setActiveMeeting(p => ({...p, title: e.target.value}))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Organization</label>
              <input type="text" value={m.organization || ""} onChange={e => setActiveMeeting(p => ({...p, organization: e.target.value}))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input type="text" value={m.date} onChange={e => setActiveMeeting(p => ({...p, date: e.target.value}))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
              <input type="text" value={m.time || ""} onChange={e => setActiveMeeting(p => ({...p, time: e.target.value}))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Venue</label>
              <input type="text" value={m.venue || ""} onChange={e => setActiveMeeting(p => ({...p, venue: e.target.value}))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Online Link</label>
              <input type="text" value={m.onlineLink || ""} onChange={e => setActiveMeeting(p => ({...p, onlineLink: e.target.value}))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quorum</label>
              <input type="text" value={m.quorum || ""} onChange={e => setActiveMeeting(p => ({...p, quorum: e.target.value}))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
          </div>
        </details>

        {/* Upload / Import section (shown when no items or on demand) */}
        {items.length === 0 && (
          <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-6 text-center space-y-4">
            <Upload size={36} className="mx-auto text-blue-400" />
            <div>
              <h4 className="font-medium text-blue-900">Import Agenda Items</h4>
              <p className="text-sm text-blue-700 mt-1">Upload a PDF/text file, paste agenda text, or add items manually</p>
            </div>

            {/* File Upload Button */}
            <div className="flex justify-center">
              <label className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                <Upload size={16} /> Upload Agenda File (PDF or Text)
                <input type="file" accept=".pdf,.txt,.csv,.doc" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {uploadStatus === "parsing" && (
              <div className="flex items-center justify-center gap-2 text-blue-700 text-sm">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Extracting text from file...
              </div>
            )}

            {uploadStatus === "pdf-manual" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-lg mx-auto text-left">
                <p className="text-sm text-yellow-800 font-medium mb-2">PDF could not be auto-parsed. Please copy-paste the agenda text below instead.</p>
                <p className="text-xs text-yellow-700 mb-3">Open the PDF, select all text (Cmd+A / Ctrl+A), copy it, then paste here.</p>
              </div>
            )}

            {/* Text paste area */}
            <div className="max-w-lg mx-auto space-y-3">
              <div className="relative">
                <div className="absolute left-3 top-2 text-xs text-gray-400">Or paste text:</div>
                <textarea value={parsedText} onChange={e => setParsedText(e.target.value)}
                  placeholder={"Paste your agenda text here. Each numbered item will be auto-detected.\n\nExample:\n01 Confirmation of Minutes\n02 Action Taken Report\n03 Framework on AI Tools"}
                  className="w-full h-40 px-3 pt-7 pb-2 border border-blue-300 rounded-lg text-sm font-mono resize-none" />
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={handlePasteAgenda}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  Parse &amp; Import
                </button>
                <button onClick={addItem}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1">
                  <Plus size={15} /> Add Manually
                </button>
              </div>
              {uploadStatus === "error" && (
                <p className="text-sm text-red-600">Could not detect numbered agenda items. Try adjusting the format (e.g. "01 Description").</p>
              )}
              {uploadStatus === "done" && items.length === 0 && (
                <p className="text-sm text-red-600">No items were detected. Try a different format.</p>
              )}
            </div>
          </div>
        )}

        {/* Agenda Items List */}
        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900">Agenda Items ({items.length})</h4>
              <div className="flex gap-2">
                <button onClick={() => {
                  setUploadStatus("import-more");
                  setParsedText("");
                }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 flex items-center gap-1">
                  <Upload size={13} /> Import More
                </button>
                <button onClick={addItem}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center gap-1">
                  <Plus size={13} /> Add Item
                </button>
              </div>
            </div>

            {/* Import more panel */}
            {uploadStatus === "import-more" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                <textarea value={parsedText} onChange={e => setParsedText(e.target.value)}
                  placeholder="Paste additional agenda items here..."
                  className="w-full h-28 px-3 py-2 border border-yellow-300 rounded text-sm font-mono resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => {
                    const result = parseAgendaFromText(parsedText);
                    if (result.items.length > 0) {
                      setActiveMeeting(prev => ({
                        ...prev,
                        items: renumberItems([...(prev.items || []), ...result.items]),
                      }));
                    }
                    setUploadStatus(null);
                  }} className="px-3 py-1.5 bg-yellow-600 text-white rounded text-xs font-medium">Import</button>
                  <button onClick={() => setUploadStatus(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">Cancel</button>
                </div>
              </div>
            )}

            {/* Time + Category + Workflow summary bar */}
            <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2 flex-wrap">
              <span>Total time: <strong className="text-gray-900">{formatMinutes(totalTime(items))}</strong></span>
              <span className="text-gray-300">|</span>
              {Object.entries(AGENDA_CATEGORIES).map(([key, cat]) => {
                const count = items.filter(i => i.category === key).length;
                if (count === 0) return null;
                return <span key={key} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{backgroundColor: cat.color}} />
                  {cat.label}: {count}
                </span>;
              })}
              <span className="text-gray-300">|</span>
              {Object.entries(WORKFLOW_STATES).map(([key, ws]) => {
                const count = items.filter(i => (i.workflow || "draft") === key).length;
                if (count === 0) return null;
                return <span key={key} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{backgroundColor: ws.color}} />
                  {ws.label}: {count}
                </span>;
              })}
              {items.filter(i => (i.attachments || []).length > 0).length > 0 && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1"><FileText size={10} /> {items.reduce((s, i) => s + (i.attachments || []).length, 0)} files attached</span>
                </>
              )}
            </div>

            {/* Items */}
            {items.map((item, idx) => {
              const isEditing = editingItemId === item.id;
              const wf = WORKFLOW_STATES[item.workflow || "draft"] || WORKFLOW_STATES.draft;
              const WfIcon = wf.icon;
              const showWfPanel = workflowPanel === item.id;
              const attachments = item.attachments || [];
              const itemLogs = workflowLog.filter(l => l.itemId === item.id);

              return (
                <div key={item.id} className={`bg-white border rounded-lg transition ${isEditing ? 'border-blue-400 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-start gap-3 p-3">
                    {/* Number + Move buttons */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button onClick={() => moveItem(item.id, -1)} disabled={idx === 0}
                        className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 text-gray-400"><ChevronUp size={14} /></button>
                      <span className="text-lg font-bold text-gray-400 w-8 text-center">{item.num}</span>
                      <button onClick={() => moveItem(item.id, 1)} disabled={idx === items.length - 1}
                        className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 text-gray-400"><ChevronDown size={14} /></button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input type="text" value={item.title} onChange={e => updateItem(item.id, "title", e.target.value)}
                            placeholder="Agenda item description" autoFocus
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm" />
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-0.5">Time (min)</label>
                              <input type="number" value={item.time} onChange={e => updateItem(item.id, "time", parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-0.5">Category</label>
                              <select value={item.category} onChange={e => updateItem(item.id, "category", e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                                {Object.entries(AGENDA_CATEGORIES).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-0.5">Presenter</label>
                              <input type="text" value={item.presenter || ""} onChange={e => updateItem(item.id, "presenter", e.target.value)}
                                placeholder="Optional" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">Notes</label>
                            <textarea value={item.notes || ""} onChange={e => updateItem(item.id, "notes", e.target.value)}
                              placeholder="Optional notes..." rows={2} className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none" />
                          </div>

                          {/* File Attachments Section */}
                          <div className="border-t border-gray-100 pt-2 mt-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs text-gray-500 font-medium flex items-center gap-1"><FileText size={12} /> Attachments ({attachments.length})</label>
                              <label className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs cursor-pointer hover:bg-gray-200 flex items-center gap-1">
                                <Upload size={11} /> Add File
                                <input type="file" multiple onChange={e => handleItemFileUpload(item.id, e)} className="hidden" />
                              </label>
                            </div>
                            {attachments.length > 0 && (
                              <div className="space-y-1">
                                {attachments.map(att => (
                                  <div key={att.id} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5 group">
                                    <FileCheck size={13} className="text-blue-500 flex-shrink-0" />
                                    <a href={att.dataUrl} download={att.name} className="text-xs text-blue-600 hover:underline truncate flex-1">{att.name}</a>
                                    <span className="text-xs text-gray-400">{formatFileSize(att.size)}</span>
                                    <button onClick={() => removeAttachment(item.id, att.id)}
                                      className="p-0.5 rounded hover:bg-red-100 text-red-400 opacity-0 group-hover:opacity-100"><X size={12} /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <button onClick={() => setEditingItemId(null)} className="text-xs text-blue-600 font-medium">Done editing</button>
                        </div>
                      ) : (
                        <div>
                          <div onClick={() => setEditingItemId(item.id)} className="cursor-pointer">
                            <div className="text-sm font-medium text-gray-900">{item.title || <span className="text-gray-400 italic">Click to edit...</span>}</div>
                            <div className="flex gap-2 mt-1.5 flex-wrap items-center">
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{item.time} min</span>
                              <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: catColor(item.category) + "18", color: catColor(item.category) }}>
                                {(AGENDA_CATEGORIES[item.category] || AGENDA_CATEGORIES.other).label}
                              </span>
                              {item.presenter && <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{item.presenter}</span>}
                              {attachments.length > 0 && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600 flex items-center gap-1">
                                  <FileText size={10} /> {attachments.length} file{attachments.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Workflow badge + Action buttons */}
                    <div className="flex flex-col items-end gap-2 pt-1">
                      {/* Workflow status badge */}
                      <button onClick={() => setWorkflowPanel(showWfPanel ? null : item.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition hover:shadow-sm"
                        style={{ backgroundColor: wf.bg, color: wf.color, borderColor: wf.color + "40" }}
                        title="Click to manage workflow">
                        <WfIcon size={11} /> {wf.label}
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingItemId(isEditing ? null : item.id)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400" title="Edit"><Edit3 size={14} /></button>
                        <button onClick={() => duplicateItem(item.id)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400" title="Duplicate"><Copy size={14} /></button>
                        <button onClick={() => deleteItem(item.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Panel (expandable) */}
                  {showWfPanel && (() => {
                    const wfState = item.workflow || "draft";
                    const reviewerPerson = SAMPLE_PEOPLE.find(p => p.id === item.reviewer);
                    const approverPerson = SAMPLE_PEOPLE.find(p => p.id === item.approver);
                    return (
                      <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                        {/* Workflow progress bar */}
                        <div className="flex items-center gap-1">
                          {["draft","sent_for_review","reviewed","sent_for_approval","approved"].map((step, si) => {
                            const stepDef = WORKFLOW_STATES[step];
                            const isCurrent = step === wfState;
                            const isRejected = wfState === "rejected";
                            const stepsOrder = ["draft","sent_for_review","reviewed","sent_for_approval","approved"];
                            const currentIdx = stepsOrder.indexOf(wfState);
                            const isPast = si < currentIdx && !isRejected;
                            return (
                              <div key={step} className="flex items-center gap-1 flex-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isCurrent ? 'ring-2 ring-offset-1' : ''
                                }`} style={{
                                  backgroundColor: isPast ? "#10b981" : isCurrent ? stepDef.color : "#e5e7eb",
                                  color: isPast || isCurrent ? "white" : "#9ca3af",
                                  ringColor: isCurrent ? stepDef.color : undefined
                                }}>
                                  {isPast ? "✓" : si + 1}
                                </div>
                                {si < 4 && <div className="flex-1 h-0.5 rounded" style={{ backgroundColor: isPast ? "#10b981" : "#e5e7eb" }} />}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-1 justify-between text-xs text-gray-400" style={{fontSize:"10px"}}>
                          <span>Draft</span><span>Review</span><span>Reviewed</span><span>Approval</span><span>Approved</span>
                        </div>

                        {/* Returned banner */}
                        {wfState === "rejected" && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                            <strong>Returned</strong> — {item.reviewComment || item.approvalComment || "Item has been returned with comments."}
                            <button onClick={() => resetWorkflow(item.id)} className="ml-3 text-xs underline text-red-600">Reset to Draft</button>
                          </div>
                        )}

                        {/* Step 1: Send for Review (when draft) */}
                        {wfState === "draft" && (
                          <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                            <h5 className="text-xs font-bold text-gray-700">Send for Review</h5>
                            <p className="text-xs text-gray-500">Select a reviewer to send this agenda item and its attachments for review.</p>
                            <select
                              defaultValue=""
                              onChange={e => { if (e.target.value) sendForReview(item.id, e.target.value); }}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
                              <option value="" disabled>Select reviewer...</option>
                              {SAMPLE_PEOPLE.map(p => (
                                <option key={p.id} value={p.id}>{p.name} — {p.role}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Step 2: Under Review — reviewer takes action */}
                        {wfState === "sent_for_review" && (
                          <div className="bg-white rounded-lg border border-yellow-200 p-3 space-y-2">
                            <h5 className="text-xs font-bold text-yellow-800">Awaiting Review from {reviewerPerson?.name || "Reviewer"}</h5>
                            <p className="text-xs text-gray-500">The reviewer can add comments and approve or return the item.</p>
                            <textarea placeholder="Review comments..." className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none" rows={2}
                              id={`review-comment-${item.id}`} />
                            <div className="flex gap-2">
                              <button onClick={() => {
                                const comment = document.getElementById(`review-comment-${item.id}`)?.value || "";
                                submitReview(item.id, comment, "reviewed");
                              }} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 flex items-center gap-1">
                                <CheckCircle size={12} /> Mark Reviewed
                              </button>
                              <button onClick={() => {
                                const comment = document.getElementById(`review-comment-${item.id}`)?.value || "";
                                submitReview(item.id, comment, "rejected");
                              }} className="px-3 py-1.5 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 flex items-center gap-1">
                                <X size={12} /> Return
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Reviewed — now send for approval */}
                        {wfState === "reviewed" && (
                          <div className="bg-white rounded-lg border border-purple-200 p-3 space-y-2">
                            <h5 className="text-xs font-bold text-purple-800">Reviewed {reviewerPerson ? `by ${reviewerPerson.name}` : ''}</h5>
                            {item.reviewComment && <p className="text-xs text-gray-600 bg-purple-50 rounded p-2 italic">"{item.reviewComment}"</p>}
                            <p className="text-xs text-gray-500">Now select an approver to send this item for final approval.</p>
                            <select
                              defaultValue=""
                              onChange={e => { if (e.target.value) sendForApproval(item.id, e.target.value); }}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
                              <option value="" disabled>Select approver...</option>
                              {SAMPLE_PEOPLE.map(p => (
                                <option key={p.id} value={p.id}>{p.name} — {p.role}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Step 4: Sent for Approval — approver takes action */}
                        {wfState === "sent_for_approval" && (
                          <div className="bg-white rounded-lg border border-orange-200 p-3 space-y-2">
                            <h5 className="text-xs font-bold text-orange-800">Awaiting Approval from {approverPerson?.name || "Approver"}</h5>
                            {item.reviewComment && <p className="text-xs text-gray-500">Reviewer comment: <em>"{item.reviewComment}"</em></p>}
                            <textarea placeholder="Approval comments..." className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none" rows={2}
                              id={`approval-comment-${item.id}`} />
                            <div className="flex gap-2">
                              <button onClick={() => {
                                const comment = document.getElementById(`approval-comment-${item.id}`)?.value || "";
                                submitApproval(item.id, comment, "approved");
                              }} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 flex items-center gap-1">
                                <CheckCircle size={12} /> Approve
                              </button>
                              <button onClick={() => {
                                const comment = document.getElementById(`approval-comment-${item.id}`)?.value || "";
                                submitApproval(item.id, comment, "rejected");
                              }} className="px-3 py-1.5 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 flex items-center gap-1">
                                <X size={12} /> Return
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Step 5: Approved */}
                        {wfState === "approved" && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                            <strong>Approved</strong>
                            {approverPerson && <span> by {approverPerson.name}</span>}
                            {item.approvalDate && <span className="text-xs text-green-600 ml-2">({new Date(item.approvalDate).toLocaleDateString()})</span>}
                            {item.approvalComment && <p className="text-xs mt-1 italic">"{item.approvalComment}"</p>}
                          </div>
                        )}

                        {/* Attachments summary in workflow context */}
                        {attachments.length > 0 && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <FileText size={11} /> {attachments.length} file{attachments.length > 1 ? 's' : ''} attached:
                            {attachments.map(a => <span key={a.id} className="ml-1 text-blue-600">{a.name}</span>)}
                          </div>
                        )}

                        {/* Audit trail */}
                        {itemLogs.length > 0 && (
                          <details className="text-xs">
                            <summary className="text-gray-400 cursor-pointer hover:text-gray-600">Workflow History ({itemLogs.length})</summary>
                            <div className="mt-1 space-y-1 pl-2 border-l-2 border-gray-200">
                              {itemLogs.map(log => (
                                <div key={log.id} className="text-gray-500">
                                  <span className="font-medium" style={{color: (WORKFLOW_STATES[log.action] || {}).color || "#6b7280"}}>
                                    {(WORKFLOW_STATES[log.action] || {}).label || log.action}
                                  </span>
                                  {log.detail && <span> — {log.detail}</span>}
                                  <span className="text-gray-300 ml-1">{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}

            {/* Add Item button at bottom */}
            <button onClick={addItem}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center gap-2">
              <Plus size={16} /> Add Agenda Item
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Preview / Generate View ── */
  if (view === "preview" && activeMeeting) {
    const html = generateAgendaHTML();
    const printAgenda = () => {
      const w = window.open("", "_blank");
      w.document.write(`<!DOCTYPE html><html><head><title>${activeMeeting.title || "Agenda"}</title></head><body>${html}</body></html>`);
      w.document.close();
      w.print();
    };

    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView("editor")}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight size={18} className="rotate-180" /></button>
            <h3 className="text-lg font-bold text-gray-900">Agenda Preview</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={printAgenda}
              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700">
              <Download size={15} /> Print / Save PDF
            </button>
            <button onClick={() => setView("editor")}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
              Back to Editor
            </button>
          </div>
        </div>

        {/* Rendered Agenda */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    );
  }

  return null;
}

const VC_EVALUATION = {
  year: "FY2024-25", status: "In Progress",
  timeline: [
    { date: "01 May 2025", title: "VC self-assessment submitted", detail: "15-page self-evaluation against agreed KPIs", status: "done" },
    { date: "15 May 2025", title: "Committee input gathered", detail: "Anonymous survey — 10/12 responses received", status: "done" },
    { date: "01 Jul 2025", title: "Dean & senior officer survey", detail: "Faculty Senate input also pending. Due: 15 Jul 2025", status: "current" },
    { date: "30 Jul 2025", title: "HR Committee deliberation & draft assessment", detail: "", status: "future" },
    { date: "18 Aug 2025", title: "Board Chair feedback session with VC", detail: "Confidential", status: "future" },
    { date: "18 Aug 2025", title: "Full board approves evaluation & consequences", detail: "", status: "future" },
  ],
  scorecard: [
    { domain: "Strategic Leadership", weight: "25%", boardRating: 4.0, vcSelf: 4.2, weighted: 1.00 },
    { domain: "Academic Excellence", weight: "25%", boardRating: 3.0, vcSelf: 3.5, weighted: 0.75 },
    { domain: "Financial Stewardship", weight: "20%", boardRating: 4.0, vcSelf: 3.8, weighted: 0.80 },
    { domain: "Institutional Culture", weight: "15%", boardRating: 3.5, vcSelf: 4.0, weighted: 0.53 },
    { domain: "External Relations", weight: "15%", boardRating: 5.0, vcSelf: 4.5, weighted: 0.75 },
  ],
};

const SELF_ASSESSMENT_SECTIONS = {
  strategy: [
    "The board approved and regularly reviews a written strategic plan",
    "Board meetings are dominated by strategy and performance, not operational approvals",
    "The board provides constructive challenge to management on strategic assumptions",
    "Board decisions are visibly aligned to the institutional mission and long-term goals",
  ],
  meeting: [
    "Board papers are high quality, forward-looking, and contain clear recommendations",
    "Meetings start and end on time with a well-structured agenda",
    "All members contribute meaningfully — not dominated by one or two voices",
    "The board chair manages time effectively and ensures strategic focus",
    "The action tracker is reviewed at every meeting",
  ],
  independence: [
    "A majority of board members are genuinely independent — free of conflicts of interest",
    "Conflicts of interest are declared and managed transparently",
    "Political or external pressure on board decisions is appropriately resisted",
    "Board members do not operate as proxies for the parties that appointed them",
  ],
  vcRelationship: [
    "The board has a formal, documented annual evaluation process for the VC",
    "The board–VC relationship is trusting but maintains appropriate challenge",
    "The board does not micromanage — it holds the VC accountable for outcomes, not methods",
    "The VC receives clear and consistent messages from the board as a whole",
  ],
  culture: [
    "Dissenting views are heard and respected, not suppressed",
    "Board members come fully prepared to every meeting",
    "The board holds itself to the same standards it applies to management",
    "The board culture is one of constructive challenge, not rubber-stamping",
    "The board is committed to its own renewal and succession planning",
  ],
};

const GUARDRAIL_CHECKS = [
  { text: "Board met required frequency this quarter", done: true },
  { text: "Board pack circulated ≥7 days before meeting", done: true },
  { text: "No board member has contacted staff directly without VC routing", done: false },
  { text: "All board members' COI declarations are current", done: false },
  { text: "Board agenda was ≥60% strategic content", done: true },
  { text: "All committee reports received before board meeting", done: false },
  { text: "Action tracker reviewed at last meeting", done: true },
  { text: "No item below delegation threshold on board agenda", done: true },
  { text: "Board self-assessment scheduled for current year", done: true },
  { text: "Minutes of last meeting issued within 7 days", done: true },
];

const MICROMANAGEMENT_LOG = [
  { date: "14 May 25", issue: "Board member contacted Dean of Engineering directly about faculty posting", resolution: "Under review" },
  { date: "20 Mar 25", issue: "Board agenda included approval of 3 individual staff leave applications", resolution: "Redirected to Syndicate" },
  { date: "27 Feb 25", issue: "Individual member issued media statement without board chair authorisation", resolution: "Member reminded of protocol" },
];

const DECISION_RIGHTS_MATRIX = [
  { type: "Strategic plan (5-year)", board: "Approve", committee: "Draft/recommend", syndicate: "—", vc: "Prepare", management: "—" },
  { type: "Annual budget", board: "Approve", committee: "Finance reviews", syndicate: "Recommend", vc: "Prepare", management: "—" },
  { type: "VC appointment", board: "Recommend to Chancellor", committee: "HR shortlists", syndicate: "—", vc: "—", management: "—" },
  { type: "VC annual evaluation", board: "Approve", committee: "HR prepares", syndicate: "—", vc: "Self-assess", management: "—" },
  { type: "Capex > PKR 30M", board: "Approve", committee: "Finance reviews", syndicate: "Recommend", vc: "—", management: "—" },
  { type: "Capex PKR 5–30M", board: "—", committee: "—", syndicate: "Approve", vc: "Recommend", management: "—" },
  { type: "Capex < PKR 5M", board: "—", committee: "—", syndicate: "—", vc: "Approve", management: "Execute" },
  { type: "Faculty appointment (professor)", board: "—", committee: "—", syndicate: "Approve", vc: "Recommend", management: "—" },
  { type: "Curriculum change", board: "—", committee: "Academic reviews", syndicate: "—", vc: "—", management: "Academic Council" },
  { type: "Board policy (new/revised)", board: "Approve", committee: "Recommend", syndicate: "—", vc: "—", management: "—" },
  { type: "External audit appointment", board: "Approve", committee: "Finance recommends", syndicate: "—", vc: "—", management: "—" },
];

/* ══════════════════════════════════════════════════════════
   SECTION 4 — ORGANOGRAM (Initial/Default structure)
   ══════════════════════════════════════════════════════════ */
const NODE_TYPES = [
  { value: "governance", label: "Governance", color: "#6b7280" },
  { value: "executive", label: "Executive", color: "#1e40af" },
  { value: "academic", label: "Academic", color: "#7c3aed" },
  { value: "admin", label: "Administrative", color: "#0891b2" },
  { value: "research", label: "Research", color: "#9333ea" },
  { value: "independent", label: "Independent", color: "#d97706" },
];

const DATA_SCOPE_OPTIONS = [
  { value: "institutional", label: "Institutional — Full university view" },
  { value: "academic-stream", label: "Academic Stream — All academic offices" },
  { value: "operations-stream", label: "Operations Stream — Admin offices" },
  { value: "research-stream", label: "Research Stream — Research offices" },
  { value: "faculty", label: "Faculty — Single faculty view" },
  { value: "department", label: "Department — Single department view" },
];

const DEFAULT_ORG = {
  id:"board", label:"Board of Governors / Senate", type:"governance",
  children:[{
    id:"vc", label:"Vice Chancellor", type:"executive",
    children:[
      { id:"iqae", label:"IQAE / Quality Assurance", type:"independent" },
      { id:"fundraising", label:"Advancement & Fundraising", type:"independent" },
      { id:"provost", label:"Provost", type:"executive", children:[
        { id:"dean-eng", label:"Dean — Engineering", type:"academic", children:[
          { id:"hod-cs", label:"HoD Computer Science", type:"academic", children:[] },
          { id:"hod-ee", label:"HoD Electrical Engineering", type:"academic", children:[] },
          { id:"hod-me", label:"HoD Mechanical Engineering", type:"academic", children:[] },
          { id:"hod-ce", label:"HoD Civil Engineering", type:"academic", children:[] },
        ]},
        { id:"dean-sci", label:"Dean — Sciences", type:"academic", children:[
          { id:"hod-math", label:"HoD Mathematics", type:"academic", children:[] },
          { id:"hod-phy", label:"HoD Physics", type:"academic", children:[] },
          { id:"hod-chem", label:"HoD Chemistry", type:"academic", children:[] },
        ]},
        { id:"dean-mgmt", label:"Dean — Management Sciences", type:"academic", children:[
          { id:"hod-bba", label:"HoD Business Administration", type:"academic", children:[] },
          { id:"hod-eco", label:"HoD Economics", type:"academic", children:[] },
          { id:"hod-acc", label:"HoD Accounting & Finance", type:"academic", children:[] },
        ]},
        { id:"dean-ss", label:"Dean — Social Sciences", type:"academic", children:[
          { id:"hod-psy", label:"HoD Psychology", type:"academic", children:[] },
          { id:"hod-ir", label:"HoD International Relations", type:"academic", children:[] },
          { id:"hod-edu", label:"HoD Education", type:"academic", children:[] },
        ]},
        { id:"registrar", label:"Registrar", type:"academic" },
        { id:"controller", label:"Controller of Exams", type:"academic" },
        { id:"ctl", label:"Centre for Teaching & Learning", type:"academic" },
        { id:"studentAffairs", label:"Student Affairs", type:"academic" },
      ]},
      { id:"vpOps", label:"VP Operations", type:"executive", children:[
        { id:"finance", label:"Director of Finance", type:"admin" },
        { id:"hr", label:"Human Resources", type:"admin" },
        { id:"it", label:"IT Services", type:"admin" },
        { id:"facilities", label:"Facilities & Estate", type:"admin" },
        { id:"dssAdmin", label:"DSS Administrator", type:"system" },
      ]},
      { id:"vpResearch", label:"VP Research & Innovation", type:"executive", children:[
        { id:"oric", label:"ORIC", type:"research" },
        { id:"gradAffairs", label:"Graduate Affairs", type:"research" },
        { id:"industryLiaison", label:"Industry Liaison & TTO", type:"research" },
      ]},
    ]
  }]
};

/* ══════════════════════════════════════════════════════════
   SECTION 5 — ROLE DEFINITIONS (16 offices)
   ══════════════════════════════════════════════════════════ */
const ROLES = {
  vc:{ label:"Vice Chancellor",icon:Building2,color:"#1e40af",subtitle:"Strategic Leadership & Institutional Health",tier:"Executive",reportsTo:"Board of Governors",coordinates:["Provost","VP Operations","VP Research","IQAE","Fundraising"] },
  provost:{ label:"Provost",icon:GraduationCap,color:"#7c3aed",subtitle:"Academic Governance & Academic Council",tier:"Executive",reportsTo:"Vice Chancellor",coordinates:["Deans","Registrar","Controller","CTL","Student Affairs"] },
  vpOps:{ label:"VP Operations",icon:Settings,color:"#0891b2",subtitle:"Administrative & Resource Management",tier:"Executive",reportsTo:"Vice Chancellor",coordinates:["Finance","HR","IT","Facilities"] },
  vpResearch:{ label:"VP Research & Innovation",icon:Beaker,color:"#9333ea",subtitle:"Research Strategy & Graduate Education",tier:"Executive",reportsTo:"Vice Chancellor",coordinates:["ORIC","Graduate Affairs","Industry Liaison","Deans"] },
  dean:{ label:"Dean",icon:BookOpen,color:"#db2777",subtitle:"Faculty-level Academic & Research Oversight",tier:"Academic",reportsTo:"Provost",coordinates:["HoDs","Registrar","Controller","QA"] },
  hod:{ label:"Head of Department",icon:Users,color:"#e11d48",subtitle:"Department Teaching, Research & Operations",tier:"Academic",reportsTo:"Dean",coordinates:["Faculty","Labs","Registrar","Students"] },
  registrar:{ label:"Registrar",icon:ClipboardCheck,color:"#059669",subtitle:"Student Records, Enrollment & Compliance",tier:"Academic",reportsTo:"Provost",coordinates:["HoDs","Controller","Finance","IT"] },
  controller:{ label:"Controller of Examinations",icon:FileText,color:"#d97706",subtitle:"Examination Management & Results",tier:"Academic",reportsTo:"Provost",coordinates:["HoDs","Registrar","IT","QA"] },
  finance:{ label:"Director of Finance",icon:DollarSign,color:"#0d9488",subtitle:"Budgets, Cash Flow & Financial Compliance",tier:"Admin",reportsTo:"VP Operations",coordinates:["All cost centres","Registrar","HR"] },
  iqae:{ label:"IQAE / Quality Assurance",icon:Shield,color:"#0ea5e9",subtitle:"PSG-2023 Compliance & Programme Review",tier:"Independent",reportsTo:"Vice Chancellor (direct)",coordinates:["All Deans","HoDs","Registrar","HEC QAA"] },
  oric:{ label:"ORIC",icon:Globe,color:"#7c3aed",subtitle:"Research Grants, Publications & Commercialisation",tier:"Research",reportsTo:"VP Research",coordinates:["Faculty researchers","Finance","Industry partners"] },
  gradAffairs:{ label:"Graduate Affairs",icon:Award,color:"#a855f7",subtitle:"MS/PhD Supervision, Thesis & HEC Compliance",tier:"Research",reportsTo:"VP Research",coordinates:["Supervisors","HEC portal","External examiners"] },
  studentAffairs:{ label:"Student Affairs",icon:Heart,color:"#f43f5e",subtitle:"Student Welfare, Housing & Counseling",tier:"Academic",reportsTo:"Provost",coordinates:["Counselors","Hostel wardens","Student societies"] },
  hr:{ label:"Human Resources",icon:UserCheck,color:"#6366f1",subtitle:"Recruitment, Payroll & Faculty Development",tier:"Admin",reportsTo:"VP Operations",coordinates:["All departments","Finance","Deans"] },
  it:{ label:"IT Services",icon:Monitor,color:"#4f46e5",subtitle:"Systems, LMS & Digital Infrastructure",tier:"Admin",reportsTo:"VP Operations",coordinates:["All offices","Registrar","Controller"] },
  fundraising:{ label:"Advancement & Fundraising",icon:Briefcase,color:"#b45309",subtitle:"Donor Relations, Alumni & Endowments",tier:"Independent",reportsTo:"Vice Chancellor",coordinates:["Alumni network","Industry","VC Office"] },
  dssAdmin:{ label:"DSS Administrator",icon:Cpu,color:"#475569",subtitle:"System Configuration, Workflow Administration & User Management",tier:"System",reportsTo:"VP Operations",coordinates:["All Offices","IT Services","All Role Owners"] },
};

/* ══════════════════════════════════════════════════════════
   SECTION 1.6 — DEAN TO DEPARTMENTS MAPPING
   Maps dean roleKey to their faculty departments
   ══════════════════════════════════════════════════════════ */
const DEAN_DEPARTMENTS = {
  "dean-eng": {
    label: "Dean of Engineering",
    faculty: "eng",
    departments: ["cs", "ee", "me", "ce"]
  },
  "dean-sci": {
    label: "Dean of Sciences",
    faculty: "sci",
    departments: ["math", "phy", "chem"]
  },
  "dean-mgmt": {
    label: "Dean of Management Sciences",
    faculty: "mgmt",
    departments: ["bba", "eco", "acc"]
  },
  "dean-ss": {
    label: "Dean of Social Sciences",
    faculty: "ss",
    departments: ["psy", "ir", "edu"]
  }
};

/* ══════════════════════════════════════════════════════════
   SECTION 6 — WORKSPACE DATA (Decisions, KPIs, Alerts, Playbook)
   ══════════════════════════════════════════════════════════ */
const WS = {
  vc:{
    decisions:[
      { id:"D-VC-01",title:"Approve new AI/Data Science programme launch",priority:"high",status:"pending",deadline:"Apr 15",from:"Provost",impact:"Strategic — aligns with Vision 2030",recommended:"Approve with condition: secure 3 PhD faculty before Fall 2027" },
      { id:"D-VC-02",title:"Emergency lab procurement escalation (PKR 8.2M)",priority:"critical",status:"escalated",deadline:"Apr 2",from:"VP Operations",impact:"Blocks semester preparation for 3 departments",recommended:"Authorize emergency procurement bypass" },
      { id:"D-VC-03",title:"International MoU with University of Manchester",priority:"medium",status:"inProgress",deadline:"May 1",from:"VP Research",impact:"Joint PhD supervision opportunity",recommended:"Proceed — legal review complete" },
      { id:"D-VC-04",title:"PSG-2023 institutional self-assessment submission",priority:"high",status:"pending",deadline:"Jun 30",from:"IQAE",impact:"Affects accreditation category",recommended:"Schedule Board briefing for May 15" },
    ],
    kpis:[
      {name:"QS Asia Ranking",value:"#187",target:"Top 150",trend:"up",delta:"+12 positions"},
      {name:"HEC Category",value:"W4",target:"Maintain",trend:"stable",delta:"Compliant"},
      {name:"Enrollment",value:"5,240",target:"5,500",trend:"up",delta:"+6.2%"},
      {name:"Research Papers",value:"720",target:"800",trend:"up",delta:"+10.8%"},
      {name:"Budget Utilization",value:"73.8%",target:"85%",trend:"stable",delta:"On track"},
      {name:"Employment Rate",value:"91%",target:"95%",trend:"up",delta:"+2.1%"},
    ],
    alerts:[
      {type:"critical",title:"Faculty shortage in 3 departments",message:"CS, EE, Chemistry above HEC threshold. 14 positions unfilled.",action:"Review HR pipeline"},
      {type:"warning",title:"PSG-2023 Q2 deadline approaching",message:"4 departments have not submitted programme SAR. Due Jun 30.",action:"Escalate to Deans"},
      {type:"success",title:"Research grants at record high",message:"PKR 285M active — highest in history. 12 new proposals in pipeline.",action:"Acknowledge ORIC"},
    ],
    playbook:[
      {title:"Annual Strategic Review",description:"Assess 5-year plan progress. Compare KPIs with peers. Identify strategic gaps.",trigger:"Every March",policy:"University Statute §12"},
      {title:"HEC Compliance Calendar",description:"Track all HEC deadlines: PSG-2023, annual returns, accreditation renewals.",trigger:"Rolling",policy:"PSG-2023, GEP-2023"},
    ],
  },
  provost:{
    decisions:[
      {id:"D-PR-01",title:"Approve consolidated timetable for Fall 2026",priority:"high",status:"pending",deadline:"Jun 15",from:"Timetable Office",impact:"Blocks enrollment if delayed",recommended:"Awaiting 2 Dean sign-offs"},
      {id:"D-PR-02",title:"Academic Council agenda: 6 curriculum revisions",priority:"medium",status:"inProgress",deadline:"Apr 25",from:"Deans",impact:"Affects Fall 2026 offerings",recommended:"Schedule meeting Apr 22"},
      {id:"D-PR-03",title:"Faculty workload rebalancing (Engineering)",priority:"high",status:"pending",deadline:"Apr 10",from:"Dean Engineering",impact:"3 courses understaffed",recommended:"Approve visiting faculty for 2 courses"},
    ],
    kpis:[
      {name:"Programmes",value:"78",target:"82",trend:"up",delta:"+4 proposals"},
      {name:"Teaching Rating",value:"4.1/5",target:"4.3",trend:"up",delta:"+0.2"},
      {name:"Curriculum Currency",value:"65%",target:"85%",trend:"up",delta:"35% need update"},
      {name:"PhD Ratio",value:"72%",target:"80%",trend:"up",delta:"+3%"},
      {name:"Retention",value:"94.1%",target:"95%",trend:"up",delta:"+0.9%"},
    ],
    alerts:[
      {type:"warning",title:"Academic Council meeting overdue",message:"Last meeting 45 days ago. PSG-2023 requires quarterly meetings.",action:"Set date"},
      {type:"critical",title:"2 accreditations expiring Aug 2026",message:"BBA and MSc Physics. Self-assessment not yet started.",action:"Alert Deans"},
    ],
    playbook:[
      {title:"Programme Quality Review",description:"PREE cycle per programme: curriculum, OBE, assessment, outcomes.",trigger:"Annual rotation",policy:"PSG-2023 PREE"},
    ],
  },
  vpOps:{
    decisions:[
      {id:"D-VP-01",title:"Emergency procurement: Chemistry lab equipment",priority:"critical",status:"escalated",deadline:"Mar 30",from:"Labs Coordinator",impact:"Blocks lab readiness",recommended:"Fast-track single-source exception"},
      {id:"D-VP-02",title:"LMS cloud migration approval",priority:"medium",status:"inProgress",deadline:"Jul 2026",from:"IT Services",impact:"Uptime 96% → 99.5%",recommended:"Proceed — ROI positive in 18 months"},
      {id:"D-VP-03",title:"Hostel Block C renovation (PKR 45M)",priority:"high",status:"pending",deadline:"Apr 20",from:"Facilities",impact:"320 beds offline",recommended:"Phase over summer break"},
    ],
    kpis:[
      {name:"HR Fill Rate",value:"92%",target:"98%",trend:"up",delta:"48 vacancies"},
      {name:"Facilities Uptime",value:"94.2%",target:"98%",trend:"stable",delta:"3 buildings maintenance"},
      {name:"IT Availability",value:"96.8%",target:"99%",trend:"up",delta:"+1.2%"},
      {name:"Cash Flow",value:"PKR 1.1B",target:"1.2B",trend:"stable",delta:"On target"},
      {name:"Capital Projects",value:"4 active",target:"On schedule",trend:"stable",delta:"1 delayed"},
    ],
    alerts:[
      {type:"critical",title:"3 procurement orders delayed > 6 weeks",message:"Chemistry reagents, EE oscilloscopes, server racks. Supply chain issues.",action:"Escalate to VC"},
      {type:"info",title:"Solar Phase 1 complete",message:"Block A: 40kW. Annual savings: PKR 4.8M. Phase 2 tender pending.",action:"View report"},
    ],
    playbook:[
      {title:"Rolling Cash Flow Forecast",description:"12-month rolling forecast. >5% variance triggers review. >10% requires approval.",trigger:"Monthly",policy:"Financial Regulations §14"},
    ],
  },
  vpResearch:{
    decisions:[
      {id:"D-VR-01",title:"Shortlist NRPU Round 12 proposals (8 submissions)",priority:"high",status:"pending",deadline:"May 5",from:"ORIC",impact:"Potential PKR 120M funding",recommended:"Approve 6 of 8 — 2 need revision"},
      {id:"D-VR-02",title:"PhD extensions: 12 students at max registration",priority:"medium",status:"inProgress",deadline:"Apr 15",from:"Graduate Affairs",impact:"HEC compliance",recommended:"Approve 8, refer 4 to committee"},
    ],
    kpis:[
      {name:"Active Grants",value:"PKR 285M",target:"350M",trend:"up",delta:"+18%"},
      {name:"Publications",value:"720",target:"800",trend:"up",delta:"+10.8%"},
      {name:"PhD Students",value:"245",target:"300",trend:"up",delta:"+28 new"},
      {name:"Patents",value:"12",target:"20",trend:"up",delta:"+5 this year"},
      {name:"MoUs Active",value:"18",target:"25",trend:"up",delta:"+4 new"},
    ],
    alerts:[
      {type:"warning",title:"18 PhD students near max registration",message:"HEC 8-year limit. 18 within 6 months of deadline.",action:"Review cases"},
      {type:"success",title:"3 patents granted this quarter",message:"CS (2) and Chemistry (1). Technology transfer evaluating.",action:"View portfolio"},
    ],
    playbook:[
      {title:"Grant Pipeline Management",description:"Track: opportunity → proposal → review → award → execution → reporting → closure.",trigger:"Per grant",policy:"ORIC Charter §4"},
    ],
  },
  dean:{
    decisions:[
      {id:"D-DN-01",title:"Approve instructor assignments for 5 departments",priority:"high",status:"inProgress",deadline:"Apr 5",from:"HoDs",impact:"Blocks timetable",recommended:"3 approved, 2 pending — CS/EE conflicts"},
      {id:"D-DN-02",title:"New electives: AI Ethics, Quantum Computing",priority:"medium",status:"pending",deadline:"Apr 20",from:"HoD CS",impact:"Enriches programme",recommended:"Approve AI Ethics, defer Quantum (no faculty)"},
    ],
    kpis:[
      {name:"Faculty",value:"420",target:"460",trend:"up",delta:"40 vacancies"},
      {name:"Student:Faculty",value:"1:19",target:"1:18",trend:"stable",delta:"Slightly above"},
      {name:"Research",value:"480 papers",target:"550",trend:"up",delta:"+8%"},
      {name:"Satisfaction",value:"4.1/5",target:"4.3",trend:"up",delta:"+0.15"},
      {name:"Accreditation",value:"6/8 current",target:"8/8",trend:"stable",delta:"2 due"},
    ],
    alerts:[
      {type:"critical",title:"CS faculty ratio: 1:28",message:"Above HEC 1:18. 3 on sabbatical, 2 unfilled.",action:"Emergency hiring"},
      {type:"warning",title:"2 accreditations due Aug 2026",message:"BBA and MSc Physics documentation must begin now.",action:"Assign teams"},
    ],
    playbook:[
      {title:"Programme Review Cycle",description:"Annual: enrollment, satisfaction, industry relevance, OBE alignment.",trigger:"Annual",policy:"PSG-2023 PREE"},
    ],
  },
  hod:{
    decisions:[
      {id:"D-HD-01",title:"Assign instructors to 18 course sections",priority:"high",status:"inProgress",deadline:"Apr 3",from:"Planning",impact:"Prerequisite for timetable",recommended:"Flag Dr. Ahmad at 16hrs (above limit)"},
      {id:"D-HD-02",title:"Student complaint: assessment fairness CS-401",priority:"high",status:"pending",deadline:"Apr 1",from:"Student Affairs",impact:"14 students filed complaints",recommended:"Form 3-member review committee"},
    ],
    kpis:[
      {name:"Courses",value:"42",target:"All staffed",trend:"stable",delta:"2 need instructors"},
      {name:"Workload",value:"Avg 12.4 hrs",target:"Max 15",trend:"stable",delta:"3 above limit"},
      {name:"Lab Readiness",value:"78%",target:"100%",trend:"up",delta:"2 labs pending"},
      {name:"Satisfaction",value:"4.2/5",target:"4.3",trend:"up",delta:"+0.1"},
      {name:"Pass Rate",value:"94.2%",target:"95%",trend:"stable",delta:"CS-302 flagged"},
    ],
    alerts:[
      {type:"warning",title:"Dr. Ahmad at 16 hrs/week",message:"Above 15-hour max. Research time compromised.",action:"Reassign section"},
      {type:"critical",title:"Lab equipment not delivered",message:"Oscilloscopes and analyzers. Raised to VP Ops.",action:"Track status"},
    ],
    playbook:[
      {title:"Course File Management",description:"Every course: syllabus, OBE mapping, assessment blueprint, prev exams, feedback.",trigger:"Each semester",policy:"PSG-2023"},
    ],
  },
  registrar:{
    decisions:[
      {id:"D-RG-01",title:"Open enrollment portal for Fall 2026",priority:"high",status:"pending",deadline:"Jun 20",from:"APCE",impact:"5,200+ students",recommended:"Contingent on timetable + fees + IT readiness"},
      {id:"D-RG-02",title:"Degree audit: 412 students for June graduation",priority:"high",status:"pending",deadline:"May 1",from:"Calendar",impact:"Graduation planning depends on list",recommended:"Start automated audit, flag exceptions"},
    ],
    kpis:[
      {name:"Enrollments",value:"5,240",target:"5,500",trend:"up",delta:"+6.2%"},
      {name:"Graduation Rate",value:"89.2%",target:"92%",trend:"up",delta:"+1.4%"},
      {name:"Transcript Time",value:"2.1 days",target:"2 days",trend:"down",delta:"Near target"},
      {name:"Data Accuracy",value:"99.2%",target:"99.5%",trend:"up",delta:"+0.3%"},
    ],
    alerts:[
      {type:"warning",title:"142 incomplete registrations",message:"Late reg closes Apr 5. Financial (89), academic (32), system (21) holds.",action:"Send reminders"},
      {type:"success",title:"Fall 2026: 1,120 confirmed",message:"Conversion 26.7% from 4,200 applications. On target.",action:"View pipeline"},
    ],
    playbook:[
      {title:"Enrollment Forecasting",description:"5-year history + admissions to project course enrollment. Feed to HoDs for sections.",trigger:"W-16",policy:"Academic Regulations §5"},
    ],
  },
  controller:{
    decisions:[
      {id:"D-CE-01",title:"Approve mid-term exam schedule",priority:"high",status:"inProgress",deadline:"Mar 28",from:"Timetable",impact:"8,400 students, 248 exams",recommended:"2 room conflicts on Apr 8, swap ME to Block C"},
      {id:"D-CE-02",title:"Grade moderation: 3 courses flagged",priority:"high",status:"pending",deadline:"Apr 5",from:"Analysis",impact:"Abnormal distributions",recommended:"Convene board for CS-302, EE-215, BA-401"},
    ],
    kpis:[
      {name:"Exams Scheduled",value:"248",target:"Conflict-free",trend:"stable",delta:"2 conflicts"},
      {name:"Results Published",value:"75%",target:"100%",trend:"up",delta:"186/248"},
      {name:"Result Time",value:"12.4 days",target:"10 days",trend:"down",delta:"-2.1 days"},
      {name:"Grievances",value:"23",target:"<10",trend:"down",delta:"8 pending"},
    ],
    alerts:[
      {type:"warning",title:"Room conflict: Apr 8-9",message:"CS and EE overlapping in Block A. 4 sessions need reassignment.",action:"Resolve"},
      {type:"critical",title:"3 courses flagged for grade anomaly",message:"CS-302 (42% D/F), EE-215 (95% A+/A), BA-401 bimodal.",action:"Convene board"},
    ],
    playbook:[
      {title:"Grade Anomaly Response",description:"Flag → moderation board in 5 days → review rubrics → interview instructor.",trigger:"Auto flag",policy:"Academic Integrity Policy"},
    ],
  },
  finance:{
    decisions:[
      {id:"D-FN-01",title:"Approve revised lab fee schedule for Board",priority:"high",status:"pending",deadline:"Apr 8",from:"VP Ops",impact:"Must publish before enrollment",recommended:"Increase lab 12% engineering, 8% sciences"},
      {id:"D-FN-02",title:"Release Q4 allocations to cost centres",priority:"high",status:"inProgress",deadline:"Apr 1",from:"Budget cycle",impact:"Departments awaiting funds",recommended:"Release 90%, hold 10% contingency"},
    ],
    kpis:[
      {name:"Budget",value:"PKR 4.2B",target:"FY 2025-26",trend:"stable",delta:"Approved"},
      {name:"Utilized",value:"73.8%",target:"85%",trend:"up",delta:"On track"},
      {name:"Outstanding Fees",value:"PKR 185M",target:"<100M",trend:"down",delta:"Recovering"},
      {name:"Cash Reserve",value:"PKR 320M",target:">250M",trend:"stable",delta:"Healthy"},
    ],
    alerts:[
      {type:"critical",title:"Fee finalization blocking enrollment",message:"Board approval for revised lab fees still pending.",action:"Escalate to VC"},
      {type:"warning",title:"Leave liability at 85% of budget",message:"PKR 42M accumulated. 42 faculty with >60 days.",action:"Model options"},
    ],
    playbook:[
      {title:"Budget Variance",description:">5% triggers review. >10% requires VP Ops approval.",trigger:"Monthly",policy:"Financial Regs §14"},
    ],
  },
  iqae:{
    decisions:[
      {id:"D-QA-01",title:"Release PSG-2023 performance report to VC",priority:"high",status:"inProgress",deadline:"Apr 15",from:"Self-assessment",impact:"Feeds Board briefing",recommended:"Ready — 2 depts need verification"},
      {id:"D-QA-02",title:"PREE schedule for 2026-27",priority:"medium",status:"pending",deadline:"May 1",from:"Annual cycle",impact:"8 programmes due",recommended:"Prioritize BBA, MSc Physics"},
    ],
    kpis:[
      {name:"SAR Status",value:"24/32",target:"32/32",trend:"up",delta:"8 pending"},
      {name:"PhD Ratio",value:"72%",target:"80%",trend:"up",delta:"+3%"},
      {name:"OBE Alignment",value:"68%",target:"100%",trend:"up",delta:"Improving"},
      {name:"Course File Compliance",value:"82%",target:"95%",trend:"up",delta:"+8%"},
    ],
    alerts:[
      {type:"critical",title:"8 depts missing programme SAR",message:"PSG-2023 annual requirement. Non-compliance affects accreditation.",action:"Direct alert to Deans"},
      {type:"warning",title:"OBE incomplete for 32% courses",message:"Core PSG-2023 requirement. CTL workshops scheduled.",action:"Coordinate CTL"},
    ],
    playbook:[
      {title:"PSG-2023 RIPE Cycle",description:"Institutional review: governance, planning, finance, quality culture.",trigger:"Annual",policy:"PSG-2023 RIPE"},
    ],
  },
  oric:{
    decisions:[
      {id:"D-OR-01",title:"Shortlist NRPU Round 12 proposals",priority:"high",status:"inProgress",deadline:"May 5",from:"Faculty",impact:"Max 10 university slots",recommended:"12 received — rank by impact score"},
    ],
    kpis:[
      {name:"Grants",value:"PKR 285M",target:"350M",trend:"up",delta:"+18%"},
      {name:"Scopus Papers",value:"720",target:"800",trend:"up",delta:"+10.8%"},
      {name:"H-index",value:"48",target:"55",trend:"up",delta:"+4"},
      {name:"Patents",value:"12",target:"20",trend:"up",delta:"+5"},
    ],
    alerts:[
      {type:"warning",title:"NRPU Round 12 deadline May 15",message:"12 proposals, 10 slots. Review committee must convene.",action:"Schedule review"},
      {type:"success",title:"Scopus indexing rate: 85%",message:"Up from 72%. Faculty training working.",action:"Continue"},
    ],
    playbook:[
      {title:"Grant Lifecycle",description:"Opportunity → proposal → review → award → execute → report → close.",trigger:"Per grant",policy:"ORIC Charter §4"},
    ],
  },
  gradAffairs:{
    decisions:[
      {id:"D-GA-01",title:"PhD extensions: 12 at max registration",priority:"high",status:"pending",deadline:"Apr 15",from:"Supervisors",impact:"HEC compliance — risk termination",recommended:"Approve 8 with milestones, refer 4"},
    ],
    kpis:[
      {name:"PhD Active",value:"245",target:"300",trend:"up",delta:"+28"},
      {name:"MS Active",value:"680",target:"750",trend:"up",delta:"+45"},
      {name:"Time-to-Degree",value:"5.2 yrs",target:"<5",trend:"down",delta:"Improving"},
      {name:"Supervisor Compliance",value:"88%",target:"100%",trend:"up",delta:"6 above limit"},
    ],
    alerts:[
      {type:"critical",title:"18 PhDs near max registration",message:"HEC 8-year limit. Urgent intervention for thesis completion.",action:"Notify supervisors"},
      {type:"warning",title:"6 supervisors above limit",message:"Max 8 students. These have 9-11 each.",action:"Redistribute"},
    ],
    playbook:[
      {title:"PhD Milestone Tracker",description:"Coursework → comprehensive → proposal → data → thesis → external → defence → HEC.",trigger:"Continuous",policy:"GEP-2023"},
    ],
  },
  studentAffairs:{
    decisions:[
      {id:"D-SA-01",title:"Expand counseling (2 additional counselors)",priority:"high",status:"pending",deadline:"Apr 20",from:"Mental health data",impact:"+22% anxiety visits",recommended:"Approve — PKR 4.8M/yr, critical for wellbeing"},
    ],
    kpis:[
      {name:"Complaints",value:"342",target:"<200",trend:"up",delta:"53 pending"},
      {name:"Counseling",value:"1,240 sessions",target:"Demand",trend:"up",delta:"+22%"},
      {name:"Hostel",value:"94.8%",target:"<95%",trend:"up",delta:"320 waitlist"},
      {name:"Financial Aid",value:"PKR 320M",target:"4,800 recipients",trend:"stable",delta:"On budget"},
    ],
    alerts:[
      {type:"critical",title:"Mental health demand spike",message:"+22% visits. Wait times 5+ days.",action:"Emergency resource request"},
      {type:"warning",title:"Housing waitlist: 320",message:"Demand exceeds capacity for Fall 2026.",action:"Off-campus partnerships"},
    ],
    playbook:[
      {title:"Wellbeing Response",description:"When demand >15%: activate peer support, extend hours, request temporary counselors.",trigger:"Threshold",policy:"Welfare Policy §3"},
    ],
  },
  hr:{
    decisions:[
      {id:"D-HR-01",title:"Fast-track 14 faculty positions",priority:"high",status:"inProgress",deadline:"Apr 30",from:"Deans",impact:"Critical faculty shortage",recommended:"Advertise 10 now, 4 need Finance clearance"},
    ],
    kpis:[
      {name:"Fill Rate",value:"92%",target:"98%",trend:"up",delta:"48 vacancies"},
      {name:"Hiring Time",value:"68 days",target:"45 days",trend:"down",delta:"Improving"},
      {name:"Retention",value:"94%",target:"97%",trend:"stable",delta:"6 resignations"},
    ],
    alerts:[
      {type:"warning",title:"14 vacancies unfilled > 90 days",message:"CS (4), EE (3), Chemistry (3), ME (2), Physics (2).",action:"Review bottlenecks"},
    ],
    playbook:[
      {title:"Recruitment Pipeline",description:"Vacancy → advertise → shortlist → interview → select → offer → onboard.",trigger:"Per vacancy",policy:"HR Policy"},
    ],
  },
  it:{
    decisions:[
      {id:"D-IT-01",title:"LMS cloud migration: vendor and timeline",priority:"high",status:"inProgress",deadline:"Apr 15",from:"VP Ops",impact:"Uptime 96% → 99.5%",recommended:"Azure — migrate during summer break"},
    ],
    kpis:[
      {name:"Uptime",value:"96.8%",target:"99%",trend:"up",delta:"+1.2%"},
      {name:"LMS Users",value:"4,820",target:"5,000",trend:"up",delta:"92% adoption"},
      {name:"Tickets",value:"124",target:"<50",trend:"down",delta:"-30%"},
      {name:"Security",value:"B+",target:"A",trend:"up",delta:"MFA at 78%"},
    ],
    alerts:[
      {type:"warning",title:"LMS downtime: 3.2% this month",message:"Two unscheduled outages. Root cause: DB connection pool.",action:"Patch deployed"},
    ],
    playbook:[
      {title:"Pre-Semester IT Readiness",description:"Verify LMS, portal, catalogs, payments, help desk.",trigger:"W-12",policy:"IT Service Policy"},
    ],
  },
  fundraising:{
    decisions:[
      {id:"D-FR-01",title:"Launch annual campaign: target PKR 150M",priority:"medium",status:"pending",deadline:"May 1",from:"Annual plan",impact:"Endowment + scholarships",recommended:"Focus 50 major donors + alumni platform"},
    ],
    kpis:[
      {name:"Annual Giving",value:"PKR 82M",target:"150M",trend:"up",delta:"+15%"},
      {name:"Endowment",value:"PKR 620M",target:"1B by 2030",trend:"up",delta:"+8%"},
      {name:"Alumni Engagement",value:"12%",target:"25%",trend:"up",delta:"+3%"},
    ],
    alerts:[
      {type:"info",title:"Alumni homecoming May 15",message:"400+ expected. 12 major donor meetings. VC keynote confirmed.",action:"Finalize agenda"},
    ],
    playbook:[
      {title:"Donor Lifecycle",description:"Identify → cultivate → solicit → steward. Annual recognition events.",trigger:"Continuous",policy:"Advancement Policy"},
    ],
  },
  dssAdmin:{
    decisions:[
      {id:"D-DA-01",title:"Configure new Sports Week 2026 workflow and assign to positions",priority:"high",status:"pending",deadline:"Apr 5",from:"Student Affairs",impact:"22-task workflow across 5 offices",recommended:"Create from Event template, assign to Student Affairs, HoDs, Finance"},
      {id:"D-DA-02",title:"Review ETL failure alerts — LMS connector timeout",priority:"critical",status:"escalated",deadline:"Apr 1",from:"System",impact:"Attendance data stale for 6 hours",recommended:"Coordinate with IT Services for LMS API rate-limit increase"},
      {id:"D-DA-03",title:"Provision new role workspaces for 4 recently-hired faculty members",priority:"medium",status:"pending",deadline:"Apr 8",from:"HR",impact:"Faculty need DSS access for report submissions",recommended:"Auto-provision from Odoo HR sync, verify role mappings"},
    ],
    kpis:[
      {name:"Active Workflows",value:"6",target:"—",trend:"stable",delta:"4 active, 1 planning, 1 upcoming"},
      {name:"ETL Health",value:"98.2%",target:"99.5%",trend:"down",delta:"-1.3% (LMS connector)"},
      {name:"Active Users",value:"142",target:"—",trend:"up",delta:"+8 this month"},
      {name:"Pending Reports",value:"23",target:"0",trend:"down",delta:"Faculty submissions due Apr 5"},
      {name:"System Uptime",value:"99.7%",target:"99.9%",trend:"stable",delta:"12ms avg response"},
      {name:"Workflow Tasks Completed",value:"187",target:"—",trend:"up",delta:"+34 this week"},
    ],
    alerts:[
      {type:"critical",title:"LMS ETL connector: 2 consecutive failures",message:"Moodle REST API returning 429 (rate limit). Last successful sync 6 hours ago. Attendance data affected.",action:"Coordinate with IT Services"},
      {type:"warning",title:"23 faculty reports overdue",message:"Submission deadline was Mar 28. 23 of 96 faculty members have not submitted monthly reports.",action:"Send reminder via HoDs"},
      {type:"info",title:"Convocation 2026 workflow ready for activation",message:"24-task workflow template created. Awaiting Registrar confirmation to activate for Sep 1 start.",action:"Activate when confirmed"},
    ],
    playbook:[
      {title:"Workflow Creation & Assignment",description:"Create workflow from template or scratch. Define tasks, phases, offices. Assign to role positions. Monitor progress across all assigned positions.",trigger:"On demand",policy:"DSS Operations Manual §3"},
      {title:"ETL Health Monitoring",description:"Monitor all ETL jobs. Respond to failures within 30 minutes. Escalate persistent failures (3+ runs) to IT Services and VP Operations.",trigger:"Continuous",policy:"DSS SLA §2.1"},
      {title:"Role Provisioning",description:"New faculty/staff auto-provisioned from Odoo HR sync. Verify role-workspace mapping. Manual override available for special roles (Dean, HoD assignments).",trigger:"On HR sync event",policy:"DSS Operations Manual §5"},
      {title:"Workflow Template Library",description:"Maintain reusable workflow templates (APCE, Event, Conference, Accreditation, HR Campaign, Custom). Version-controlled. Reviewed annually.",trigger:"Annual review",policy:"DSS Operations Manual §3.4"},
    ],
  },
};

/* ══════════════════════════════════════════════════════════
   SECTION 7 — ACADEMIC PROCESS CALENDAR ENGINE (APCE)
   Hierarchical: Department → Faculty → Registrar (Institutional)
   Each department runs its own 30-task semester preparation.
   Faculty Deans see aggregated progress across their departments.
   Registrar sees all faculties aggregated institutionally.
   ══════════════════════════════════════════════════════════ */
const SEMESTER_START = "2026-08-24";
const CURRENT_WEEK = -12;

const PHASES = [
  {id:"planning",name:"Academic Planning",weeks:"W-18 to W-14",color:"#3b82f6"},
  {id:"scheduling",name:"Resource & Scheduling",weeks:"W-14 to W-10",color:"#8b5cf6"},
  {id:"timetable",name:"Timetable Construction",weeks:"W-10 to W-7",color:"#10b981"},
  {id:"enrollment",name:"Student Enrollment",weeks:"W-7 to W-4",color:"#f59e0b"},
  {id:"readiness",name:"Final Readiness",weeks:"W-4 to W-1",color:"#ef4444"},
  {id:"launch",name:"Semester Launch",weeks:"W-1 to W0",color:"#06b6d4"},
];

/* Task template — each department gets a copy with varied progress */
const TASK_TEMPLATE = [
  {id:"T01",name:"Review programme offerings",phase:"planning",owner:"HoD",week:-18},
  {id:"T02",name:"Identify courses per programme",phase:"planning",owner:"HoD",week:-17},
  {id:"T03",name:"Lab resource planning",phase:"planning",owner:"HoD",week:-16},
  {id:"T04",name:"Enrollment demand forecasting",phase:"planning",owner:"HoD",week:-16},
  {id:"T05",name:"Faculty availability audit",phase:"planning",owner:"HoD",week:-15},
  {id:"T06",name:"Instructor capability review",phase:"planning",owner:"HoD",week:-15},
  {id:"T07",name:"Assign instructors to sections",phase:"scheduling",owner:"HoD",week:-15},
  {id:"T08",name:"Facilities room capacity check",phase:"scheduling",owner:"HoD",week:-14},
  {id:"T09",name:"Lab equipment readiness",phase:"scheduling",owner:"HoD",week:-13},
  {id:"T10",name:"Fee finalization for enrollment",phase:"scheduling",owner:"Finance Liaison",week:-13},
  {id:"T11",name:"IT systems and LMS readiness",phase:"scheduling",owner:"IT Liaison",week:-12},
  {id:"T12",name:"Coordinate room/lab constraints",phase:"timetable",owner:"HoD",week:-11},
  {id:"T13",name:"Finalize fee schedule & publish",phase:"timetable",owner:"Finance Liaison",week:-10},
  {id:"T14",name:"Payment gateway activation",phase:"timetable",owner:"IT Liaison",week:-9},
  {id:"T15",name:"Build department timetable",phase:"timetable",owner:"HoD",week:-10},
  {id:"T16",name:"Timetable review & conflict resolution",phase:"timetable",owner:"HoD",week:-8},
  {id:"T17",name:"Submit timetable to Registrar",phase:"enrollment",owner:"HoD",week:-7},
  {id:"T18",name:"Course materials & syllabi ready",phase:"enrollment",owner:"HoD",week:-7},
  {id:"T19",name:"Enrollment readiness confirmation",phase:"enrollment",owner:"HoD",week:-7},
  {id:"T20",name:"Monitor section enrollment",phase:"enrollment",owner:"HoD",week:-6},
  {id:"T21",name:"Support academic helpdesk",phase:"enrollment",owner:"IT Liaison",week:-5},
  {id:"T22",name:"Lab induction & safety checks",phase:"readiness",owner:"HoD",week:-4},
  {id:"T23",name:"Instructor orientation & materials",phase:"readiness",owner:"HoD",week:-3},
  {id:"T24",name:"Final enrollment report",phase:"readiness",owner:"HoD",week:-3},
  {id:"T25",name:"Section adjustments (add/drop)",phase:"readiness",owner:"HoD",week:-2},
  {id:"T26",name:"Procure any final supplies",phase:"readiness",owner:"HoD",week:-2},
  {id:"T27",name:"Go-live readiness: all systems",phase:"launch",owner:"IT Liaison",week:-1},
  {id:"T28",name:"HoD semester readiness sign-off",phase:"launch",owner:"HoD",week:-1},
  {id:"T29",name:"Opening day class walkthrough",phase:"launch",owner:"HoD",week:0},
  {id:"T30",name:"First-week monitoring & support",phase:"launch",owner:"HoD",week:1},
];

/* University hierarchy for APCE */
const UNIVERSITY_FACULTIES = [
  { id: "eng", name: "Faculty of Engineering", dean: "Prof. Ahmed Khan", color: "#3b82f6",
    departments: [
      { id: "cs", name: "Computer Science", hod: "Dr. Sara Malik", students: 420, courses: 42 },
      { id: "ee", name: "Electrical Engineering", hod: "Dr. Usman Raza", students: 380, courses: 38 },
      { id: "me", name: "Mechanical Engineering", hod: "Dr. Fatima Noor", students: 310, courses: 32 },
      { id: "ce", name: "Civil Engineering", hod: "Dr. Ali Hassan", students: 290, courses: 28 },
    ]},
  { id: "sci", name: "Faculty of Sciences", dean: "Prof. Amina Bibi", color: "#8b5cf6",
    departments: [
      { id: "math", name: "Mathematics", hod: "Dr. Khalid Shah", students: 180, courses: 22 },
      { id: "phy", name: "Physics", hod: "Dr. Nadia Qureshi", students: 160, courses: 20 },
      { id: "chem", name: "Chemistry", hod: "Dr. Bilal Farooq", students: 150, courses: 18 },
    ]},
  { id: "mgmt", name: "Faculty of Management Sciences", dean: "Prof. Zain Ul Abideen", color: "#10b981",
    departments: [
      { id: "bba", name: "Business Administration", hod: "Dr. Hira Javed", students: 520, courses: 35 },
      { id: "eco", name: "Economics", hod: "Dr. Tariq Mehmood", students: 210, courses: 18 },
      { id: "acc", name: "Accounting & Finance", hod: "Dr. Saba Iqbal", students: 280, courses: 22 },
    ]},
  { id: "ss", name: "Faculty of Social Sciences", dean: "Prof. Rabia Aslam", color: "#f59e0b",
    departments: [
      { id: "psy", name: "Psychology", hod: "Dr. Imran Yusuf", students: 190, courses: 16 },
      { id: "ir", name: "International Relations", hod: "Dr. Ayesha Siddiqui", students: 170, courses: 14 },
      { id: "edu", name: "Education", hod: "Dr. Naveed Akhtar", students: 220, courses: 20 },
    ]},
];

/* Generate department-specific task instances with realistic varied progress */
const generateDeptTasks = (deptId, deptName, progressSeed) => {
  return TASK_TEMPLATE.map((t, i) => {
    let status;
    const threshold = progressSeed + (Math.sin(i * 3.7 + progressSeed * 2.1) * 2);
    if (t.week < CURRENT_WEEK - 4) status = "completed";
    else if (t.week < CURRENT_WEEK - 1 && threshold > 3) status = "completed";
    else if (t.week < CURRENT_WEEK && threshold > 1) status = "onTrack";
    else if (t.week === CURRENT_WEEK && threshold < 2) status = "atRisk";
    else if (t.week > CURRENT_WEEK + 3) status = "upcoming";
    else status = "pending";
    /* Override specific known trouble spots per department seed */
    if (deptId === "cs" && t.id === "T09") status = "atRisk";
    if (deptId === "ee" && t.id === "T07") status = "atRisk";
    if (deptId === "chem" && t.id === "T09") status = "overdue";
    if (deptId === "bba" && t.id === "T15") status = "atRisk";
    return {
      ...t,
      id: `${deptId}-${t.id}`,
      deptId,
      deptName,
      status,
      owner: t.owner === "HoD" ? `HoD ${deptName}` : t.owner,
    };
  });
};

/* Build all department task instances */
const ALL_DEPT_TASKS = {};
const DEPT_LOOKUP = {};
UNIVERSITY_FACULTIES.forEach((fac, fi) => {
  fac.departments.forEach((dept, di) => {
    const seed = fi * 4 + di * 1.7 + 2;
    ALL_DEPT_TASKS[dept.id] = generateDeptTasks(dept.id, dept.name, seed);
    DEPT_LOOKUP[dept.id] = { ...dept, facultyId: fac.id, facultyName: fac.name };
  });
});

/* Legacy flat TASKS array for backward compatibility */
const TASKS = ALL_DEPT_TASKS["cs"] || [];

/* ══════════════════════════════════════════════════════════
   SECTION 8 — ARCHITECTURE LAYERS (inc. API Gateway)
   ══════════════════════════════════════════════════════════ */
const ARCH_LAYERS = [
  {
    id: "A",
    name: "Role-Based Workspaces",
    color: "#3b82f6",
    items: ["VC", "Provost", "Deans", "HoDs", "Registrar", "Finance", "VP Ops", "IQAE", "ORIC", "HR", "IT"]
  },
  {
    id: "B",
    name: "Decision Intelligence",
    color: "#8b5cf6",
    items: ["Decision Queue", "Escalation Engine", "Coordination Network", "KPI Dashboards", "Alert System"]
  },
  {
    id: "C",
    name: "Operational Workflow Engine",
    color: "#10b981",
    items: ["APCE (Semester Prep)", "Event Management", "Research Conference", "Accreditation Review", "HR Campaigns", "Custom Workflows", "Task Automation", "Cascade Analysis"]
  },
  {
    id: "D",
    name: "Data Intelligence",
    color: "#f59e0b",
    items: ["Real-time KPI Computation", "Anomaly Detection", "Predictive Models", "Analytics Engine"]
  },
  {
    id: "E",
    name: "Data Orchestration",
    color: "#ef4444",
    items: ["PeopleSoft Sync", "Finance System", "HR Integration", "Quality Systems", "Research DB"]
  },
  {
    id: "F",
    name: "API Gateway & Configuration",
    color: "#06b6d4",
    items: ["REST API v1", "OAuth 2.0", "JSON Config Registry", "Webhook Engine", "Rate Limiting"]
  }
];

/* ══════════════════════════════════════════════════════════
   HELPER COMPONENTS & UTILITIES
   ══════════════════════════════════════════════════════════ */

const formatTime = (isoString) => {
  try {
    const d = new Date(isoString);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  } catch {
    return 'N/A';
  }
};

const formatDate = (isoString) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'N/A';
  }
};

/* ══════════════════════════════════════════════════════════
   SUBMISSION WORKSPACE — SLICE 3 (Proposer Submission)
   Implements Stage 2 of the seven-stage workflow:
   - Submission form with category, background, issue, proposed resolution
   - Prerequisite enforcement: academic items need AC resolution ID
   - DRAFT → SUBMITTED state transition with validation
   ══════════════════════════════════════════════════════════ */

const SUBMISSION_CATEGORIES = {
  academic:   { label: "Academic", color: "#3b82f6", icon: "🎓", prereq: "Academic Council (AC) resolution required" },
  financial:  { label: "Financial", color: "#ef4444", icon: "💰", prereq: "Finance & Planning Committee (F&PC) resolution required" },
  hr:         { label: "HR / Personnel", color: "#ec4899", icon: "👤", prereq: "ASRB resolution required" },
  governance: { label: "Governance", color: "#6b7280", icon: "🏛️", prereq: null },
  other:      { label: "Other", color: "#9ca3af", icon: "📋", prereq: null },
};

function SubmissionWorkspace() {
  const [submissions, setSubmissions] = useState([]);
  const [openMeetings, setOpenMeetings] = useState([]);
  const [resolutions, setResolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prereqMessage, setPrereqMessage] = useState(null);
  const [prereqValid, setPrereqValid] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [form, setForm] = useState({
    meetingCalendarId: "",
    title: "",
    category: "",
    background: "",
    issueForConsideration: "",
    proposedResolution: "",
    proposedBy: "Vice Chancellor",
    feederResolutionRef: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/board/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.items || []);
        setOpenMeetings(data.openMeetings || []);
        setResolutions(data.resolutions || []);
      }
    } catch (e) {
      console.error("Failed to fetch submissions:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setForm({ meetingCalendarId: "", title: "", category: "", background: "", issueForConsideration: "", proposedResolution: "", proposedBy: "Vice Chancellor", feederResolutionRef: "" });
    setPrereqMessage(null);
    setPrereqValid(null);
  };

  const handleCategoryChange = (cat) => {
    setForm(p => ({ ...p, category: cat, feederResolutionRef: "" }));
    const prereq = SUBMISSION_CATEGORIES[cat]?.prereq;
    if (prereq) {
      setPrereqMessage(prereq);
      setPrereqValid(null);
    } else {
      setPrereqMessage(null);
      setPrereqValid(true);
    }
  };

  const submitProposal = async (asDraft = false) => {
    if (!form.meetingCalendarId || !form.title || !form.category) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/board/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setPrereqMessage(data.prerequisite?.message || null);
        setPrereqValid(data.prerequisite?.valid ?? true);
        setShowForm(false);
        resetForm();
        await fetchData();
      } else {
        setPrereqMessage(data.error || "Submission failed");
        setPrereqValid(false);
      }
    } catch (e) {
      console.error("Failed to submit:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDraft = async (itemId) => {
    try {
      const res = await fetch("/api/board/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, action: "submit" }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchData();
      } else {
        alert(data.prerequisite?.message || data.error || "Cannot submit — prerequisites not met");
      }
    } catch (e) {
      console.error("Failed to submit draft:", e);
    }
  };

  const withdrawItem = async (itemId) => {
    try {
      await fetch("/api/board/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, action: "withdraw" }),
      });
      await fetchData();
    } catch (e) {
      console.error("Failed to withdraw:", e);
    }
  };

  const parseDesc = (desc) => {
    try { return JSON.parse(desc || "{}"); } catch { return {}; }
  };

  const draftItems = submissions.filter(s => s.status === "DRAFT");
  const submittedItems = submissions.filter(s => s.status === "SUBMITTED");
  const otherItems = submissions.filter(s => !["DRAFT", "SUBMITTED"].includes(s.status));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="w-6 h-6 text-blue-600" />
            Proposal Submission Workspace
          </h2>
          <p className="text-sm text-gray-500 mt-1">Submit proposals for Syndicate consideration. Academic, financial, and HR items require feeder-body resolution clearance.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
          <Plus className="w-4 h-4" /> New Proposal
        </button>
      </div>

      {/* Submission Form */}
      {showForm && (
        <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Submit New Proposal</h3>

          {/* Meeting Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Meeting *</label>
            {openMeetings.length > 0 ? (
              <select value={form.meetingCalendarId} onChange={e => setForm(p => ({...p, meetingCalendarId: e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select a meeting...</option>
                {openMeetings.map(m => (
                  <option key={m.id} value={m.id}>{m.title || `Meeting #${m.meetingNumber}`} — {new Date(m.meetingDate).toLocaleDateString()}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                No meetings currently accepting submissions. Schedule a meeting in the Calendar tab first.
              </div>
            )}
          </div>

          {/* Title and Category */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Title *</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
                placeholder="e.g. Approval of revised fee structure for MSc programmes" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(SUBMISSION_CATEGORIES).map(([key, cat]) => (
                  <button key={key} onClick={() => handleCategoryChange(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${form.category === key ? "border-2" : "border-gray-200 hover:border-gray-300"}`}
                    style={form.category === key ? { backgroundColor: cat.color + "15", borderColor: cat.color, color: cat.color } : {}}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prerequisite Warning / Resolution Input */}
          {form.category && SUBMISSION_CATEGORIES[form.category]?.prereq && (
            <div className={`mb-4 p-4 rounded-lg border ${prereqValid === true ? "bg-green-50 border-green-200" : prereqValid === false ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${prereqValid === true ? "text-green-600" : prereqValid === false ? "text-red-600" : "text-amber-600"}`} />
                <div className="flex-1">
                  <div className={`text-sm font-medium ${prereqValid === true ? "text-green-800" : prereqValid === false ? "text-red-800" : "text-amber-800"}`}>
                    Prerequisite: {SUBMISSION_CATEGORIES[form.category].prereq}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Items in this category require prior clearance from the relevant feeder body. Enter the resolution number below. Without a valid reference, the item will be saved as DRAFT only.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <input type="text" value={form.feederResolutionRef} onChange={e => setForm(p => ({...p, feederResolutionRef: e.target.value}))}
                      placeholder="e.g. 42 (resolution number)" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  {prereqMessage && (
                    <div className={`text-xs mt-2 ${prereqValid ? "text-green-700" : "text-red-700"}`}>{prereqMessage}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Structured Fields */}
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
              <textarea value={form.background} onChange={e => setForm(p => ({...p, background: e.target.value}))}
                rows={3} placeholder="Provide context and history for this proposal..."
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue for Consideration</label>
              <textarea value={form.issueForConsideration} onChange={e => setForm(p => ({...p, issueForConsideration: e.target.value}))}
                rows={3} placeholder="What specific matter requires the Syndicate's attention?"
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Resolution</label>
              <textarea value={form.proposedResolution} onChange={e => setForm(p => ({...p, proposedResolution: e.target.value}))}
                rows={2} placeholder="What action is being proposed for the Syndicate to approve?"
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proposed By</label>
              <input type="text" value={form.proposedBy} onChange={e => setForm(p => ({...p, proposedBy: e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button onClick={() => submitProposal(false)} disabled={!form.meetingCalendarId || !form.title || !form.category || submitting}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm flex items-center gap-2">
              {submitting ? "Submitting..." : <><Send className="w-4 h-4" /> Submit Proposal</>}
            </button>
            <button onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">Cancel</button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            If prerequisites are not met, the item will be saved as DRAFT. You can add the resolution reference later and resubmit.
          </p>
        </div>
      )}

      {/* Draft Items */}
      {draftItems.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-500" />
            Drafts — Awaiting Prerequisites ({draftItems.length})
          </h3>
          <div className="space-y-3">
            {draftItems.map(item => {
              const desc = parseDesc(item.description);
              const cat = SUBMISSION_CATEGORIES[desc.category] || SUBMISSION_CATEGORIES.other;
              return (
                <div key={item.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: cat.color + "15", color: cat.color }}>{cat.label}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">DRAFT</span>
                      </div>
                      <div className="font-medium text-gray-900 mt-1">{item.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Proposed by {item.proposedBy} • For {item.meetingCalendar?.title || `Meeting #${item.meetingCalendar?.meetingNumber}`}
                      </div>
                      {desc.prerequisiteMessage && (
                        <div className="text-xs text-amber-700 mt-2 bg-amber-100 rounded p-2">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />{desc.prerequisiteMessage}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => submitDraft(item.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">Submit</button>
                      <button onClick={() => withdrawItem(item.id)} className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium hover:bg-gray-300">Withdraw</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submitted Items */}
      {submittedItems.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Submitted — In Registrar Queue ({submittedItems.length})
          </h3>
          <div className="space-y-3">
            {submittedItems.map(item => {
              const desc = parseDesc(item.description);
              const cat = SUBMISSION_CATEGORIES[desc.category] || SUBMISSION_CATEGORIES.other;
              return (
                <div key={item.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: cat.color + "15", color: cat.color }}>{cat.label}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">SUBMITTED</span>
                        {desc.prerequisiteStatus === "CLEARED" && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-600">Prerequisite Cleared</span>
                        )}
                      </div>
                      <div className="font-medium text-gray-900 mt-1">{item.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Proposed by {item.proposedBy} • Submitted {item.submittedDate ? new Date(item.submittedDate).toLocaleDateString() : ""} • For {item.meetingCalendar?.title || `Meeting #${item.meetingCalendar?.meetingNumber}`}
                      </div>
                    </div>
                    <button onClick={() => withdrawItem(item.id)} className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium hover:bg-gray-300">Withdraw</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Items (Vetted, Approved, etc.) */}
      {otherItems.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Other Items ({otherItems.length})</h3>
          <div className="space-y-2">
            {otherItems.map(item => {
              const desc = parseDesc(item.description);
              const cat = SUBMISSION_CATEGORIES[desc.category] || SUBMISSION_CATEGORIES.other;
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: cat.color + "15", color: cat.color }}>{cat.label}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600">{item.status}</span>
                    <span className="font-medium text-sm text-gray-900">{item.title}</span>
                    <span className="text-xs text-gray-400 ml-auto">{item.proposedBy}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && submissions.length === 0 && !showForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Send className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No proposals yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "New Proposal" to submit your first item for Syndicate consideration</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-500">Loading submissions...</div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MEETING CALENDAR MANAGER — SLICE 2 (APCE Integration)
   Creates meetings, auto-generates 10 APCE events with backward-derived
   deadlines, and dispatches notifications to relevant roles.
   ══════════════════════════════════════════════════════════ */

const APCE_STATUS_COLORS = {
  PENDING:   { bg: "#f3f4f6", text: "#6b7280", label: "Pending" },
  TRIGGERED: { bg: "#fef3c7", text: "#d97706", label: "Triggered" },
  COMPLETED: { bg: "#d1fae5", text: "#059669", label: "Completed" },
  SKIPPED:   { bg: "#fee2e2", text: "#dc2626", label: "Skipped" },
};

const MEETING_STATUS_LABELS = {
  DRAFT: "Draft", SCHEDULED: "Scheduled", CALL_ISSUED: "Call Issued",
  SUBMISSIONS_OPEN: "Submissions Open", SUBMISSIONS_CLOSED: "Submissions Closed",
  AGENDA_APPROVED: "Agenda Approved", PAPERS_CIRCULATED: "Papers Circulated",
  IN_SESSION: "In Session", CONCLUDED: "Concluded",
  MINUTES_DRAFTED: "Minutes Drafted", MINUTES_CONFIRMED: "Minutes Confirmed",
};

const MEETING_STATUS_COLORS = {
  DRAFT: "#9ca3af", SCHEDULED: "#3b82f6", CALL_ISSUED: "#8b5cf6",
  SUBMISSIONS_OPEN: "#10b981", SUBMISSIONS_CLOSED: "#f59e0b",
  AGENDA_APPROVED: "#06b6d4", PAPERS_CIRCULATED: "#6366f1",
  IN_SESSION: "#ef4444", CONCLUDED: "#10b981",
  MINUTES_DRAFTED: "#f97316", MINUTES_CONFIRMED: "#059669",
};

// ═══════════════════════════════════════════════════════════════════════════════
// Agenda Workflow — Wrapper housing all seven-stage sub-components
// Stages: Calendar → Submissions → Triage → VC Cockpit → Agenda Items
// ═══════════════════════════════════════════════════════════════════════════════
function AgendaWorkflow() {
  const [stage, setStage] = useState("calendar");

  const stages = [
    { id: "calendar", label: "1. Calendar & APCE", icon: Calendar, color: "#3b82f6" },
    { id: "submissions", label: "2. Submissions", icon: Send, color: "#8b5cf6" },
    { id: "triage", label: "3. Triage Queue", icon: Filter, color: "#f59e0b" },
    { id: "cockpit", label: "4. VC Cockpit", icon: Monitor, color: "#6366f1" },
    { id: "builder", label: "5. Agenda Items", icon: FileText, color: "#10b981" },
  ];

  return (
    <div className="w-full">
      {/* Workflow Stage Navigation */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="px-4 pt-3 pb-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {stages.map((s, idx) => {
              const Icon = s.icon;
              const isActive = stage === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStage(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? "border-current bg-white text-gray-800 shadow-sm"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  style={isActive ? { borderColor: s.color, color: s.color } : {}}
                >
                  <Icon className="w-4 h-4" />
                  {s.label}
                  {idx < stages.length - 1 && !isActive && (
                    <ChevronRight className="w-3 h-3 ml-1 text-gray-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage Content */}
      <div>
        {stage === "calendar" && <MeetingCalendarManager />}
        {stage === "submissions" && <SubmissionWorkspace />}
        {stage === "triage" && <RegistrarTriageQueue />}
        {stage === "cockpit" && <VCStrategicCockpit />}
        {stage === "builder" && <AgendaBuilderInteractive />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Slice 5: VC Strategic Cockpit & Draft Agenda Approval
// Per Section 2.4: VC's Approval of the Draft Agenda
// ═══════════════════════════════════════════════════════════════════════════════
function VCStrategicCockpit() {
  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState("");
  const [items, setItems] = useState([]);
  const [suggestedOrder, setSuggestedOrder] = useState([]);
  const [stats, setStats] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [actionNotes, setActionNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [customOrder, setCustomOrder] = useState([]);

  const fetchCockpit = useCallback(async () => {
    try {
      const params = selectedMeetingId ? `?meetingId=${selectedMeetingId}` : "";
      const res = await fetch(`/api/board/vc-cockpit${params}`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
        setItems(data.items || []);
        setSuggestedOrder(data.suggestedOrder || []);
        setStats(data.stats || null);
        setMeeting(data.meeting || null);
        setCustomOrder(data.items?.map(i => i.id) || []);
      }
    } catch (e) {
      console.error("Failed to fetch cockpit:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedMeetingId]);

  useEffect(() => { fetchCockpit(); }, [fetchCockpit]);

  const showToast = (msg, success = true) => {
    setToast({ message: msg, success });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAction = async (actionType, itemId, extra = {}) => {
    setProcessing(true);
    try {
      const payload = { action: actionType, id: itemId, notes: actionNotes, ...extra };
      const res = await fetch("/api/board/vc-cockpit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Item ${data.action || actionType} successfully`);
        setActionModal(null);
        setActionNotes("");
        fetchCockpit();
      } else {
        showToast(data.error || "Action failed", false);
      }
    } catch (e) {
      showToast("Network error", false);
    } finally {
      setProcessing(false);
    }
  };

  const approveFullAgenda = async () => {
    if (!selectedMeetingId) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/board/vc-cockpit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_agenda", meetingId: selectedMeetingId, notes: actionNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Agenda approved! ${data.itemsApproved} items approved for agenda.`);
        setActionModal(null);
        setActionNotes("");
        fetchCockpit();
      } else {
        showToast(data.error || "Failed to approve agenda", false);
      }
    } catch (e) {
      showToast("Network error", false);
    } finally {
      setProcessing(false);
    }
  };

  const saveReorder = async () => {
    if (!selectedMeetingId || customOrder.length === 0) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/board/vc-cockpit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", meetingId: selectedMeetingId, orderedIds: customOrder }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Agenda reordered (${data.count} items)`);
        fetchCockpit();
      } else {
        showToast(data.error, false);
      }
    } catch (e) {
      showToast("Network error", false);
    } finally {
      setProcessing(false);
    }
  };

  const moveItem = (fromIdx, direction) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= customOrder.length) return;
    const newOrder = [...customOrder];
    [newOrder[fromIdx], newOrder[toIdx]] = [newOrder[toIdx], newOrder[fromIdx]];
    setCustomOrder(newOrder);
  };

  const applySuggestedOrder = () => {
    setCustomOrder([...suggestedOrder]);
    showToast("Applied DSS suggested ordering");
  };

  const getSeverityColor = (s) => s === "high" ? "#ef4444" : s === "medium" ? "#f59e0b" : "#10b981";
  const getRiskBg = (l) => l === "high" ? "bg-red-50 border-red-200" : l === "medium" ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200";

  const displayItems = customOrder.map(id => items.find(i => i.id === id)).filter(Boolean);
  const vettedCount = items.filter(i => i.status === "VETTED").length;

  if (loading) return <div className="p-8 text-center text-gray-500">Loading VC Cockpit...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-600" /> VC Strategic Cockpit
          </h2>
          <p className="text-sm text-gray-500 mt-1">Review, prioritize, and approve the draft agenda</p>
        </div>
        {selectedMeetingId && vettedCount > 0 && (
          <button onClick={() => setActionModal({ type: "approve_agenda" })} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Approve Full Agenda ({vettedCount})
          </button>
        )}
      </div>

      {/* Meeting Selector */}
      <div className="bg-gray-50 rounded-lg p-3">
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" value={selectedMeetingId} onChange={e => { setSelectedMeetingId(e.target.value); setLoading(true); setExpandedItem(null); }}>
          <option value="">— Select a meeting —</option>
          {meetings.map(m => (
            <option key={m.id} value={m.id}>Meeting #{m.meetingNumber} — {m.title || new Date(m.meetingDate).toLocaleDateString()} ({m._count?.agendaItems || 0} items)</option>
          ))}
        </select>
      </div>

      {toast && (
        <div className={`p-3 rounded-lg text-sm font-medium ${toast.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{toast.message}</div>
      )}

      {!selectedMeetingId ? (
        <div className="text-center py-16 text-gray-400">
          <Monitor className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Select a meeting to view the draft agenda</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: "Total", value: stats.totalItems, color: "#3b82f6", icon: FileText },
                { label: "Vetted", value: stats.vetted, color: "#8b5cf6", icon: CheckCircle },
                { label: "Approved", value: stats.approved, color: "#10b981", icon: Award },
                { label: "Deferred", value: stats.deferred, color: "#f59e0b", icon: Clock },
                { label: "Financial", value: stats.financialFlags, color: "#ef4444", icon: DollarSign },
                { label: "Legal", value: stats.legalFlags, color: "#dc2626", icon: Scale },
                { label: "High Risk", value: stats.highRisk, color: "#b91c1c", icon: AlertTriangle },
                { label: "Completeness", value: `${stats.avgCompleteness}%`, color: stats.avgCompleteness >= 70 ? "#10b981" : "#f59e0b", icon: Target },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
                  <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming APCE Events */}
          {stats?.upcomingEvents?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-700 mb-1 flex items-center gap-1"><Clock className="w-4 h-4" /> Upcoming Deadlines</h4>
              <div className="flex gap-4 text-xs text-blue-600">{stats.upcomingEvents.map((ev, i) => (<span key={i}>{ev.name}: {new Date(ev.scheduledAt).toLocaleDateString()}</span>))}</div>
            </div>
          )}

          {/* Ordering Controls */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
            <span className="text-sm text-gray-600 font-medium">Agenda Order:</span>
            <button onClick={applySuggestedOrder} className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> DSS Suggested
            </button>
            <button onClick={saveReorder} disabled={processing} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
              <Save className="w-3 h-3" /> Save Order
            </button>
          </div>

          {/* Agenda Items */}
          <div className="space-y-3">
            {displayItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No vetted items for this meeting</p></div>
            ) : displayItems.map((item, idx) => {
              const isExpanded = expandedItem === item.id;
              return (
                <div key={item.id} className={`border rounded-lg overflow-hidden ${getRiskBg(item.riskLevel)}`}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Reorder */}
                      <div className="flex flex-col items-center gap-0.5 shrink-0 pt-1">
                        <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                        <span className="text-xs font-bold text-gray-500 w-6 text-center">{idx + 1}</span>
                        <button onClick={() => moveItem(idx, 1)} disabled={idx === displayItems.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">{item.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.status === "VETTED" ? "bg-purple-100 text-purple-700" : item.status === "APPROVED_FOR_AGENDA" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{item.status}</span>
                          {item.category && <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded">{item.category}</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">By {item.proposedBy} • Completeness: {item.completeness}%</div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {item.implications.map((imp, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: getSeverityColor(imp.severity), backgroundColor: `${getSeverityColor(imp.severity)}15` }}>{imp.label}</span>
                          ))}
                          {item.precedents?.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">{item.precedents.length} precedent(s)</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setExpandedItem(isExpanded ? null : item.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View details"><Eye className="w-4 h-4" /></button>
                        {item.status === "VETTED" && (
                          <>
                            <button onClick={() => handleAction("approve_item", item.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => setActionModal({ type: "defer", item })} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title="Defer"><Clock className="w-4 h-4" /></button>
                            <button onClick={() => setActionModal({ type: "return", item })} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Return"><ArrowDown className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-white p-4 space-y-3">
                      {item.background && <div><span className="text-xs font-semibold text-gray-500 uppercase">Background</span><p className="text-sm text-gray-700 mt-0.5">{item.background}</p></div>}
                      {item.issueForConsideration && <div><span className="text-xs font-semibold text-gray-500 uppercase">Issue for Consideration</span><p className="text-sm text-gray-700 mt-0.5">{item.issueForConsideration}</p></div>}
                      {item.proposedResolution && <div><span className="text-xs font-semibold text-gray-500 uppercase">Proposed Resolution</span><p className="text-sm text-gray-700 mt-0.5">{item.proposedResolution}</p></div>}
                      {item.feederTrail?.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">Feeder Body Trail</span>
                          {item.feederTrail.map((ft, i) => (<div key={i} className="text-sm text-gray-600 mt-0.5"><span className="font-medium">{ft.bodyCode}</span> Resolution #{ft.resolutionNumber}: {ft.text}</div>))}
                        </div>
                      )}
                      {item.precedents?.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">Precedent Decisions ({item.precedents.length})</span>
                          <div className="space-y-1 mt-1">
                            {item.precedents.map((p, i) => (
                              <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                                <span className="font-medium text-gray-700">{p.title}</span>
                                <span className="text-xs text-gray-400 ml-2">({p.similarity}% • Meeting #{p.meetingNumber} • {p.status})</span>
                                {p.outcome && <div className="text-xs text-green-600 mt-0.5">Outcome: {p.outcome.substring(0, 150)}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setActionModal(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {actionModal.type === "defer" && "Defer Item"}
              {actionModal.type === "return" && "Return to Proposer"}
              {actionModal.type === "approve_agenda" && "Approve Full Agenda"}
            </h3>
            {actionModal.item && <p className="text-sm text-gray-500 mb-4">"{actionModal.item.title}"</p>}
            {actionModal.type === "approve_agenda" && <p className="text-sm text-gray-600 mb-4">This will approve all {vettedCount} vetted items and update the meeting status to AGENDA_APPROVED.</p>}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{actionModal.type === "return" ? "Reason (required)" : "Notes (optional)"}</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder={actionModal.type === "return" ? "Explain why..." : "Notes..."} value={actionNotes} onChange={e => setActionNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setActionModal(null); setActionNotes(""); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button
                onClick={() => { if (actionModal.type === "approve_agenda") approveFullAgenda(); else handleAction(actionModal.type, actionModal.item?.id); }}
                disabled={processing || (actionModal.type === "return" && !actionNotes)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${actionModal.type === "approve_agenda" ? "bg-indigo-600 hover:bg-indigo-700" : actionModal.type === "defer" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-red-500 hover:bg-red-600"}`}
              >
                {processing ? "Processing..." : actionModal.type === "approve_agenda" ? "Approve Agenda" : actionModal.type === "defer" ? "Defer Item" : "Return Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Slice 4: Registrar Triage Queue with DSS Intelligence Scoring
// Per Section 2.3: Vetting and Consolidation
// ═══════════════════════════════════════════════════════════════════════════════
function RegistrarTriageQueue() {
  const [items, setItems] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [filterMeeting, setFilterMeeting] = useState("");
  const [showVetted, setShowVetted] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { type: "vet"|"return"|"route", item }
  const [actionNotes, setActionNotes] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [routeTo, setRouteTo] = useState("legal");
  const [processing, setProcessing] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  const fetchQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterMeeting) params.set("meetingId", filterMeeting);
      if (showVetted) params.set("includeVetted", "true");
      const res = await fetch(`/api/board/triage?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setMeetings(data.meetings || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error("Failed to fetch triage queue:", e);
    } finally {
      setLoading(false);
    }
  }, [filterMeeting, showVetted]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const fetchItemDossier = async (item) => {
    setSelectedItem(item);
    setLoadingDossier(true);
    try {
      const res = await fetch(`/api/board/triage?itemId=${item.id}`);
      if (res.ok) {
        const data = await res.json();
        setDossier(data.dossier);
      }
    } catch (e) {
      console.error("Failed to fetch dossier:", e);
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setProcessing(true);
    try {
      const payload = { id: actionModal.item.id, action: actionModal.type, notes: actionNotes };
      if (actionModal.type === "return") payload.returnReason = returnReason;
      if (actionModal.type === "route") payload.routeTo = routeTo;

      const res = await fetch("/api/board/triage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setActionResult({ success: true, message: `Item ${data.action} successfully.` });
        setActionModal(null);
        setActionNotes("");
        setReturnReason("");
        fetchQueue();
        if (selectedItem?.id === actionModal.item.id) {
          setSelectedItem(null);
          setDossier(null);
        }
      } else {
        setActionResult({ success: false, message: data.error || "Action failed" });
      }
    } catch (e) {
      setActionResult({ success: false, message: "Network error" });
    } finally {
      setProcessing(false);
      setTimeout(() => setActionResult(null), 4000);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity === "high") return "#ef4444";
    if (severity === "medium") return "#f59e0b";
    return "#6b7280";
  };

  const getCompletenessColor = (pct) => {
    if (pct >= 80) return "#10b981";
    if (pct >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getRiskBadge = (level) => {
    const colors = { high: "bg-red-100 text-red-700", medium: "bg-yellow-100 text-yellow-700", low: "bg-green-100 text-green-700" };
    return colors[level] || colors.low;
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading triage queue...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" /> Registrar Triage Queue
          </h2>
          <p className="text-sm text-gray-500 mt-1">Review submissions with DSS intelligence scoring</p>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "In Queue", value: stats.totalInQueue, color: "#3b82f6", icon: ClipboardCheck },
            { label: "Submitted", value: stats.submitted, color: "#8b5cf6", icon: Send },
            { label: "Vetted", value: stats.vetted, color: "#10b981", icon: CheckCircle },
            { label: "Returned", value: stats.returned, color: "#f59e0b", icon: ArrowDown },
            { label: "Financial", value: stats.flaggedFinancial, color: "#ef4444", icon: DollarSign },
            { label: "Legal", value: stats.flaggedLegal, color: "#dc2626", icon: Scale },
            { label: "Duplicates", value: stats.duplicateAlerts, color: "#f97316", icon: Copy },
            { label: "Avg Complete", value: `${stats.avgCompleteness}%`, color: stats.avgCompleteness >= 70 ? "#10b981" : "#f59e0b", icon: Target },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={filterMeeting}
          onChange={e => { setFilterMeeting(e.target.value); setLoading(true); }}
        >
          <option value="">All Meetings</option>
          {meetings.map(m => (
            <option key={m.id} value={m.id}>Meeting #{m.meetingNumber} — {m.title || new Date(m.meetingDate).toLocaleDateString()}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showVetted} onChange={e => { setShowVetted(e.target.checked); setLoading(true); }} className="rounded" />
          Include vetted items
        </label>
      </div>

      {/* Action Result Toast */}
      {actionResult && (
        <div className={`p-3 rounded-lg text-sm font-medium ${actionResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {actionResult.message}
        </div>
      )}

      {/* Main Content: Queue + Dossier Panel */}
      <div className="flex gap-4">
        {/* Queue List */}
        <div className={`${selectedItem ? "w-1/2" : "w-full"} space-y-3 transition-all`}>
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No items in triage queue</p>
              <p className="text-sm">Submitted items will appear here for review</p>
            </div>
          ) : items.map(item => {
            const d = item.dossier;
            let descData = {};
            try { descData = JSON.parse(item.description || "{}"); } catch {}

            return (
              <div
                key={item.id}
                onClick={() => fetchItemDossier(item)}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${selectedItem?.id === item.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 truncate">{item.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.status === "SUBMITTED" ? "bg-blue-100 text-blue-700" :
                        item.status === "VETTED" ? "bg-green-100 text-green-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>{item.status}</span>
                      {d?.riskLevel && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRiskBadge(d.riskLevel)}`}>
                          {d.riskLevel.toUpperCase()} RISK
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>#{item.itemNumber} • {item.proposedBy}</span>
                      {item.meetingCalendar && (
                        <span>Meeting #{item.meetingCalendar.meetingNumber}</span>
                      )}
                      {descData.category && (
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded">{descData.category}</span>
                      )}
                    </div>
                  </div>

                  {/* Quick flags */}
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    {d?.financialFlag && <DollarSign className="w-4 h-4 text-red-500" title="Financial implications" />}
                    {d?.legalFlag && <Scale className="w-4 h-4 text-red-600" title="Legal flag" />}
                    {d?.duplicateAlert && <Copy className="w-4 h-4 text-orange-500" title="Potential duplicate" />}
                  </div>
                </div>

                {/* Completeness bar */}
                {d?.completeness && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Completeness</span>
                      <span style={{ color: getCompletenessColor(d.completeness.percentage) }} className="font-medium">{d.completeness.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${d.completeness.percentage}%`, backgroundColor: getCompletenessColor(d.completeness.percentage) }} />
                    </div>
                  </div>
                )}

                {/* DSS Summary */}
                {d?.summary && d.summary !== "No issues detected." && (
                  <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />{d.summary}
                  </div>
                )}

                {/* Action buttons */}
                {item.status === "SUBMITTED" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setActionModal({ type: "vet", item }); }}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-3 h-3 inline mr-1" />Vet
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setActionModal({ type: "return", item }); }}
                      className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded-lg hover:bg-yellow-600"
                    >
                      <ArrowDown className="w-3 h-3 inline mr-1" />Return
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setActionModal({ type: "route", item }); }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                    >
                      <ArrowRight className="w-3 h-3 inline mr-1" />Route
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* DSS Dossier Panel */}
        {selectedItem && (
          <div className="w-1/2 border border-gray-200 rounded-lg bg-white overflow-y-auto max-h-[75vh]">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                DSS Intelligence Dossier
              </h3>
              <button onClick={() => { setSelectedItem(null); setDossier(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDossier ? (
              <div className="p-8 text-center text-gray-500">Analyzing submission...</div>
            ) : dossier ? (
              <div className="p-4 space-y-4">
                {/* Item Summary */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-semibold text-gray-800">{selectedItem.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span>By {selectedItem.proposedBy}</span>
                    <span>•</span>
                    <span>Item #{selectedItem.itemNumber}</span>
                  </div>
                </div>

                {/* Completeness Score */}
                <div className="border border-gray-200 rounded-lg p-3">
                  <h4 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" /> Completeness Score
                  </h4>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl font-bold" style={{ color: getCompletenessColor(dossier.completeness.percentage) }}>
                      {dossier.completeness.percentage}%
                    </div>
                    <div className="text-sm text-gray-500">
                      {dossier.completeness.score}/{dossier.completeness.maxScore} points
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full" style={{ width: `${dossier.completeness.percentage}%`, backgroundColor: getCompletenessColor(dossier.completeness.percentage) }} />
                  </div>
                  <div className="space-y-1">
                    {dossier.completeness.details.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className={d.present ? "text-green-600" : "text-red-500"}>
                          {d.present ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <AlertTriangle className="w-3 h-3 inline mr-1" />}
                          {d.label}
                        </span>
                        <span className="text-gray-400">{d.weight}pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Implications */}
                {dossier.implications.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Implications Detected
                    </h4>
                    <div className="space-y-2">
                      {dossier.implications.map((imp, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: `${getSeverityColor(imp.severity)}10` }}>
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: getSeverityColor(imp.severity) }} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">{imp.label}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ color: getSeverityColor(imp.severity), backgroundColor: `${getSeverityColor(imp.severity)}20` }}>
                                {imp.severity.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Matched terms: {imp.matchedTerms.join(", ")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duplicates */}
                {dossier.duplicates.length > 0 && (
                  <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                    <h4 className="font-semibold text-red-700 text-sm mb-2 flex items-center gap-2">
                      <Copy className="w-4 h-4" /> Potential Duplicates ({dossier.duplicates.length})
                    </h4>
                    {dossier.duplicates.map((dup, i) => (
                      <div key={i} className="bg-white rounded p-2 mb-1 text-sm border border-red-100">
                        <div className="font-medium text-gray-800">{dup.title}</div>
                        <div className="text-xs text-gray-500 flex gap-2">
                          <span>{dup.similarity}% similar</span>
                          <span>•</span>
                          <span>{dup.status}</span>
                          {dup.meeting && <span>• Meeting #{dup.meeting.meetingNumber}</span>}
                        </div>
                        {dup.outcome && <div className="text-xs text-green-600 mt-1">Outcome: {dup.outcome.substring(0, 100)}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Precedents */}
                {dossier.precedents.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-2">
                      <BookMarked className="w-4 h-4 text-purple-500" /> Related Precedents ({dossier.precedents.length})
                    </h4>
                    {dossier.precedents.slice(0, 5).map((prec, i) => (
                      <div key={i} className="p-2 mb-1 bg-gray-50 rounded text-sm">
                        <div className="font-medium text-gray-700">{prec.title}</div>
                        <div className="text-xs text-gray-500 flex gap-2">
                          <span>{prec.similarity}% related</span>
                          <span>•</span>
                          <span>{prec.status}</span>
                          {prec.meeting && <span>• Meeting #{prec.meeting.meetingNumber}</span>}
                        </div>
                        {prec.outcome && <div className="text-xs text-blue-600 mt-1">Decision: {prec.outcome.substring(0, 100)}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Risk Summary */}
                <div className={`rounded-lg p-3 ${getRiskBadge(dossier.riskLevel)} border`}>
                  <h4 className="font-semibold text-sm mb-1">Overall Risk Assessment: {dossier.riskLevel.toUpperCase()}</h4>
                  <p className="text-xs">{dossier.summary}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setActionModal(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {actionModal.type === "vet" && "Vet Item for Agenda"}
              {actionModal.type === "return" && "Return to Proposer"}
              {actionModal.type === "route" && "Route for Opinion"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">"{actionModal.item.title}"</p>

            {actionModal.type === "return" && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason (required)</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Explain why this item is being returned..."
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                />
              </div>
            )}

            {actionModal.type === "route" && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Route To</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={routeTo} onChange={e => setRouteTo(e.target.value)}>
                  <option value="legal">Legal Advisor</option>
                  <option value="treasurer">Treasurer</option>
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={2}
                placeholder="Additional notes..."
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => { setActionModal(null); setActionNotes(""); setReturnReason(""); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={processing || (actionModal.type === "return" && !returnReason)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                  actionModal.type === "vet" ? "bg-green-600 hover:bg-green-700" :
                  actionModal.type === "return" ? "bg-yellow-500 hover:bg-yellow-600" :
                  "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {processing ? "Processing..." :
                  actionModal.type === "vet" ? "Confirm Vet" :
                  actionModal.type === "return" ? "Return Item" :
                  "Route Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MeetingCalendarManager() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [newMeeting, setNewMeeting] = useState({ title: "", meetingDate: "", meetingLocation: "", onlineMeetingLink: "", quorum: "" });
  const [creating, setCreating] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch("/api/board/calendar?includeEvents=true");
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch (e) {
      console.error("Failed to fetch meetings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/board/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  }, []);

  useEffect(() => { fetchMeetings(); fetchNotifications(); }, [fetchMeetings, fetchNotifications]);

  const createMeeting = async () => {
    if (!newMeeting.meetingDate) return;
    setCreating(true);
    try {
      const res = await fetch("/api/board/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMeeting),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreate(false);
        setNewMeeting({ title: "", meetingDate: "", meetingLocation: "", onlineMeetingLink: "", quorum: "" });
        await fetchMeetings();
        await fetchNotifications();
        setSelectedMeeting(data.meeting.id);
      }
    } catch (e) {
      console.error("Failed to create meeting:", e);
    } finally {
      setCreating(false);
    }
  };

  const triggerAPCEEvent = async (eventId) => {
    try {
      await fetch("/api/board/apce-events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId, status: "TRIGGERED" }),
      });
      await fetchMeetings();
      await fetchNotifications();
    } catch (e) {
      console.error("Failed to trigger APCE event:", e);
    }
  };

  const completeAPCEEvent = async (eventId) => {
    try {
      await fetch("/api/board/apce-events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId, status: "COMPLETED" }),
      });
      await fetchMeetings();
    } catch (e) {
      console.error("Failed to complete APCE event:", e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/board/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true, role: "VICE_CHANCELLOR" }),
      });
      await fetchNotifications();
    } catch (e) {
      console.error("Failed to mark notifications read:", e);
    }
  };

  const activeMeeting = meetings.find(m => m.id === selectedMeeting);
  const now = new Date();

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const daysUntil = (d) => {
    if (!d) return null;
    const diff = Math.ceil((new Date(d).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Notification Bell */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Meeting Calendar & APCE Timeline
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage Syndicate meetings with auto-generated APCE workflow events</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-3 border-b border-gray-50 ${n.read ? "opacity-60" : "bg-blue-50"}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? "bg-gray-300" : "bg-blue-500"}`} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{n.title}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{n.message}</div>
                          <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> Schedule Meeting
          </button>
        </div>
      </div>

      {/* Create Meeting Form */}
      {showCreate && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-5">
          <h3 className="font-bold text-blue-900 text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Schedule New Syndicate Meeting
          </h3>
          <p className="text-sm text-blue-700 mb-4">Setting a meeting date will automatically generate all 10 APCE workflow events with backward-derived deadlines and notify relevant stakeholders.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
              <input type="text" value={newMeeting.title} onChange={e => setNewMeeting(p => ({...p, title: e.target.value}))}
                placeholder="e.g. 47th Meeting of the Syndicate" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Date *</label>
              <input type="date" value={newMeeting.meetingDate} onChange={e => setNewMeeting(p => ({...p, meetingDate: e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input type="text" value={newMeeting.meetingLocation} onChange={e => setNewMeeting(p => ({...p, meetingLocation: e.target.value}))}
                placeholder="e.g. Syndicate Hall, Admin Block" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Online Meeting Link</label>
              <input type="text" value={newMeeting.onlineMeetingLink} onChange={e => setNewMeeting(p => ({...p, onlineMeetingLink: e.target.value}))}
                placeholder="e.g. https://zoom.us/j/..." className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quorum</label>
              <input type="text" value={newMeeting.quorum} onChange={e => setNewMeeting(p => ({...p, quorum: e.target.value}))}
                placeholder="e.g. 7 of 13 members" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={createMeeting} disabled={!newMeeting.meetingDate || creating}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm flex items-center gap-2">
              {creating ? "Creating..." : <><Zap className="w-4 h-4" /> Create & Generate APCE Events</>}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Meeting List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No meetings scheduled yet</p>
            <p className="text-sm text-gray-400 mt-1">Schedule your first Syndicate meeting to generate APCE events</p>
          </div>
        ) : (
          meetings.map(meeting => {
            const isExpanded = selectedMeeting === meeting.id;
            const days = daysUntil(meeting.meetingDate);
            const statusColor = MEETING_STATUS_COLORS[meeting.status] || "#6b7280";
            const apceEvents = meeting.apceEvents || [];
            const completedEvents = apceEvents.filter(e => e.status === "COMPLETED").length;
            const triggeredEvents = apceEvents.filter(e => e.status === "TRIGGERED").length;

            return (
              <div key={meeting.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Meeting Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setSelectedMeeting(isExpanded ? null : meeting.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg flex flex-col items-center justify-center" style={{ backgroundColor: statusColor + "15", color: statusColor }}>
                        <span className="text-xs font-bold">{new Date(meeting.meetingDate).toLocaleDateString("en-US", { month: "short" })}</span>
                        <span className="text-lg font-black leading-tight">{new Date(meeting.meetingDate).getDate()}</span>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{meeting.title || `Meeting #${meeting.meetingNumber}`}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-3">
                          <span>{formatDate(meeting.meetingDate)}</span>
                          {meeting.meetingLocation && <span>• {meeting.meetingLocation}</span>}
                          {meeting.quorum && <span>• Quorum: {meeting.quorum}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* APCE Progress */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500">APCE Progress</div>
                        <div className="flex items-center gap-1 mt-1">
                          {apceEvents.map((ev, i) => (
                            <div key={i} className="w-3 h-3 rounded-full" title={`${ev.eventName}: ${ev.status}`}
                              style={{ backgroundColor: APCE_STATUS_COLORS[ev.status]?.text || "#9ca3af" }} />
                          ))}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{completedEvents}/{apceEvents.length} complete</div>
                      </div>
                      {/* Status Badge */}
                      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: statusColor + "15", color: statusColor }}>
                        {MEETING_STATUS_LABELS[meeting.status] || meeting.status}
                      </span>
                      {/* Days Badge */}
                      {days !== null && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${days > 0 ? "bg-blue-50 text-blue-700" : days === 0 ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {days > 0 ? `${days}d away` : days === 0 ? "Today" : `${Math.abs(days)}d ago`}
                        </span>
                      )}
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded: Deadlines + APCE Timeline */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {/* Key Deadlines Grid */}
                    <div className="p-4 bg-gray-50">
                      <h4 className="text-sm font-bold text-gray-700 mb-3">Key Deadlines (Auto-Computed from Meeting Date)</h4>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: "Call Notice", date: meeting.callNoticeAt, icon: Send },
                          { label: "Submission Cut-off", date: meeting.cutoffAt, icon: Clock },
                          { label: "VC Approval Due", date: meeting.vcApprovalDueAt, icon: UserCheck },
                          { label: "Circulation", date: meeting.circulationAt, icon: Send },
                          { label: "Query Close", date: meeting.queryCloseAt, icon: X },
                          { label: "Meeting Date", date: meeting.meetingDate, icon: Calendar },
                          { label: "Minutes Draft Due", date: meeting.minutesDraftDueAt, icon: FileText },
                          { label: "Minutes Confirm", date: meeting.minutesConfirmAt, icon: CheckCircle },
                        ].map((d, i) => {
                          const DeadlineIcon = d.icon;
                          const daysTo = daysUntil(d.date);
                          const isPast = daysTo !== null && daysTo < 0;
                          const isSoon = daysTo !== null && daysTo >= 0 && daysTo <= 3;
                          return (
                            <div key={i} className={`rounded-lg border p-3 ${isPast ? "bg-gray-100 border-gray-200" : isSoon ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <DeadlineIcon className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-600">{d.label}</span>
                              </div>
                              <div className={`text-sm font-bold ${isPast ? "text-gray-400" : isSoon ? "text-amber-700" : "text-gray-900"}`}>
                                {formatDate(d.date)}
                              </div>
                              {daysTo !== null && (
                                <div className={`text-xs mt-0.5 ${isPast ? "text-gray-400" : isSoon ? "text-amber-600" : "text-gray-500"}`}>
                                  {daysTo > 0 ? `in ${daysTo} days` : daysTo === 0 ? "Today" : `${Math.abs(daysTo)} days ago`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* APCE Timeline */}
                    <div className="p-4">
                      <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        APCE Event Timeline ({apceEvents.length} events)
                      </h4>
                      <div className="space-y-2">
                        {apceEvents.map((ev, idx) => {
                          const evDays = daysUntil(ev.scheduledAt);
                          const isPast = evDays !== null && evDays < 0;
                          const isToday = evDays === 0;
                          const statusStyle = APCE_STATUS_COLORS[ev.status];
                          return (
                            <div key={ev.id} className="flex items-center gap-3 group">
                              {/* Timeline connector */}
                              <div className="flex flex-col items-center w-6">
                                <div className={`w-3 h-3 rounded-full border-2 ${ev.status === "COMPLETED" ? "bg-green-500 border-green-500" : ev.status === "TRIGGERED" ? "bg-amber-500 border-amber-500" : isPast ? "bg-gray-300 border-gray-300" : "bg-white border-gray-300"}`} />
                                {idx < apceEvents.length - 1 && <div className="w-0.5 h-6 bg-gray-200" />}
                              </div>
                              {/* Event Card */}
                              <div className={`flex-1 flex items-center justify-between p-3 rounded-lg border ${ev.status === "COMPLETED" ? "bg-green-50 border-green-200" : ev.status === "TRIGGERED" ? "bg-amber-50 border-amber-200" : isToday ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100"}`}>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-gray-900">{ev.eventName}</span>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: statusStyle?.bg, color: statusStyle?.text }}>
                                      {statusStyle?.label}
                                    </span>
                                    {ev.offsetDays !== 0 && (
                                      <span className="text-xs text-gray-400">T{ev.offsetDays > 0 ? "+" : ""}{ev.offsetDays}d</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">{ev.description}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <div className="text-xs font-medium text-gray-700">{formatDate(ev.scheduledAt)}</div>
                                    {evDays !== null && (
                                      <div className={`text-xs ${evDays > 0 ? "text-blue-600" : evDays === 0 ? "text-green-600 font-bold" : "text-gray-400"}`}>
                                        {evDays > 0 ? `in ${evDays}d` : evDays === 0 ? "Today" : `${Math.abs(evDays)}d ago`}
                                      </div>
                                    )}
                                  </div>
                                  {/* Action buttons */}
                                  {ev.status === "PENDING" && (
                                    <button onClick={(e) => { e.stopPropagation(); triggerAPCEEvent(ev.id); }}
                                      className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200 transition">
                                      Trigger
                                    </button>
                                  )}
                                  {ev.status === "TRIGGERED" && (
                                    <button onClick={(e) => { e.stopPropagation(); completeAPCEEvent(ev.id); }}
                                      className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition">
                                      Complete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Meeting Stats */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-gray-600">{completedEvents} Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500" />
                          <span className="text-gray-600">{triggeredEvents} In Progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-300" />
                          <span className="text-gray-600">{apceEvents.length - completedEvents - triggeredEvents} Pending</span>
                        </div>
                        <div className="ml-auto text-xs text-gray-400">
                          Agenda Items: {meeting.agendaItems?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BOARD MANAGEMENT VIEW COMPONENT
   ══════════════════════════════════════════════════════════ */

function BoardManagementView() {
  const [boardTab, setBoardTab] = useState("dashboard");
  const [actionFilter, setActionFilter] = useState("all");
  const [kpiCategory, setKpiCategory] = useState("academic");
  const [selfAssessTab, setSelfAssessTab] = useState("strategy");
  const [selfScores, setSelfScores] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [govScheme, setGovScheme] = useState("A");
  const [packChecks, setPackChecks] = useState(BOARD_AGENDA_DEFAULT.packItems.map(p => p.done));
  const [guardrailChecks, setGuardrailChecks] = useState(GUARDRAIL_CHECKS.map(g => g.done));

  const scheme = GOVERNANCE_SCHEMES[govScheme];

  const getRAGColor = (rag) => {
    if (rag === "green") return "#10b981";
    if (rag === "amber") return "#f59e0b";
    if (rag === "red") return "#ef4444";
    return "#6b7280";
  };

  const getCategoryColor = (category) => {
    const colors = {
      strategic: "#7c3aed",
      financial: "#ef4444",
      academic: "#3b82f6",
      governance: "#6b7280",
      compliance: "#10b981",
    };
    return colors[category] || "#6b7280";
  };

  const boardSubTabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "agenda", label: "Agenda Builder", icon: FileText },
    { id: "actions", label: "Action Tracker", icon: ClipboardCheck },
    { id: "decisions", label: "Decision Register", icon: Briefcase },
    { id: "committees", label: "Committees", icon: Users },
    { id: "kpis", label: "Board KPIs", icon: TrendingUp },
    { id: "vceval", label: "VC Evaluation", icon: Award },
    { id: "selfassess", label: "Self-Assessment", icon: Shield },
    { id: "guardrails", label: "Guardrails", icon: AlertTriangle },
    { id: "orgchart", label: "Organogram", icon: FolderTree },
    { id: "governance", label: "Governance Config", icon: Settings },
  ];

  const filteredActions = actionFilter === "all" ? BOARD_ACTION_ITEMS : BOARD_ACTION_ITEMS.filter(a => a.status === actionFilter);

  return (
    <div className="w-full bg-white">
      {/* Board Sub-Tabs */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="p-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {boardSubTabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setBoardTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition text-sm font-medium ${
                  boardTab === tab.id
                    ? "bg-blue-100 text-blue-900 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <TabIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dashboard Sub-Tab */}
      {boardTab === "dashboard" && (
        <div className="p-6 space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Meetings Held</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">4/5</div>
              <div className="text-xs text-amber-600 mt-1">Q3 meeting pending</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Avg Attendance</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">78%</div>
              <div className="text-xs text-amber-600 mt-1">Target: ≥80%</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Open Actions</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">7</div>
              <div className="text-xs text-red-600 mt-1">4 overdue</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Strategic Time</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">62%</div>
              <div className="text-xs text-amber-600 mt-1">Target: ≥60%</div>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-bold text-red-900 mb-2">Overdue Items Alert</h3>
            <div className="text-sm text-red-800 space-y-1">
              <div>• A-01: VC performance contract draft (Due: 01 Jun 25)</div>
              <div>• A-02: Finance Committee TOR (Due: 15 Jun 25)</div>
              <div>• A-04: QEC self-assessment report (Due: 11 Aug 25)</div>
              <div>• A-06: COI register updates (Due: 01 Aug 25) — 77% complete</div>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Action Tracker Mini */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3">Recent Actions</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-600">ID</th>
                    <th className="text-left py-2 text-gray-600">Status</th>
                    <th className="text-left py-2 text-gray-600">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {BOARD_ACTION_ITEMS.slice(0, 5).map(a => (
                    <tr key={a.id} className="border-b border-gray-100">
                      <td className="py-2 font-mono text-xs">{a.id}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          a.status === "completed" ? "bg-green-100 text-green-700" :
                          a.status === "overdue" ? "bg-red-100 text-red-700" :
                          a.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${a.progress}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Meeting Calendar */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3">Upcoming Events</h3>
              <div className="space-y-2">
                {BOARD_CALENDAR_EVENTS.filter(e => e.status !== "completed").slice(0, 5).map((e, idx) => (
                  <div key={idx} className="flex gap-3 pb-2 border-b border-gray-100 last:border-0">
                    <div className="text-xs font-medium text-gray-500 w-16 flex-shrink-0">{e.date}</div>
                    <div className="flex-1 text-sm">
                      <div className="text-gray-900 font-medium">{e.event}</div>
                      <div className="text-xs text-gray-600">{e.responsible}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Tracker Sub-Tab */}
      {boardTab === "actions" && (
        <div className="p-6 space-y-4">
          <div className="flex gap-2 mb-4">
            {["all", "overdue", "open", "in_progress", "completed"].map(f => (
              <button
                key={f}
                onClick={() => setActionFilter(f)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  actionFilter === f
                    ? "bg-blue-100 text-blue-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Description</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Category</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Owner</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Due</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {filteredActions.map((a, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold">{a.id}</td>
                    <td className="px-4 py-3 text-gray-900">{a.desc.substring(0, 40)}...</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: getCategoryColor(a.category) + "20", color: getCategoryColor(a.category) }}>
                        {a.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{a.owner}</td>
                    <td className="px-4 py-3 text-gray-600">{a.due}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        a.status === "completed" ? "bg-green-100 text-green-700" :
                        a.status === "overdue" ? "bg-red-100 text-red-700" :
                        a.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${a.progress}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agenda Builder — Contains full seven-stage workflow */}
      {boardTab === "agenda" && <AgendaWorkflow />}

      {/* Committees Sub-Tab */}
      {boardTab === "committees" && (
        <div className="p-6 space-y-6">
          <h3 className="font-bold text-gray-900 text-lg">Board Committees</h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Committee</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Chair</th>
                  <th className="px-4 py-3 text-center text-gray-600 font-medium">Meetings</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">TOR</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Decision Rights</th>
                  <th className="px-4 py-3 text-center text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {BOARD_COMMITTEES.map((c, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-700">{c.chair}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{c.meetingsHeld}/{c.meetingsReq}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${c.torApproved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {c.torApproved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.decisionRights}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: getRAGColor(c.status) }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="font-bold text-gray-900 text-lg mt-8">Decision Rights & Delegation Matrix</h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">Decision Type</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">Board</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">Committee</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">Syndicate</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">VC</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">Management</th>
                </tr>
              </thead>
              <tbody>
                {DECISION_RIGHTS_MATRIX.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-900">{row.type}</td>
                    <td className="px-3 py-2 text-gray-700">{row.board}</td>
                    <td className="px-3 py-2 text-gray-700">{row.committee}</td>
                    <td className="px-3 py-2 text-gray-700">{row.syndicate}</td>
                    <td className="px-3 py-2 text-gray-700">{row.vc}</td>
                    <td className="px-3 py-2 text-gray-700">{row.management}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Board KPIs Sub-Tab */}
      {boardTab === "kpis" && (
        <div className="p-6 space-y-4">
          <div className="flex gap-2 mb-4">
            {Object.keys(BOARD_KPI_DATA).map(cat => (
              <button
                key={cat}
                onClick={() => setKpiCategory(cat)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  kpiCategory === cat
                    ? "bg-blue-100 text-blue-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">KPI</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Current</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Target</th>
                  {kpiCategory !== "governance" && <th className="px-4 py-3 text-left text-gray-600 font-medium">Trend</th>}
                  <th className="px-4 py-3 text-center text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {BOARD_KPI_DATA[kpiCategory].map((kpi, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{kpi.kpi}</td>
                    <td className="px-4 py-3 text-gray-700">{kpi.current}</td>
                    <td className="px-4 py-3 text-gray-700">{kpi.target}</td>
                    {kpi.trend && <td className="px-4 py-3 text-gray-700">{kpi.trend}</td>}
                    <td className="px-4 py-3 text-center">
                      <div className="w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: getRAGColor(kpi.rag) }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VC Evaluation Sub-Tab */}
      {boardTab === "vceval" && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Evaluation Process</h3>
              <div className="space-y-3">
                {VC_EVALUATION.timeline.map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{
                      backgroundColor: step.status === "done" ? "#10b981" : step.status === "current" ? "#f59e0b" : "#e5e7eb"
                    }}>
                      <CheckCircle size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{step.title}</div>
                      <div className="text-xs text-gray-600">{step.date}</div>
                      {step.detail && <div className="text-xs text-gray-600 mt-1">{step.detail}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scorecard */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4">VC Scorecard (FY2024-25)</h3>
              <table className="w-full text-sm mb-4">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 text-gray-600 font-medium">Domain</th>
                    <th className="text-center py-2 text-gray-600 font-medium text-xs">Board</th>
                    <th className="text-center py-2 text-gray-600 font-medium text-xs">VC</th>
                    <th className="text-center py-2 text-gray-600 font-medium text-xs">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {VC_EVALUATION.scorecard.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 text-gray-900 font-medium text-sm">{row.domain}</td>
                      <td className="py-2 text-center text-gray-700 text-sm font-bold">{row.boardRating}/5</td>
                      <td className="py-2 text-center text-gray-700 text-sm font-bold">{row.vcSelf}/5</td>
                      <td className="py-2 text-center text-gray-700 text-sm">{row.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                <div className="text-xs text-blue-600 font-medium">OVERALL WEIGHTED SCORE</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">3.83/5.0</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Self-Assessment Sub-Tab */}
      {boardTab === "selfassess" && (
        <div className="p-6 space-y-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            {Object.keys(SELF_ASSESSMENT_SECTIONS).map(sect => (
              <button
                key={sect}
                onClick={() => setSelfAssessTab(sect)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  selfAssessTab === sect
                    ? "bg-blue-100 text-blue-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {sect.charAt(0).toUpperCase() + sect.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setShowResults(true)}
              className="px-3 py-1 rounded text-sm font-medium ml-auto bg-purple-100 text-purple-900 hover:bg-purple-200"
            >
              Results
            </button>
          </div>

          {!showResults ? (
            <div className="space-y-4">
              {SELF_ASSESSMENT_SECTIONS[selfAssessTab].map((q, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="text-sm font-medium text-gray-900 mb-3">{idx + 1}. {q}</div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setSelfScores({ ...selfScores, [idx]: rating })}
                        className={`w-10 h-10 rounded-lg font-bold transition ${
                          selfScores[idx] === rating
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <h3 className="font-bold text-gray-900">Assessment Results</h3>
              <div className="space-y-3">
                {Object.keys(SELF_ASSESSMENT_SECTIONS).map(sect => {
                  const scores = Object.values(selfScores).filter((_, idx) => idx < SELF_ASSESSMENT_SECTIONS[sect].length);
                  const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
                  return (
                    <div key={sect} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium text-gray-900">{sect.charAt(0).toUpperCase() + sect.slice(1)}</div>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${(avg / 5) * 100}%` }} />
                      </div>
                      <div className="text-sm font-bold text-gray-900">{avg}/5.0</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guardrails Sub-Tab */}
      {boardTab === "guardrails" && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Micromanagement Log */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3">Micromanagement Alert Log</h3>
              <table className="w-full text-xs">
                <tbody>
                  {MICROMANAGEMENT_LOG.map((log, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 text-gray-600 font-medium">{log.date}</td>
                      <td className="py-2 text-gray-900">{log.issue.substring(0, 30)}...</td>
                      <td className="py-2 text-gray-700">{log.resolution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Governance Health */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3">Governance Health Checklist</h3>
              <div className="space-y-2">
                {GUARDRAIL_CHECKS.map((check, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={guardrailChecks[idx]}
                      onChange={(e) => {
                        const newChecks = [...guardrailChecks];
                        newChecks[idx] = e.target.checked;
                        setGuardrailChecks(newChecks);
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{check.text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* COI Register */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3">Board Members COI Register</h3>
            <table className="w-full text-sm overflow-hidden rounded-lg">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Member</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Role</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">COI Status</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Date</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {BOARD_MEMBERS.map((m, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900 font-medium">{m.name}</td>
                    <td className="px-4 py-2 text-gray-700">{m.role}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        m.coiStatus === "current" ? "bg-green-100 text-green-700" :
                        m.coiStatus === "action_required" ? "bg-red-100 text-red-700" :
                        m.coiStatus === "renewal_due" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {m.coiStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{m.coiDate}</td>
                    <td className="px-4 py-2 text-gray-700 text-xs">{m.coiDetails}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Organogram Sub-Tab */}
      {boardTab === "orgchart" && (
        <div className="p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Board-Level Organizational Units</h3>
          <div className="grid grid-cols-3 gap-4">
            {BOARD_ORG_UNITS.map((unit, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="font-bold text-gray-900">{unit.name}</div>
                <div className="text-xs text-gray-600 mt-1">{unit.fullName}</div>
                <div className="text-xs font-medium text-gray-500 mt-2">Code: {unit.code}</div>
                <div className="text-xs text-gray-600 mt-1">Committee: {unit.committee}</div>
                {unit.subunits && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs font-bold text-gray-700 mb-2">Subunits:</div>
                    <div className="space-y-1">
                      {unit.subunits.map((su, sidx) => (
                        <div key={sidx} className="text-xs text-gray-600">• {su}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision Register Sub-Tab */}
      {boardTab === "decisions" && (
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">The Decision Register is a chronological log of all formal board resolutions. Implementation in progress.</p>
          </div>
        </div>
      )}

      {/* Governance Config Sub-Tab */}
      {boardTab === "governance" && (
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Governance Scheme Selector</h3>
            <div className="flex gap-2">
              {Object.keys(GOVERNANCE_SCHEMES).map(key => (
                <button
                  key={key}
                  onClick={() => setGovScheme(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    govScheme === key
                      ? "bg-blue-100 text-blue-900 border border-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h3 className="font-bold text-gray-900">{scheme.name}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 font-medium">Apex Body</div>
                <div className="text-lg font-bold text-gray-900 mt-1">{scheme.apexBody}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Executive Committee</div>
                <div className="text-lg font-bold text-gray-900 mt-1">{scheme.executiveCommittee}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Academic Authority</div>
                <div className="text-lg font-bold text-gray-900 mt-1">{scheme.academicAuthority}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 font-medium">Chancellor</div>
                <div className="text-lg font-bold text-gray-900 mt-1">{scheme.chancellor}</div>
              </div>
              {scheme.ratifyingBody && (
                <div className="col-span-2">
                  <div className="text-sm text-gray-600 font-medium">Ratifying Body</div>
                  <div className="text-lg font-bold text-gray-900 mt-1">{scheme.ratifyingBody}</div>
                </div>
              )}
              <div className="col-span-2">
                <div className="text-sm text-gray-600 font-medium">VC Chairs Apex Body</div>
                <div className="text-lg font-bold text-gray-900 mt-1">{scheme.vcChairsApex ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN APP COMPONENT
   ══════════════════════════════════════════════════════════ */

export default function UniversityDSS() {
  const [activeRole, setActiveRole] = useState("vc");
  const [activeView, setActiveView] = useState("workspace");
  const [workspaceTab, setWorkspaceTab] = useState("decisions");
  const [expandedTask, setExpandedTask] = useState(null);
  const [cascadeTask, setCascadeTask] = useState(null);
  const [orgTree, setOrgTree] = useState(JSON.parse(JSON.stringify(DEFAULT_ORG)));
  const [expandedSidebar, setExpandedSidebar] = useState({});
  const [workflowCatalog, setWorkflowCatalog] = useState(WORKFLOW_CATALOG);

  const role = ROLES[activeRole];
  const roleData = WS[activeRole];

  /* Sidebar organogram structure — hierarchical with specific faculties, departments, and faculty members */
  const SIDEBAR_TREE = [
    { id: "vc", children: [
      { id: "provost", children: [
        ...UNIVERSITY_FACULTIES.map(fac => ({
          id: `dean-${fac.id}`,
          children: fac.departments.map(dept => ({
            id: `hod-${dept.id}`,
            children: (DEPT_FACULTY[dept.id] || []).map(m => ({ id: m.id })),
          })),
        })),
        { id: "registrar" },
        { id: "controller" },
        { id: "studentAffairs" },
      ]},
      { id: "vpOps", children: [
        { id: "finance" },
        { id: "hr" },
        { id: "it" },
        { id: "dssAdmin" },
      ]},
      { id: "vpResearch", children: [
        { id: "oric" },
        { id: "gradAffairs" },
      ]},
      { id: "iqae" },
      { id: "fundraising" },
    ]},
  ];

  const toggleSidebarExpand = (nodeId) => {
    setExpandedSidebar(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const selectRole = (key) => {
    setActiveRole(key);
    setActiveView("workspace");
    setWorkspaceTab("decisions");
  };

  /* Recursive sidebar node renderer */
  function SidebarNode({ node, depth = 0 }) {
    const r = ROLES[node.id];
    if (!r) return null;
    const isActive = activeRole === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedSidebar[node.id];
    const ws = WS[node.id];
    const pendingCount = ws ? ws.decisions.filter(d => d.status === "pending" || d.status === "escalated").length : 0;
    const Icon = r.icon;

    return (
      <div>
        <div className="flex items-center" style={{ paddingLeft: depth * 16 }}>
          {/* Expand/collapse button */}
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleSidebarExpand(node.id); }}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0 rounded hover:bg-gray-100"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-6 flex-shrink-0" />
          )}

          {/* Role button */}
          <button
            onClick={() => selectRole(node.id)}
            className={`flex-1 text-left px-3 py-2.5 rounded-lg transition flex items-center gap-2.5 min-w-0 ${
              isActive
                ? "bg-blue-50 border border-blue-200 text-blue-900"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="font-medium text-sm truncate flex-1">{r.label}</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center flex-shrink-0">{pendingCount}</span>
            )}
          </button>
        </div>

        {/* Children — only visible when expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {node.children.map(child => (
              <SidebarNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT SIDEBAR — Hierarchical Role Navigation */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-purple-700 rounded-xl flex items-center justify-center">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">UniDSS</h1>
              <p className="text-xs text-gray-500">Decision Support System</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {SIDEBAR_TREE.map(node => (
            <SidebarNode key={node.id} node={node} depth={0} />
          ))}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Active Decisions</span>
              <span className="font-semibold text-gray-900">{roleData.decisions.filter(d => d.status !== 'resolved').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Critical Alerts</span>
              <span className="font-semibold text-red-600">{roleData.alerts.filter(a => a.type === 'critical').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Data Sources</span>
              <span className="font-semibold text-green-600">{DATA_SOURCES.filter(s => s.status === 'healthy').length}/{DATA_SOURCES.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP NAV */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <role.icon size={32} className="text-blue-900" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{role.label}</h2>
                <p className="text-sm text-gray-600">{role.subtitle}</p>
              </div>
            </div>

            {/* VIEW TABS */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { id: "workspace", label: "Workspace", icon: LayoutDashboard },
                ...(activeRole === "vc" ? [{ id: "board", label: "Board Governance", icon: Landmark }] : []),
                { id: "organogram", label: "Organogram", icon: FolderTree },
                { id: "architecture", label: "Architecture", icon: Layers },
                { id: "integration", label: "API & Integration", icon: Server },
              ].map(v => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.id}
                    onClick={() => setActiveView(v.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition text-sm font-medium ${
                      activeView === v.id
                        ? "bg-white text-blue-900 shadow"
                        : "text-gray-700 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={16} />
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* VIEW CONTENT */}
        <div className="flex-1 overflow-y-auto">
          {activeView === "workspace" && (
            <WorkspaceView role={activeRole} roleData={roleData} tab={workspaceTab} setTab={setWorkspaceTab}
              expandedTask={expandedTask} setExpandedTask={setExpandedTask}
              cascadeTask={cascadeTask} setCascadeTask={setCascadeTask}
              workflowCatalog={workflowCatalog} setWorkflowCatalog={setWorkflowCatalog} />
          )}
          {activeView === "board" && <BoardManagementView />}
          {activeView === "organogram" && (
            <OrgBuilderView orgTree={orgTree} setOrgTree={setOrgTree} onOpenWorkspace={(id) => { setActiveRole(id); setActiveView("workspace"); setWorkspaceTab("decisions"); }} />
          )}
          {activeView === "architecture" && <ArchitectureView />}
          {activeView === "integration" && <IntegrationView />}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   WORKSPACE VIEW (Decisions, KPIs, Alerts, Coordination, Playbook, Data Sources)
   ══════════════════════════════════════════════════════════ */

function WorkspaceView({ role, roleData, tab, setTab, expandedTask, setExpandedTask, cascadeTask, setCascadeTask, workflowCatalog, setWorkflowCatalog }) {
  const roleObj = ROLES[role] || { label: role, coordinates: [] };

  /* Build role-contextual tabs */
  const baseTabs = [
    { id: "decisions", label: "Decisions", icon: Flag },
    { id: "kpis", label: "KPIs", icon: TrendingUp },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "coordination", label: "Coordination", icon: Link2 },
    { id: "playbook", label: "Playbook", icon: BookMarked },
    { id: "dataSources", label: "Data Sources", icon: Database },
    { id: "workflows", label: role === "dssAdmin" ? "Workflow Admin" : "Workflows", icon: Calendar },
  ];

  const isDean = role === "dean" || role.startsWith("dean-");
  const isHoD = role === "hod" || role.startsWith("hod-");
  const isFacultyMember = ROLES[role]?.tier === "Faculty";

  /* Dean: + HoD Reports (dean review) + Faculty Reports (dean aggregate) */
  if (isDean) {
    baseTabs.push({ id: "hodreports", label: "HoD Reports", icon: FileText });
    baseTabs.push({ id: "facultyreports", label: "Faculty Reports", icon: GraduationCap });
  }
  /* HoD: + HoD Report submission + Faculty Reports (HoD review) */
  if (isHoD) {
    baseTabs.push({ id: "hodreports", label: "HoD Report", icon: FileText });
    baseTabs.push({ id: "facultyreports", label: "Faculty Reports", icon: GraduationCap });
  }
  /* Faculty Member: + Faculty Report (submission) */
  if (isFacultyMember) {
    baseTabs.push({ id: "facultyreports", label: "My Report", icon: GraduationCap });
  }
  /* Registrar: + HoD Reports (institutional view) */
  if (role === "registrar") {
    baseTabs.push({ id: "hodreports", label: "HoD Reports", icon: FileText });
  }
  /* VP Operations: + HR Director Reports */
  if (role === "vpOps") {
    baseTabs.push({ id: "hrreports", label: "HR Reports", icon: UserCheck });
  }
  /* HR Director: + HR Report (submission) + Odoo Implementation */
  if (role === "hr") {
    baseTabs.push({ id: "hrreports", label: "HR Report", icon: UserCheck });
    baseTabs.push({ id: "odootracker", label: "Odoo Implementation", icon: Server });
  }
  /* Registrar, VC, vpOps: + Odoo Implementation Tracker (oversight) */
  if (role === "registrar" || role === "vc" || role === "vpOps") {
    baseTabs.push({ id: "odootracker", label: "Odoo Implementation", icon: Server });
  }

  return (
    <div>
      {/* TAB BAR */}
      <div className="bg-white border-b border-gray-200 px-8 flex gap-1 overflow-x-auto">
        {baseTabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium text-sm ${
                tab === t.id
                  ? "border-blue-500 text-blue-700"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      <div className="p-8">
        {tab === "decisions" && <DecisionsPanel decisions={roleData.decisions} />}
        {tab === "kpis" && <KPIsPanel kpis={roleData.kpis} />}
        {tab === "alerts" && <AlertsPanel alerts={roleData.alerts} />}
        {tab === "coordination" && <CoordinationPanel role={roleObj} />}
        {tab === "playbook" && <PlaybookPanel playbook={roleData.playbook} />}
        {tab === "dataSources" && <DataSourcesPanel role={roleObj} />}
        {tab === "workflows" && (
          <WorkflowEngineView
            role={role}
            expandedTask={expandedTask} setExpandedTask={setExpandedTask}
            cascadeTask={cascadeTask} setCascadeTask={setCascadeTask}
            workflowCatalog={workflowCatalog} setWorkflowCatalog={setWorkflowCatalog}
          />
        )}
        {tab === "hodreports" && <HoDReportsView defaultScope={isHoD ? "hod" : isDean ? "dean" : "registrar"} roleKey={role} roleLabel={roleObj.label} />}
        {tab === "facultyreports" && <FacultyReportsView defaultLevel={isFacultyMember ? "faculty" : isHoD ? "hod" : "dean"} roleKey={role} roleLabel={roleObj.label} />}
        {tab === "hrreports" && <HRReportsView defaultScope={role === "hr" ? "hr" : "vpops"} />}
        {tab === "odootracker" && <HROdooTracker role={role} />}
      </div>
    </div>
  );
}

function DecisionsPanel({ decisions }) {
  return (
    <div className="space-y-4">
      {decisions.map(d => (
        <div
          key={d.id}
          className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{d.title}</h3>
              <p className="text-sm text-gray-600 mt-1">From: {d.from}</p>
            </div>
            <div className="flex gap-2 ml-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold`}
                style={{
                  backgroundColor: DECISION_STATUS[d.status].bg,
                  color: DECISION_STATUS[d.status].color,
                }}
              >
                {DECISION_STATUS[d.status].label}
              </span>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: d.priority === "critical" ? "#fef2f2" : d.priority === "high" ? "#fffbeb" : "#eff6ff",
                  color: d.priority === "critical" ? "#ef4444" : d.priority === "high" ? "#f59e0b" : "#3b82f6",
                }}
              >
                {d.priority}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Impact:</span>
              <p className="font-medium text-gray-900">{d.impact}</p>
            </div>
            <div>
              <span className="text-gray-600">Deadline:</span>
              <p className="font-medium text-gray-900">{d.deadline}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Recommendation:</span>
              <p className="font-medium text-gray-900">{d.recommended}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
              Approve
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              Defer
            </button>
            <button className="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition">
              Escalate
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function KPIsPanel({ kpis }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {kpis.map((kpi, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{kpi.name}</h3>
            <TrendingUp
              size={20}
              color={kpi.trend === "up" ? "#10b981" : kpi.trend === "down" ? "#ef4444" : "#6b7280"}
            />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{kpi.value}</div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Target: {kpi.target}</span>
            <span
              className="font-medium"
              style={{ color: kpi.trend === "up" ? "#10b981" : "#6b7280" }}
            >
              {kpi.delta}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertsPanel({ alerts }) {
  return (
    <div className="space-y-4">
      {alerts.map((a, i) => (
        <div
          key={i}
          className="rounded-lg border-l-4 p-4"
          style={{
            backgroundColor: ALERT_TYPE[a.type].bg,
            borderColor: ALERT_TYPE[a.type].color,
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} style={{ color: ALERT_TYPE[a.type].color }} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: ALERT_TYPE[a.type].color }}>
                {a.title}
              </h3>
              <p className="text-sm text-gray-700 mt-1">{a.message}</p>
              <button className="mt-2 text-sm font-medium" style={{ color: ALERT_TYPE[a.type].color }}>
                {a.action}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CoordinationPanel({ role }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Coordination Network</h3>
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-4">
          {role.label} coordinates with the following roles on key decisions and workflows:
        </p>
        <div className="flex flex-wrap gap-2">
          {role.coordinates.map((coord, i) => (
            <div
              key={i}
              className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-900"
            >
              {coord}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaybookPanel({ playbook }) {
  return (
    <div className="space-y-4">
      {playbook.map((p, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900">{p.title}</h3>
          <p className="text-sm text-gray-600 mt-2">{p.description}</p>
          <div className="flex gap-4 mt-4 text-sm">
            <div>
              <span className="text-gray-600">Trigger:</span>
              <p className="font-medium text-gray-900">{p.trigger}</p>
            </div>
            <div>
              <span className="text-gray-600">Policy:</span>
              <p className="font-medium text-gray-900">{p.policy}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DataSourcesPanel({ role }) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Data Sources for {role.label}</h3>
        <p className="text-sm text-blue-800">
          This role receives data from integrated systems. Endpoints reference the API configuration.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {DATA_SOURCES.slice(0, 6).map((source, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm">{source.name}</h4>
              <div className="flex items-center gap-1">
                {source.status === "healthy" ? (
                  <Wifi size={16} className="text-green-600" />
                ) : (
                  <WifiOff size={16} className="text-orange-600" />
                )}
                <span
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{
                    backgroundColor: source.status === "healthy" ? "#ecfdf5" : "#fffbeb",
                    color: source.status === "healthy" ? "#10b981" : "#f59e0b",
                  }}
                >
                  {source.status}
                </span>
              </div>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Sync: <span className="font-medium">{source.syncMode}</span></div>
              <div>Endpoints: <span className="font-medium">{source.endpoints}</span></div>
              <div>Last sync: <span className="font-medium">{formatTime(source.lastSync)}</span></div>
            </div>
          </div>
        ))}
      </div>

      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
        Refresh Data
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ARCHITECTURE VIEW
   ══════════════════════════════════════════════════════════ */

function ArchitectureView() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">DSS Architecture</h2>
        <p className="text-gray-600 mb-8">
          Six-layer architecture from role workspaces through to integrated data sources and API gateway.
        </p>
      </div>

      {ARCH_LAYERS.map((layer, i) => (
        <div key={layer.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: layer.color + "15" }}>
            <h3 className="font-bold text-gray-900">
              Layer {layer.id} — {layer.name}
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {layer.items.map((item, j) => (
                <div
                  key={j}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: layer.color }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
        <h3 className="font-bold text-green-900 mb-2">Layer F: API Gateway & Configuration</h3>
        <p className="text-sm text-green-800">
          REST API v1 with OAuth 2.0 authentication. Includes JSON configuration registry for all roles and workflows,
          webhook engine for real-time event distribution, and rate limiting to ensure system stability.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   OPERATIONAL WORKFLOW ENGINE — Multi-Workflow Catalog
   APCE is one workflow; others include events, conferences, HR campaigns, etc.
   ══════════════════════════════════════════════════════════ */

const WORKFLOW_CATALOG = [
  { id: "apce", name: "APCE — Semester Preparation", icon: Calendar, color: "#10b981",
    description: "30-task academic process calendar for each department, aggregated to Faculty and Registrar levels.",
    status: "active", progress: 62, owner: "Registrar", createdBy: "dssAdmin",
    assignedRoles: ["registrar", "dean-eng", "dean-sci", "dean-mgmt", "dean-ss",
      "hod-cs", "hod-ee", "hod-me", "hod-ce", "hod-phy", "hod-chem", "hod-math", "hod-bio",
      "hod-bba", "hod-mba", "hod-acc", "hod-eng-lang", "hod-edu", "finance", "it"],
    tasks: 30, startDate: "2026-05-01", endDate: "2026-08-24", category: "Academic" },
  { id: "sports-week", name: "Annual Sports Week 2026", icon: Trophy, color: "#f59e0b",
    description: "Inter-departmental sports tournament covering 12 disciplines across 5 days.",
    status: "planning", progress: 18, owner: "Student Affairs", createdBy: "dssAdmin",
    assignedRoles: ["studentAffairs", "hod-cs", "hod-ee", "hod-me", "hod-ce", "hod-phy", "hod-chem", "hod-math", "hod-bio",
      "hod-bba", "hod-mba", "hod-acc", "hod-eng-lang", "hod-edu", "finance"],
    tasks: 22, startDate: "2026-04-20", endDate: "2026-04-25", category: "Event" },
  { id: "research-conf", name: "3rd International Research Conference", icon: Globe, color: "#8b5cf6",
    description: "Multi-track conference with keynotes, paper presentations, and industry panels.",
    status: "active", progress: 45, owner: "ORIC", createdBy: "dssAdmin",
    assignedRoles: ["oric", "vpResearch", "dean-eng", "dean-sci", "dean-mgmt", "dean-ss", "it", "finance"],
    tasks: 28, startDate: "2026-06-10", endDate: "2026-06-12", category: "Research" },
  { id: "accreditation-bba", name: "BBA Accreditation Review", icon: Shield, color: "#ef4444",
    description: "Self-assessment report preparation and external review visit for BBA programme.",
    status: "active", progress: 35, owner: "Dean Management Sciences", createdBy: "dssAdmin",
    assignedRoles: ["dean-mgmt", "hod-bba", "iqae", "registrar"],
    tasks: 18, startDate: "2026-03-01", endDate: "2026-08-15", category: "Accreditation" },
  { id: "hr-recruitment", name: "Faculty Recruitment Drive — Fall 2026", icon: UserCheck, color: "#3b82f6",
    description: "Coordinated hiring campaign for 14 vacant faculty positions across 3 faculties.",
    status: "active", progress: 28, owner: "Director HR", createdBy: "dssAdmin",
    assignedRoles: ["hr", "dean-eng", "dean-sci", "dean-mgmt", "hod-cs", "hod-ee", "hod-phy", "hod-chem", "hod-bba", "finance", "vpOps"],
    tasks: 16, startDate: "2026-03-15", endDate: "2026-07-31", category: "HR" },
  { id: "convocation", name: "Convocation 2026", icon: Award, color: "#ec4899",
    description: "Annual convocation ceremony planning, degree verification, and event logistics.",
    status: "upcoming", progress: 5, owner: "Registrar", createdBy: "dssAdmin",
    assignedRoles: ["registrar", "controller", "studentAffairs", "it", "finance"],
    tasks: 24, startDate: "2026-09-01", endDate: "2026-10-15", category: "Event" },
];

const WF_STATUS_STYLES = {
  active: { bg: "#ecfdf5", color: "#059669", label: "Active" },
  planning: { bg: "#eff6ff", color: "#2563eb", label: "Planning" },
  upcoming: { bg: "#f5f3ff", color: "#7c3aed", label: "Upcoming" },
  completed: { bg: "#f0fdf4", color: "#16a34a", label: "Completed" },
  paused: { bg: "#fffbeb", color: "#d97706", label: "Paused" },
};

function WorkflowEngineView({ role, expandedTask, setExpandedTask, cascadeTask, setCascadeTask, workflowCatalog, setWorkflowCatalog }) {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [adminMode, setAdminMode] = useState("catalog"); /* catalog | create | assign */
  const [newWf, setNewWf] = useState({ name: "", description: "", category: "Event", owner: "", tasks: 10, startDate: "", endDate: "" });
  const [assigningWf, setAssigningWf] = useState(null);
  const [assignSelections, setAssignSelections] = useState({});
  const [builderPhases, setBuilderPhases] = useState([{ id: "P1", name: "Phase 1" }]);
  const [builderTasks, setBuilderTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  const isAdmin = role === "dssAdmin";
  const isDean = role === "dean" || role.startsWith("dean-");
  const isHoD = role === "hod" || role.startsWith("hod-");

  /* Filter workflows relevant to this role — position-specific via assignedRoles */
  const roleLabel = ROLES[role]?.label || role;
  const relevantWorkflows = (workflowCatalog || WORKFLOW_CATALOG).filter(wf => {
    if (isAdmin || role === "vc" || role === "provost") return true; /* Admin and top execs see all */
    return wf.assignedRoles && wf.assignedRoles.includes(role);
  });

  if (selectedWorkflow === "apce") {
    return (
      <div>
        <button
          onClick={() => setSelectedWorkflow(null)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm mb-4 ml-6 mt-4"
        >
          <ArrowRight size={16} className="rotate-180" /> Back to Workflows
        </button>
        <APCEView
          defaultScope={isHoD ? "department" : isDean ? "faculty" : "registrar"}
          expandedTask={expandedTask} setExpandedTask={setExpandedTask}
          cascadeTask={cascadeTask} setCascadeTask={setCascadeTask}
        />
      </div>
    );
  }

  /* ── Generic workflow detail view (non-APCE) with dependency-aware task display ── */
  if (selectedWorkflow) {
    const wf = (workflowCatalog || WORKFLOW_CATALOG).find(w => w.id === selectedWorkflow);
    if (!wf) { setSelectedWorkflow(null); return null; }
    const WfIcon = wf.icon;
    const st = WF_STATUS_STYLES[wf.status] || WF_STATUS_STYLES.active;
    const wfTasks = wf.taskList || [];
    const phases = [...new Set(wfTasks.map(t => t.phase))];
    const completedCount = wfTasks.filter(t => t.status === "completed").length;
    const computedProgress = wfTasks.length > 0 ? Math.round((completedCount / wfTasks.length) * 100) : wf.progress;

    /* Check if all predecessors of a task are completed */
    const canStart = (task) => {
      if (!task.dependsOn || task.dependsOn.length === 0) return true;
      return task.dependsOn.every(depId => {
        const dep = wfTasks.find(t => t.id === depId);
        return dep && dep.status === "completed";
      });
    };

    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setSelectedWorkflow(null)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm">
          <ArrowRight size={16} className="rotate-180" /> Back to Workflows
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: wf.color + "20" }}>
              <WfIcon size={24} style={{ color: wf.color }} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{wf.name}</h2>
              <p className="text-sm text-gray-600">{wf.description}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{wfTasks.length || wf.tasks}</div>
              <div className="text-xs text-gray-500">Total Tasks</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold" style={{ color: wf.color }}>{computedProgress}%</div>
              <div className="text-xs text-gray-500">Progress</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{(wf.assignedRoles || []).length}</div>
              <div className="text-xs text-gray-500">Positions</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-sm font-bold text-gray-900">{wf.startDate}</div>
              <div className="text-xs text-gray-500">Start Date</div>
            </div>
          </div>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">Overall Progress</span>
              <span className="font-bold" style={{ color: wf.color }}>{computedProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="h-3 rounded-full transition-all" style={{ width: `${computedProgress}%`, backgroundColor: wf.color }} />
            </div>
          </div>
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Assigned Positions ({(wf.assignedRoles || []).length})</h4>
            <div className="flex flex-wrap gap-2">
              {(wf.assignedRoles || []).map(rid => (
                <span key={rid} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{ROLES[rid]?.label || rid}</span>
              ))}
            </div>
          </div>

          {/* ── Task flow grouped by phase with dependency indicators ── */}
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Task Flow</h4>
          {phases.length > 0 ? phases.map((phase, pi) => {
            const phaseTasks = wfTasks.filter(t => t.phase === phase);
            const phaseCompleted = phaseTasks.filter(t => t.status === "completed").length;
            return (
              <div key={phase} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">{pi + 1}</div>
                  <h5 className="text-sm font-bold text-gray-800">{phase}</h5>
                  <span className="text-xs text-gray-500">({phaseCompleted}/{phaseTasks.length} complete)</span>
                  {phaseCompleted === phaseTasks.length && phaseTasks.length > 0 && <CheckCircle size={14} className="text-green-500" />}
                </div>
                <div className="space-y-1.5 ml-8">
                  {phaseTasks.map(t => {
                    const ts = TASK_STATUS[t.status] || TASK_STATUS.pending;
                    const TsIcon = ts.icon;
                    const ready = canStart(t);
                    const blocked = !ready && t.status !== "completed";
                    const deps = (t.dependsOn || []).map(did => wfTasks.find(x => x.id === did)).filter(Boolean);
                    return (
                      <div key={t.id}
                        className={`rounded-lg border p-3 transition ${blocked ? "bg-gray-50 border-gray-200 opacity-70" : "bg-white border-gray-200 hover:shadow-sm"}`}
                        style={{ borderLeftColor: blocked ? "#9ca3af" : ts.color, borderLeftWidth: "4px" }}
                      >
                        <div className="flex items-center gap-3">
                          <TsIcon size={16} style={{ color: blocked ? "#9ca3af" : ts.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{t.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-500">{ROLES[t.assignedTo]?.label || t.assignedTo}</span>
                              {t.parallel && <span className="px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-600 font-medium">Parallel</span>}
                              {blocked && <span className="px-1.5 py-0.5 rounded text-xs bg-amber-50 text-amber-600 font-medium">Waiting on predecessors</span>}
                            </div>
                            {deps.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-gray-400">Depends on:</span>
                                {deps.map(d => {
                                  const dts = TASK_STATUS[d.status] || TASK_STATUS.pending;
                                  return <span key={d.id} className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: dts.bg, color: dts.color }}>{d.name.length > 30 ? d.name.slice(0,30) + "..." : d.name}</span>;
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Status change dropdown */}
                            <select
                              value={t.status}
                              onChange={(e) => {
                                if (setWorkflowCatalog) {
                                  setWorkflowCatalog(prev => prev.map(w => {
                                    if (w.id !== selectedWorkflow) return w;
                                    return { ...w, taskList: (w.taskList || []).map(tk => tk.id === t.id ? { ...tk, status: e.target.value } : tk) };
                                  }));
                                }
                              }}
                              disabled={blocked}
                              className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              {Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: ts.bg, color: ts.color }}>{ts.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {pi < phases.length - 1 && (
                  <div className="flex items-center justify-center my-2 ml-8">
                    <div className="border-l-2 border-dashed border-gray-300 h-4" />
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
              No task structure has been defined for this workflow yet. The DSS Administrator can define the task flow.
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Admin: Create Workflow with full task definition ── */
  if (isAdmin && adminMode === "create") {
    const WF_CATEGORIES = ["Academic", "Event", "Research", "Accreditation", "HR", "Administrative", "Custom"];
    const allAssignableRoles = Object.entries(ROLES).filter(([,v]) => v.tier !== "Faculty").map(([k, v]) => ({ id: k, label: v.label }));

    /* Builder state for phases and tasks is declared at top of WorkflowEngineView */

    const addPhase = () => {
      const n = builderPhases.length + 1;
      setBuilderPhases([...builderPhases, { id: `P${n}`, name: `Phase ${n}` }]);
    };
    const removePhase = (pid) => {
      setBuilderPhases(builderPhases.filter(p => p.id !== pid));
      setBuilderTasks(builderTasks.filter(t => t.phase !== pid));
    };
    const renamePhase = (pid, name) => {
      setBuilderPhases(builderPhases.map(p => p.id === pid ? { ...p, name } : p));
    };
    const addTask = (phaseId) => {
      const n = builderTasks.length + 1;
      setBuilderTasks([...builderTasks, {
        id: `T${n}`, name: "", phase: phaseId, assignedTo: "", dependsOn: [], parallel: false, status: "pending"
      }]);
    };
    const updateTask = (taskId, field, value) => {
      setBuilderTasks(builderTasks.map(t => t.id === taskId ? { ...t, [field]: value } : t));
    };
    const removeTask = (taskId) => {
      setBuilderTasks(builderTasks.filter(t => t.id !== taskId));
      /* Remove from dependencies */
      setBuilderTasks(prev => prev.map(t => ({ ...t, dependsOn: (t.dependsOn || []).filter(d => d !== taskId) })));
    };
    const toggleDependency = (taskId, depId) => {
      setBuilderTasks(builderTasks.map(t => {
        if (t.id !== taskId) return t;
        const deps = t.dependsOn || [];
        return { ...t, dependsOn: deps.includes(depId) ? deps.filter(d => d !== depId) : [...deps, depId] };
      }));
    };

    return (
      <div className="p-6 space-y-5">
        <button onClick={() => setAdminMode("catalog")} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm">
          <ArrowRight size={16} className="rotate-180" /> Back to Workflow Dashboard
        </button>

        {/* ── Step 1: Workflow metadata ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Create New Workflow</h2>
          <p className="text-sm text-gray-500 mb-5">Define the workflow, add phases and tasks with dependencies, then assign to positions.</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Workflow Name</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Annual Sports Week 2026" value={newWf.name} onChange={e => setNewWf({...newWf, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={newWf.category} onChange={e => setNewWf({...newWf, category: e.target.value})}>
                {WF_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Describe the workflow objective and scope" value={newWf.description} onChange={e => setNewWf({...newWf, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Workflow Owner</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Student Affairs" value={newWf.owner} onChange={e => setNewWf({...newWf, owner: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={newWf.startDate} onChange={e => setNewWf({...newWf, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={newWf.endDate} onChange={e => setNewWf({...newWf, endDate: e.target.value})} />
            </div>
          </div>
        </div>

        {/* ── Step 2: Phases and Tasks ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Phases & Tasks</h3>
              <p className="text-xs text-gray-500">Tasks within a phase can run in parallel or sequentially. Tasks in later phases depend on earlier phase completion.</p>
            </div>
            <button onClick={addPhase} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200">
              <Plus size={14} /> Add Phase
            </button>
          </div>

          <div className="space-y-5">
            {builderPhases.map((phase, pi) => {
              const phaseTasks = builderTasks.filter(t => t.phase === phase.id);
              /* Tasks from earlier phases that can serve as dependencies */
              const earlierTasks = builderTasks.filter(t => {
                const tPhaseIdx = builderPhases.findIndex(p => p.id === t.phase);
                return tPhaseIdx < pi || (tPhaseIdx === pi && t.phase === phase.id);
              }).filter(t => !phaseTasks.includes(t) || true);
              const possibleDeps = builderTasks.filter(t => t.id !== editingTask);

              return (
                <div key={phase.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Phase header */}
                  <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{pi + 1}</div>
                    <input
                      className="flex-1 bg-transparent text-sm font-bold text-gray-900 border-none focus:ring-0 p-0"
                      value={phase.name}
                      onChange={e => renamePhase(phase.id, e.target.value)}
                      placeholder="Phase name"
                    />
                    <span className="text-xs text-gray-500">{phaseTasks.length} task{phaseTasks.length !== 1 ? "s" : ""}</span>
                    {builderPhases.length > 1 && (
                      <button onClick={() => removePhase(phase.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                    )}
                  </div>

                  {/* Tasks in this phase */}
                  <div className="p-4 space-y-3">
                    {phaseTasks.map(task => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-3 bg-white hover:border-blue-200 transition">
                        <div className="grid grid-cols-12 gap-3 items-start">
                          {/* Task name */}
                          <div className="col-span-4">
                            <label className="block text-xs text-gray-500 mb-0.5">Task Name</label>
                            <input
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                              placeholder="e.g. Book venues and fields"
                              value={task.name}
                              onChange={e => updateTask(task.id, "name", e.target.value)}
                            />
                          </div>
                          {/* Assigned office */}
                          <div className="col-span-3">
                            <label className="block text-xs text-gray-500 mb-0.5">Assigned To</label>
                            <select
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                              value={task.assignedTo}
                              onChange={e => updateTask(task.id, "assignedTo", e.target.value)}
                            >
                              <option value="">Select position...</option>
                              {allAssignableRoles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                          </div>
                          {/* Dependencies */}
                          <div className="col-span-4">
                            <label className="block text-xs text-gray-500 mb-0.5">Depends On (predecessors)</label>
                            <div className="flex flex-wrap gap-1 min-h-[30px] border border-gray-300 rounded px-2 py-1 bg-gray-50">
                              {(task.dependsOn || []).length === 0 && <span className="text-xs text-gray-400 py-0.5">None (can start immediately)</span>}
                              {(task.dependsOn || []).map(depId => {
                                const dep = builderTasks.find(t => t.id === depId);
                                return (
                                  <span key={depId} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                                    {dep ? (dep.name || dep.id) : depId}
                                    <button onClick={() => toggleDependency(task.id, depId)} className="text-blue-400 hover:text-red-500"><X size={10} /></button>
                                  </span>
                                );
                              })}
                            </div>
                            {/* Add dependency dropdown */}
                            {builderTasks.filter(t => t.id !== task.id && !(task.dependsOn || []).includes(t.id)).length > 0 && (
                              <select
                                className="mt-1 w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-600"
                                value=""
                                onChange={e => { if (e.target.value) toggleDependency(task.id, e.target.value); }}
                              >
                                <option value="">+ Add predecessor...</option>
                                {builderTasks.filter(t => t.id !== task.id && !(task.dependsOn || []).includes(t.id)).map(t => (
                                  <option key={t.id} value={t.id}>{t.name || t.id} ({builderPhases.find(p => p.id === t.phase)?.name || t.phase})</option>
                                ))}
                              </select>
                            )}
                          </div>
                          {/* Controls */}
                          <div className="col-span-1 flex flex-col items-center gap-1 pt-4">
                            <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer" title="Can run in parallel with other tasks in this phase">
                              <input type="checkbox" className="rounded border-gray-300" checked={task.parallel} onChange={e => updateTask(task.id, "parallel", e.target.checked)} />
                              <span className="text-xs">Par.</span>
                            </label>
                            <button onClick={() => removeTask(task.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button onClick={() => addTask(phase.id)} className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition w-full justify-center">
                      <Plus size={14} /> Add Task to {phase.name}
                    </button>
                  </div>

                  {/* Phase dependency arrow */}
                  {pi < builderPhases.length - 1 && (
                    <div className="flex items-center justify-center py-1 bg-gray-50 border-t border-gray-200">
                      <ChevronDown size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-400 ml-1">Next phase begins when above tasks complete</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step 3: Assign to positions ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Assign to Positions</h3>
          <p className="text-xs text-gray-500 mb-3">Positions selected here will see this workflow in their Workflows tab. Positions assigned to specific tasks above are auto-included.</p>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {allAssignableRoles.map(r => {
              const autoAssigned = builderTasks.some(t => t.assignedTo === r.id);
              return (
                <label key={r.id} className={`flex items-center gap-2 text-sm py-1 px-2 rounded cursor-pointer ${autoAssigned ? "bg-green-50 text-green-800" : "text-gray-700 hover:bg-gray-50"}`}>
                  <input type="checkbox" className="rounded border-gray-300"
                    checked={autoAssigned || !!assignSelections[r.id]}
                    disabled={autoAssigned}
                    onChange={e => setAssignSelections({...assignSelections, [r.id]: e.target.checked})}
                  />
                  <span className="text-xs">{r.label}</span>
                  {autoAssigned && <span className="text-xs text-green-600">(task)</span>}
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Summary and Create ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Summary</h3>
              <p className="text-xs text-gray-500">{builderPhases.length} phase{builderPhases.length !== 1 ? "s" : ""}, {builderTasks.length} task{builderTasks.length !== 1 ? "s" : ""}, {new Set(builderTasks.map(t => t.assignedTo).filter(Boolean)).size} offices involved</p>
            </div>
          </div>
          {/* Visual summary */}
          {builderPhases.map((phase, pi) => {
            const pts = builderTasks.filter(t => t.phase === phase.id);
            if (pts.length === 0) return null;
            const parallelTasks = pts.filter(t => t.parallel);
            const sequentialTasks = pts.filter(t => !t.parallel);
            return (
              <div key={phase.id} className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{pi + 1}</div>
                  <span className="text-sm font-semibold text-gray-800">{phase.name}</span>
                </div>
                <div className="ml-7 space-y-1">
                  {parallelTasks.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-600 font-medium mt-0.5">Parallel</span>
                      <div className="flex flex-wrap gap-1">
                        {parallelTasks.map(t => (
                          <span key={t.id} className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{t.name || t.id} → {ROLES[t.assignedTo]?.label || t.assignedTo || "Unassigned"}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {sequentialTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 font-medium">Seq.</span>
                      <span>{t.name || t.id}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium">{ROLES[t.assignedTo]?.label || t.assignedTo || "Unassigned"}</span>
                      {(t.dependsOn || []).length > 0 && (
                        <span className="text-gray-400">(after: {(t.dependsOn || []).map(d => builderTasks.find(x => x.id === d)?.name || d).join(", ")})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                if (!newWf.name.trim() || builderTasks.length === 0) return;
                /* Collect assigned roles: explicitly selected + those assigned to tasks */
                const taskRoles = [...new Set(builderTasks.map(t => t.assignedTo).filter(Boolean))];
                const manualRoles = Object.entries(assignSelections).filter(([,v]) => v).map(([k]) => k);
                const allRoles = [...new Set([...taskRoles, ...manualRoles])];
                const WF_ICONS = [Calendar, Trophy, Globe, Shield, UserCheck, Award, Settings, Briefcase];
                const WF_COLORS = ["#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#3b82f6", "#ec4899", "#0891b2", "#6366f1"];
                const idx = (workflowCatalog || WORKFLOW_CATALOG).length;
                const wfId = `wf-${Date.now()}`;
                /* Build the task list with phase names resolved */
                const taskList = builderTasks.map(t => ({
                  ...t,
                  phase: builderPhases.find(p => p.id === t.phase)?.name || t.phase,
                }));
                const created = {
                  id: wfId,
                  name: newWf.name.trim(),
                  icon: WF_ICONS[idx % WF_ICONS.length],
                  color: WF_COLORS[idx % WF_COLORS.length],
                  description: newWf.description.trim() || "Custom workflow",
                  status: "planning",
                  progress: 0,
                  owner: newWf.owner.trim() || "DSS Admin",
                  createdBy: "dssAdmin",
                  assignedRoles: allRoles,
                  tasks: builderTasks.length,
                  taskList,
                  startDate: newWf.startDate || "2026-05-01",
                  endDate: newWf.endDate || "2026-08-01",
                  category: newWf.category,
                };
                if (setWorkflowCatalog) setWorkflowCatalog(prev => [...prev, created]);
                setAdminMode("catalog");
              }}
              disabled={!newWf.name.trim() || builderTasks.length === 0}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} /> Create Workflow ({builderTasks.length} tasks)
            </button>
            <button onClick={() => setAdminMode("catalog")} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Admin: Assignment management for a specific workflow ── */
  if (isAdmin && adminMode === "assign" && assigningWf) {
    const wf = (workflowCatalog || WORKFLOW_CATALOG).find(w => w.id === assigningWf);
    if (!wf) { setAdminMode("catalog"); return null; }
    const WfIcon = wf.icon;
    const allAssignableRoles = Object.entries(ROLES).filter(([,v]) => v.tier !== "Faculty").map(([k, v]) => ({ id: k, label: v.label }));
    return (
      <div className="p-6 space-y-5">
        <button onClick={() => { setAdminMode("catalog"); setAssigningWf(null); }} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm">
          <ArrowRight size={16} className="rotate-180" /> Back to Workflow Dashboard
        </button>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: wf.color + "20" }}>
              <WfIcon size={20} style={{ color: wf.color }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Manage Assignments: {wf.name}</h2>
              <p className="text-sm text-gray-500">Currently assigned to {(wf.assignedRoles || []).length} positions</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 mb-4">
            {allAssignableRoles.map(r => {
              const isChecked = assignSelections.hasOwnProperty(r.id) ? !!assignSelections[r.id] : (wf.assignedRoles || []).includes(r.id);
              return (
                <label key={r.id} className={`flex items-center gap-2 text-sm py-1.5 px-2 rounded cursor-pointer ${isChecked ? "bg-blue-50 text-blue-800 font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                  <input type="checkbox" className="rounded border-gray-300" checked={isChecked}
                    onChange={e => setAssignSelections(prev => ({...prev, [r.id]: e.target.checked}))} />
                  {r.label}
                </label>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const baseAssigned = new Set(wf.assignedRoles || []);
                Object.entries(assignSelections).forEach(([k, v]) => { if (v) baseAssigned.add(k); else baseAssigned.delete(k); });
                if (setWorkflowCatalog) {
                  setWorkflowCatalog(prev => prev.map(w => w.id === assigningWf ? { ...w, assignedRoles: Array.from(baseAssigned) } : w));
                }
                setAdminMode("catalog"); setAssigningWf(null); setAssignSelections({});
              }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              <Save size={16} /> Save Assignments
            </button>
            <button onClick={() => { setAdminMode("catalog"); setAssigningWf(null); setAssignSelections({}); }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Workflow catalog view (all roles) ── */
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{isAdmin ? "Workflow Administration" : "Operational Workflows"}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? "Create, assign, and monitor all workflows across the university" : `Workflows assigned to ${roleLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={() => { setAdminMode("create"); setAssignSelections({}); setNewWf({ name: "", description: "", category: "Event", owner: "", tasks: 10, startDate: "", endDate: "" }); setBuilderPhases([{ id: "P1", name: "Phase 1" }]); setBuilderTasks([]); setEditingTask(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              <Plus size={16} /> New Workflow
            </button>
          )}
          <span className="text-xs text-gray-500">{relevantWorkflows.length} workflow{relevantWorkflows.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{relevantWorkflows.filter(w => w.status === "active").length}</div>
          <div className="text-xs text-green-600 font-medium">Active</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{relevantWorkflows.filter(w => w.status === "planning").length}</div>
          <div className="text-xs text-blue-600 font-medium">Planning</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">{relevantWorkflows.filter(w => w.status === "upcoming").length}</div>
          <div className="text-xs text-purple-600 font-medium">Upcoming</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{relevantWorkflows.reduce((s, w) => s + w.tasks, 0)}</div>
          <div className="text-xs text-amber-600 font-medium">Total Tasks</div>
        </div>
      </div>

      {/* Workflow cards */}
      <div className="space-y-3">
        {relevantWorkflows.map(wf => {
          const WfIcon = wf.icon;
          const st = WF_STATUS_STYLES[wf.status] || WF_STATUS_STYLES.active;
          return (
            <div key={wf.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition">
              <div className="flex items-center gap-4">
                <div onClick={() => setSelectedWorkflow(wf.id)} className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: wf.color + "15" }}>
                    <WfIcon size={22} style={{ color: wf.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{wf.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{wf.category}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{wf.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{wf.tasks}</div>
                    <div className="text-xs text-gray-500">Tasks</div>
                  </div>
                  <div className="w-24">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-bold" style={{ color: wf.color }}>{wf.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${wf.progress}%`, backgroundColor: wf.color }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-700">{wf.owner}</div>
                    <div className="text-xs text-gray-500">Owner</div>
                  </div>
                  {isAdmin ? (
                    <button onClick={(e) => { e.stopPropagation(); setAssigningWf(wf.id); setAssignSelections({}); setAdminMode("assign"); }}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="Manage assignments">
                      <Move size={18} />
                    </button>
                  ) : (
                    <ChevronRight size={18} className="text-gray-400 cursor-pointer" onClick={() => setSelectedWorkflow(wf.id)} />
                  )}
                </div>
              </div>
              {/* Assigned positions strip */}
              <div className="flex flex-wrap gap-1.5 mt-3 ml-15">
                {isAdmin ? (
                  <>
                    <span className="text-xs text-gray-400 mr-1">Assigned to:</span>
                    {(wf.assignedRoles || []).slice(0, 8).map(rid => (
                      <span key={rid} className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100">{ROLES[rid]?.label || rid}</span>
                    ))}
                    {(wf.assignedRoles || []).length > 8 && (
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-500">+{wf.assignedRoles.length - 8} more</span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-400">Owner: {wf.owner} &middot; {(wf.assignedRoles || []).length} positions involved</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin: No-workflow prompt */}
      {relevantWorkflows.length === 0 && !isAdmin && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No workflows are currently assigned to your position.</p>
          <p className="text-gray-400 text-xs mt-1">The DSS Administrator assigns workflows to relevant positions.</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   APCE VIEW — Hierarchical: Department → Faculty → Registrar
   ══════════════════════════════════════════════════════════ */

function APCEView({ defaultScope = "registrar", expandedTask, setExpandedTask, cascadeTask, setCascadeTask }) {
  const [apceScope, setApceScope] = useState(defaultScope); /* registrar | faculty | department */
  const [selectedFaculty, setSelectedFaculty] = useState(UNIVERSITY_FACULTIES[0].id);
  const [selectedDept, setSelectedDept] = useState(UNIVERSITY_FACULTIES[0].departments[0].id);
  const [expandedDepts, setExpandedDepts] = useState({});
  const [taskOverrides, setTaskOverrides] = useState({}); /* { taskId: { status, note, updatedAt } } */

  /* Apply overrides to a task */
  const applyOverride = (task) => {
    const ov = taskOverrides[task.id];
    if (!ov) return task;
    return { ...task, status: ov.status, _note: ov.note, _updatedAt: ov.updatedAt, _updatedBy: ov.updatedBy };
  };

  /* Update a task's status */
  const updateTaskStatus = (taskId, newStatus, note = "") => {
    setTaskOverrides(prev => ({
      ...prev,
      [taskId]: {
        status: newStatus,
        note: note || (prev[taskId]?.note || ""),
        updatedAt: new Date().toISOString(),
        updatedBy: "Current User",
      }
    }));
  };

  /* Add a note to a task */
  const addTaskNote = (taskId, note) => {
    setTaskOverrides(prev => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        status: prev[taskId]?.status || null,
        note,
        updatedAt: new Date().toISOString(),
        updatedBy: "Current User",
      }
    }));
  };

  /* Helper: compute stats for a set of tasks */
  const getStats = (tasks) => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const atRisk = tasks.filter(t => t.status === "atRisk").length;
    const overdue = tasks.filter(t => t.status === "overdue").length;
    const onTrack = tasks.filter(t => t.status === "onTrack").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, atRisk, overdue, onTrack, pending, pct };
  };

  /* Helper: get phase stats for a set of tasks */
  const getPhaseStats = (tasks, phaseId) => {
    const phaseTasks = tasks.filter(t => t.phase === phaseId);
    return getStats(phaseTasks);
  };

  /* Get current faculty object */
  const currentFaculty = UNIVERSITY_FACULTIES.find(f => f.id === selectedFaculty);
  const currentDept = currentFaculty ? currentFaculty.departments.find(d => d.id === selectedDept) : null;

  /* Gather tasks based on scope — with overrides applied */
  const getTasksForScope = () => {
    let raw;
    if (apceScope === "department") raw = ALL_DEPT_TASKS[selectedDept] || [];
    else if (apceScope === "faculty") {
      const fac = UNIVERSITY_FACULTIES.find(f => f.id === selectedFaculty);
      raw = fac ? fac.departments.flatMap(d => ALL_DEPT_TASKS[d.id] || []) : [];
    } else {
      raw = UNIVERSITY_FACULTIES.flatMap(f => f.departments.flatMap(d => ALL_DEPT_TASKS[d.id] || []));
    }
    return raw.map(applyOverride);
  };

  /* Helper to get overridden tasks for a specific dept */
  const getDeptTasks = (deptId) => (ALL_DEPT_TASKS[deptId] || []).map(applyOverride);

  const scopeTasks = getTasksForScope();
  const scopeStats = getStats(scopeTasks);

  /* Progress bar color based on health */
  const getProgressColor = (pct, atRisk, overdue) => {
    if (overdue > 0) return "#ef4444";
    if (atRisk > 2 || pct < 30) return "#f59e0b";
    return "#3b82f6";
  };

  /* ── Mini progress bar component ── */
  function MiniProgress({ stats, color, label }) {
    const barColor = getProgressColor(stats.pct, stats.atRisk, stats.overdue);
    return (
      <div>
        {label && <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">{label}</span>
          <span className="text-xs font-bold" style={{ color: barColor }}>{stats.pct}%</span>
        </div>}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="h-2 rounded-full transition-all" style={{ width: `${stats.pct}%`, backgroundColor: barColor }} />
        </div>
        <div className="flex gap-3 mt-1 text-xs text-gray-500">
          <span>{stats.completed}/{stats.total} done</span>
          {stats.atRisk > 0 && <span className="text-orange-600">{stats.atRisk} at risk</span>}
          {stats.overdue > 0 && <span className="text-red-600">{stats.overdue} overdue</span>}
        </div>
      </div>
    );
  }

  /* ── Task list component (reused across scopes) ── */
  function TaskList({ tasks, showDept = false }) {
    return (
      <div className="space-y-2">
        {tasks.map(task => {
          const status = TASK_STATUS[task.status] || TASK_STATUS.pending;
          const Icon = status.icon;
          return (
            <div
              key={task.id}
              className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition cursor-pointer"
              style={{ borderLeftColor: status.color, borderLeftWidth: "4px" }}
            >
              <div className="flex items-center justify-between" onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}>
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Icon size={16} color={status.color} className="flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{task.name}</h4>
                    <p className="text-xs text-gray-500">{showDept && task.deptName ? `${task.deptName} · ` : ""}W{task.week} · {task.owner}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
              </div>
              {expandedTask === task.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div><span className="text-gray-500">Task ID</span><p className="font-medium text-gray-900">{task.id}</p></div>
                    <div><span className="text-gray-500">Phase</span><p className="font-medium text-gray-900">{task.phase}</p></div>
                    <div><span className="text-gray-500">Week</span><p className="font-medium text-gray-900">W{task.week}</p></div>
                    <div><span className="text-gray-500">Owner</span><p className="font-medium text-gray-900">{task.owner}</p></div>
                  </div>

                  {/* ── Status Change Controls ── */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-600">Update Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(TASK_STATUS).map(([key, st]) => {
                        const StIcon = st.icon;
                        const isCurrent = task.status === key;
                        return (
                          <button
                            key={key}
                            onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, key); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                              isCurrent ? "ring-2 ring-offset-1" : "hover:shadow-sm"
                            }`}
                            style={{
                              backgroundColor: isCurrent ? st.bg : "#fff",
                              borderColor: isCurrent ? st.color : "#e5e7eb",
                              color: isCurrent ? st.color : "#6b7280",
                              ringColor: isCurrent ? st.color : undefined,
                            }}
                          >
                            <StIcon size={12} />
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                    {task._updatedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last updated: {new Date(task._updatedAt).toLocaleString()} by {task._updatedBy}
                      </p>
                    )}
                  </div>

                  {/* ── Progress Note ── */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-600">Progress Note</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a progress note (e.g., 'Waiting for Finance approval')"
                        defaultValue={task._note || ""}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { addTaskNote(task.id, e.target.value); }
                        }}
                        id={`note-${task.id}`}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const input = document.getElementById(`note-${task.id}`);
                          if (input) addTaskNote(task.id, input.value);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                    {task._note && (
                      <div className="bg-white rounded border border-gray-200 p-2 text-xs text-gray-700 mt-1">
                        <span className="font-medium text-gray-500">Note:</span> {task._note}
                      </div>
                    )}
                  </div>

                  <button onClick={() => setCascadeTask(task.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition">
                    Cascade Analysis
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* ── Header with scope selector ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Academic Process Calendar Engine</h2>
          <p className="text-sm text-gray-600 mt-1">Semester Preparation — Fall 2026 (18 weeks pre-semester)</p>
        </div>
      </div>

      {/* ── Scope selector: 3-level hierarchy ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">View Level</p>
        <div className="flex gap-2 mb-4">
          {[
            { id: "registrar", label: "Registrar (Institutional)", icon: ClipboardCheck, desc: "All faculties & departments" },
            { id: "faculty", label: "Faculty (Dean)", icon: BookOpen, desc: "Departments in one faculty" },
            { id: "department", label: "Department (HoD)", icon: Users, desc: "Single department tasks" },
          ].map(s => {
            const SIcon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setApceScope(s.id)}
                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition text-left ${
                  apceScope === s.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <SIcon size={20} className={apceScope === s.id ? "text-blue-600" : "text-gray-400"} />
                <div>
                  <div className={`text-sm font-semibold ${apceScope === s.id ? "text-blue-900" : "text-gray-700"}`}>{s.label}</div>
                  <div className="text-xs text-gray-500">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Instance selectors */}
        <div className="flex gap-3">
          {(apceScope === "faculty" || apceScope === "department") && (
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Faculty</label>
              <select
                value={selectedFaculty}
                onChange={(e) => {
                  setSelectedFaculty(e.target.value);
                  const fac = UNIVERSITY_FACULTIES.find(f => f.id === e.target.value);
                  if (fac && fac.departments.length > 0) setSelectedDept(fac.departments[0].id);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {UNIVERSITY_FACULTIES.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
          {apceScope === "department" && currentFaculty && (
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {currentFaculty.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Overall Progress ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">
            {apceScope === "registrar" ? "Institutional Progress" : apceScope === "faculty" ? `${currentFaculty?.name} Progress` : `${currentDept?.name} Progress`}
          </h3>
          <div className="text-2xl font-bold" style={{ color: getProgressColor(scopeStats.pct, scopeStats.atRisk, scopeStats.overdue) }}>{scopeStats.pct}%</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div className="h-3 rounded-full transition-all" style={{ width: `${scopeStats.pct}%`, backgroundColor: getProgressColor(scopeStats.pct, scopeStats.atRisk, scopeStats.overdue) }} />
        </div>
        <div className="flex gap-5 text-sm flex-wrap">
          <div><span className="text-gray-500">Completed:</span> <span className="font-bold text-green-600">{scopeStats.completed}/{scopeStats.total}</span></div>
          <div><span className="text-gray-500">On Track:</span> <span className="font-bold text-blue-600">{scopeStats.onTrack}</span></div>
          <div><span className="text-gray-500">At Risk:</span> <span className="font-bold text-orange-600">{scopeStats.atRisk}</span></div>
          {scopeStats.overdue > 0 && <div><span className="text-gray-500">Overdue:</span> <span className="font-bold text-red-600">{scopeStats.overdue}</span></div>}
          <div><span className="text-gray-500">Pending:</span> <span className="font-bold text-indigo-600">{scopeStats.pending}</span></div>
        </div>
      </div>

      {/* ── Phase Progress ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-4">Phase Progress</h3>
        <div className="grid grid-cols-3 gap-4">
          {PHASES.map(phase => {
            const ps = getPhaseStats(scopeTasks, phase.id);
            return (
              <div key={phase.id} className="rounded-lg p-3 border" style={{ backgroundColor: phase.color + "08", borderColor: phase.color + "40" }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-xs">{phase.name}</h4>
                  <span className="text-xs font-bold" style={{ color: phase.color }}>{ps.pct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${ps.pct}%`, backgroundColor: phase.color }} />
                </div>
                <p className="text-xs text-gray-500">{phase.weeks} · {ps.completed}/{ps.total} done</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ SCOPE-SPECIFIC CONTENT ══ */}

      {/* ── REGISTRAR VIEW: All faculties with drill-down ── */}
      {apceScope === "registrar" && (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900">Faculty Overview</h3>
          {UNIVERSITY_FACULTIES.map(fac => {
            const facTasks = fac.departments.flatMap(d => getDeptTasks(d.id));
            const facStats = getStats(facTasks);
            const isExpanded = expandedDepts[fac.id];
            return (
              <div key={fac.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedDepts(prev => ({ ...prev, [fac.id]: !prev[fac.id] }))}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: fac.color }}>{fac.name.split(" ").pop().charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm">{fac.name}</h4>
                      <span className="text-lg font-bold" style={{ color: getProgressColor(facStats.pct, facStats.atRisk, facStats.overdue) }}>{facStats.pct}%</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="h-2 rounded-full transition-all" style={{ width: `${facStats.pct}%`, backgroundColor: fac.color }} />
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500 flex-shrink-0">
                        <span>{fac.departments.length} depts</span>
                        {facStats.atRisk > 0 && <span className="text-orange-600">{facStats.atRisk} at risk</span>}
                        {facStats.overdue > 0 && <span className="text-red-600">{facStats.overdue} overdue</span>}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
                    <p className="text-xs font-medium text-gray-600">Dean: {fac.dean}</p>
                    {fac.departments.map(dept => {
                      const dTasks = getDeptTasks(dept.id);
                      const dStats = getStats(dTasks);
                      const dExpanded = expandedDepts[dept.id];
                      return (
                        <div key={dept.id} className="bg-white rounded-lg border border-gray-200">
                          <div
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition"
                            onClick={() => setExpandedDepts(prev => ({ ...prev, [dept.id]: !prev[dept.id] }))}
                          >
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fac.color }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                                <span className="text-sm font-bold" style={{ color: getProgressColor(dStats.pct, dStats.atRisk, dStats.overdue) }}>{dStats.pct}%</span>
                              </div>
                              <MiniProgress stats={dStats} color={fac.color} />
                            </div>
                            {dExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                          </div>
                          {dExpanded && (
                            <div className="border-t border-gray-100 p-3">
                              <p className="text-xs text-gray-500 mb-2">HoD: {dept.hod} · {dept.students} students · {dept.courses} courses</p>
                              <TaskList tasks={dTasks} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── FACULTY VIEW: Dean sees departments in their faculty ── */}
      {apceScope === "faculty" && currentFaculty && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: currentFaculty.color }}>{currentFaculty.name.split(" ").pop().charAt(0)}</div>
            <div>
              <h3 className="font-bold text-gray-900">{currentFaculty.name}</h3>
              <p className="text-xs text-gray-500">Dean: {currentFaculty.dean} · {currentFaculty.departments.length} departments</p>
            </div>
          </div>

          {currentFaculty.departments.map(dept => {
            const dTasks = getDeptTasks(dept.id);
            const dStats = getStats(dTasks);
            const dExpanded = expandedDepts[`fac-${dept.id}`];
            return (
              <div key={dept.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedDepts(prev => ({ ...prev, [`fac-${dept.id}`]: !prev[`fac-${dept.id}`] }))}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: currentFaculty.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{dept.name}</h4>
                      <span className="text-lg font-bold" style={{ color: getProgressColor(dStats.pct, dStats.atRisk, dStats.overdue) }}>{dStats.pct}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">HoD: {dept.hod} · {dept.students} students · {dept.courses} courses</p>
                    <MiniProgress stats={dStats} color={currentFaculty.color} />
                  </div>
                  {dExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                </div>
                {dExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <TaskList tasks={dTasks} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── DEPARTMENT VIEW: HoD sees their own 30 tasks ── */}
      {apceScope === "department" && currentDept && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">{currentDept.name}</h3>
              <p className="text-xs text-gray-500">HoD: {currentDept.hod} · {currentDept.students} students · {currentDept.courses} courses</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">{TASK_TEMPLATE.length} tasks</span>
              <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-medium">{PHASES.length} phases</span>
            </div>
          </div>
          <TaskList tasks={getDeptTasks(selectedDept)} />
        </div>
      )}

      {/* ── CASCADE IMPACT MODAL ── */}
      {cascadeTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Cascade Impact Analysis</h3>
              <button onClick={() => setCascadeTask(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-gray-700">If task <span className="font-semibold">{cascadeTask}</span> is delayed by 3 days:</p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-orange-900">
                  <span className="font-semibold">4 downstream tasks</span> will shift. Critical milestone{" "}
                  <span className="font-semibold">'Submit timetable to Registrar'</span> delayed by minimum <span className="font-semibold">5 days</span>.
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-900 text-xs">
                  Cascade propagation: Department → Faculty Dean → Registrar (institutional timetable consolidation blocked)
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                <div className="text-gray-700">Affected roles: <span className="font-semibold">HoD, Dean, Registrar</span></div>
                <div className="text-gray-700">Escalation: <span className="font-semibold">HoD → Dean → Provost</span></div>
              </div>
              <button onClick={() => setCascadeTask(null)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FACULTY MONTHLY STATUS REPORTS
   Based on Faculty Responsibilities Policy (12 areas) +
   HoD JD cross-references (attendance, LMS, QA, etc.)
   Hierarchy: Faculty → HoD review → Dean aggregate
   ══════════════════════════════════════════════════════════ */

const FACULTY_REPORT_SECTIONS = [
  { id: "teaching", title: "4.1 Teaching & Course Management", icon: BookOpen, color: "#3b82f6", policyRef: "4.1",
    hodCrossRef: ["Attendance","LMS"],
    fields: [
      { id: "courseOutlineSubmitted", label: "Course outline (CLOs/PLOs) submitted before semester start", type: "select", options: ["Yes","Submitted late","Not yet"] },
      { id: "lecturesDelivered", label: "Lectures delivered this month", type: "number" },
      { id: "lecturesScheduled", label: "Lectures scheduled this month", type: "number" },
      { id: "obeAlignment", label: "Teaching aligned with OBE requirements", type: "select", options: ["Fully aligned","Partially aligned","Needs review"] },
      { id: "curriculumAsPerPlan", label: "Curriculum delivered as per semester/lecture plan", type: "select", options: ["On track","1-2 topics behind","Significantly behind"] },
      { id: "teachingRemarks", label: "Teaching highlights or issues", type: "textarea" },
    ]},
  { id: "attendance", title: "Attendance Monitoring", icon: UserCheck, color: "#059669", policyRef: "4.1/HoD",
    hodCrossRef: ["Attendance"],
    fields: [
      { id: "attendanceMarkedWithin24h", label: "Attendance marked within 24 hours for all classes", type: "select", options: ["Yes — all classes","Partial — some missed","No"] },
      { id: "classesWithAbove75Pct", label: "My classes where student attendance >75% (%)", type: "number", unit: "%" },
      { id: "studentsMissing3Plus", label: "Students in my classes missing 3+ classes in a row", type: "number" },
      { id: "studentsBelow50Pct", label: "Students with cumulative attendance <50%", type: "number" },
      { id: "students51to75Pct", label: "Students with attendance 51%-75%", type: "number" },
      { id: "attendanceActionsTaken", label: "Actions taken for low-attendance students", type: "textarea" },
    ]},
  { id: "lms", title: "LMS Compliance", icon: Monitor, color: "#7c3aed", policyRef: "4.1/HoD",
    hodCrossRef: ["LMS"],
    fields: [
      { id: "lmsCourseInfoComplete", label: "Course info complete on LMS (outline, books, description)", type: "select", options: ["Yes — all courses","Partial","Not uploaded"] },
      { id: "lmsGradeTemplate", label: "Grade assessment template updated on LMS", type: "select", options: ["Yes","Partially","Not updated"] },
      { id: "lmsWeeklyPlanUploaded", label: "Weekly lecture plan uploaded on LMS", type: "select", options: ["Yes — up to date","Behind by 1-2 weeks","Not uploaded"] },
      { id: "lmsGradingInstrUploaded", label: "Grading instruments uploaded on time", type: "select", options: ["Yes","Partially","Not yet"] },
      { id: "lmsCoursePackAvail", label: "Course pack available on LMS", type: "select", options: ["Yes","In progress","Not available"] },
      { id: "lmsMidtermReviewed", label: "Midterms reviewed for coverage & level", type: "select", options: ["Yes — reviewed","Not yet due","Not applicable"] },
      { id: "lmsRemarks", label: "LMS issues or notes", type: "textarea" },
    ]},
  { id: "assessment", title: "4.2 Assessment & Evaluation", icon: ClipboardCheck, color: "#8b5cf6", policyRef: "4.2",
    hodCrossRef: ["LMS","Quality Assurance"],
    fields: [
      { id: "quizzesGiven", label: "Quizzes conducted this month", type: "number" },
      { id: "assignmentsGiven", label: "Assignments given this month", type: "number" },
      { id: "feedbackProvided", label: "Timely feedback provided to students", type: "select", options: ["Within 1 week","Within 2 weeks","Delayed"] },
      { id: "gradesSubmitted", label: "Grades submitted within prescribed deadlines", type: "select", options: ["Yes","Late by <1 week","Overdue"] },
      { id: "assessmentRemarks", label: "Assessment issues or notes", type: "textarea" },
    ]},
  { id: "counseling", title: "4.3 Student Counseling & Mentorship", icon: Heart, color: "#f43f5e", policyRef: "4.3",
    hodCrossRef: ["Students"],
    fields: [
      { id: "advisingSessions", label: "Academic advising sessions held this month", type: "number" },
      { id: "studentsAdvised", label: "Number of students advised", type: "number" },
      { id: "vulnerableStudentsIdentified", label: "Vulnerable/at-risk students identified", type: "number" },
      { id: "supportActionsReferred", label: "Students referred for additional support", type: "number" },
      { id: "advisingRecordsMaintained", label: "Advising records maintained", type: "select", options: ["Yes — up to date","Partial","Not maintained"] },
      { id: "counselingRemarks", label: "Counseling highlights or concerns", type: "textarea" },
    ]},
  { id: "officehours", title: "4.4 Office Hours & Student Support", icon: Clock, color: "#0891b2", policyRef: "4.4",
    hodCrossRef: ["Attendance"],
    fields: [
      { id: "officeHoursAnnounced", label: "Weekly office hours announced to students", type: "select", options: ["Yes","Partially","Not announced"] },
      { id: "officeHoursObserved", label: "Office hours observed this month (out of scheduled)", type: "text" },
      { id: "weakStudentsSupported", label: "Academically weak students given extra support", type: "number" },
      { id: "officeHoursRemarks", label: "Office hours notes", type: "textarea" },
    ]},
  { id: "supervision", title: "4.5 Supervision of Projects & Research", icon: Target, color: "#10b981", policyRef: "4.5",
    hodCrossRef: [],
    fields: [
      { id: "ugProjectsSupervised", label: "UG projects currently supervising", type: "number" },
      { id: "pgProjectsSupervised", label: "PG theses currently supervising", type: "number" },
      { id: "supervisionMeetings", label: "Supervision meetings held this month", type: "number" },
      { id: "vivaParticipation", label: "Participated in viva/thesis defenses", type: "number" },
      { id: "supervisionRemarks", label: "Supervision notes", type: "textarea" },
    ]},
  { id: "research", title: "4.6 Research & Scholarly Activities", icon: Lightbulb, color: "#ec4899", policyRef: "4.6",
    hodCrossRef: ["Faculty Research"],
    fields: [
      { id: "papersPublished", label: "Papers published (HEC-recognized)", type: "number" },
      { id: "papersSubmitted", label: "Papers submitted/under review", type: "number" },
      { id: "conferencesAttended", label: "Conferences/seminars/workshops attended", type: "number" },
      { id: "grantProposalsSubmitted", label: "Grant/funding proposals submitted", type: "number" },
      { id: "grantProposalsActive", label: "Active funded research projects", type: "number" },
      { id: "researchRemarks", label: "Research highlights", type: "textarea" },
    ]},
  { id: "institutional", title: "4.7 Institutional Service & Committees", icon: Shield, color: "#f59e0b", policyRef: "4.7",
    hodCrossRef: ["Quality Assurance"],
    fields: [
      { id: "committeesServing", label: "Committees currently serving on", type: "number" },
      { id: "committeeMeetings", label: "Committee meetings attended this month", type: "number" },
      { id: "curriculumContribution", label: "Contributed to curriculum development/review", type: "select", options: ["Yes","Not this month","N/A"] },
      { id: "qaActivities", label: "QA/accreditation activities supported", type: "select", options: ["Active participation","Minor involvement","None this month"] },
      { id: "institutionalRemarks", label: "Institutional service notes", type: "textarea" },
    ]},
  { id: "meetings", title: "4.8 Meetings & Academic Participation", icon: Briefcase, color: "#d97706", policyRef: "4.8",
    hodCrossRef: ["Meetings"],
    fields: [
      { id: "deptMeetingsAttended", label: "Department meetings attended", type: "number" },
      { id: "facultyMeetingsAttended", label: "Faculty-level meetings attended", type: "number" },
      { id: "universityMeetingsAttended", label: "University-level meetings attended", type: "number" },
      { id: "meetingsRemarks", label: "Key contributions in meetings", type: "textarea" },
    ]},
  { id: "studentactivities", title: "4.9 Student Activities & Clubs", icon: Award, color: "#a855f7", policyRef: "4.9",
    hodCrossRef: [],
    fields: [
      { id: "clubsAdvising", label: "Student societies/clubs advising", type: "number" },
      { id: "eventsSupported", label: "Co-curricular/extracurricular events supported", type: "number" },
      { id: "activitiesRemarks", label: "Activities highlights", type: "textarea" },
    ]},
  { id: "industry", title: "4.10 Industry Liaison & Community", icon: Globe, color: "#9333ea", policyRef: "4.10",
    hodCrossRef: ["Industrial Linkages"],
    fields: [
      { id: "industryContacts", label: "Industry contacts/meetings this month", type: "number" },
      { id: "internshipsFacilitated", label: "Internships facilitated for students", type: "number" },
      { id: "guestLecturesArranged", label: "Guest lectures/study tours arranged", type: "number" },
      { id: "communityOutreach", label: "Community outreach activities", type: "number" },
      { id: "industryRemarks", label: "Industry/community engagement notes", type: "textarea" },
    ]},
  { id: "admin", title: "4.11 Administrative Responsibilities", icon: Settings, color: "#6b7280", policyRef: "4.11",
    hodCrossRef: ["Department Administration"],
    fields: [
      { id: "policyCompliance", label: "Compliance with university rules & policies", type: "select", options: ["Fully compliant","Minor issues","Action required"] },
      { id: "documentsMaintained", label: "Documentation and records maintained", type: "select", options: ["Up to date","Partially","Needs attention"] },
      { id: "admissionsSupport", label: "Supported admissions/examination processes", type: "select", options: ["Yes","Not required this month","No"] },
      { id: "adminRemarks", label: "Administrative notes", type: "textarea" },
    ]},
  { id: "profdev", title: "4.12 Professional Development", icon: TrendingUp, color: "#0ea5e9", policyRef: "4.12",
    hodCrossRef: [],
    fields: [
      { id: "fdpAttended", label: "Faculty development programs attended", type: "number" },
      { id: "workshopsAttended", label: "Workshops/trainings attended", type: "number" },
      { id: "innovativeMethods", label: "Innovative teaching methods adopted", type: "textarea" },
      { id: "profdevRemarks", label: "Professional development notes", type: "textarea" },
    ]},
];

/* Mock faculty members per department */
const DEPT_FACULTY = {};
UNIVERSITY_FACULTIES.forEach(fac => {
  fac.departments.forEach(dept => {
    const seed = dept.id.charCodeAt(0);
    const count = 6 + (seed % 5);
    const titles = ["Dr.","Dr.","Dr.","Prof.","Dr.","Dr.","Prof.","Dr.","Dr.","Dr.","Dr."];
    const firstNames = ["Ayesha","Usman","Fatima","Ali","Nadia","Bilal","Sara","Khalid","Hira","Imran","Zain"];
    const lastNames = ["Malik","Raza","Noor","Hassan","Shah","Qureshi","Farooq","Javed","Ahmed","Khan","Iqbal"];
    DEPT_FACULTY[dept.id] = Array.from({ length: count }, (_, i) => ({
      id: `${dept.id}-fac-${i}`,
      name: `${titles[i % titles.length]} ${firstNames[(i + seed) % firstNames.length]} ${lastNames[(i + seed + 3) % lastNames.length]}`,
      designation: ["Lecturer","Assistant Professor","Associate Professor","Professor","Assistant Professor","Lecturer","Associate Professor","Assistant Professor","Lecturer","Professor","Lecturer"][i % 11],
      courses: 2 + (i % 3),
      reportStatus: i < 3 ? "submitted" : i < 5 ? "draft" : "not_submitted",
    }));
  });
});

/* Populate DEFAULT_ORG HoD nodes with individual faculty members */
(function populateOrgFacultyMembers() {
  const findNode = (node, targetId) => {
    if (node.id === targetId) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child, targetId);
        if (found) return found;
      }
    }
    return null;
  };
  UNIVERSITY_FACULTIES.forEach(fac => {
    fac.departments.forEach(dept => {
      const hodNode = findNode(DEFAULT_ORG, `hod-${dept.id}`);
      if (hodNode) {
        hodNode.children = (DEPT_FACULTY[dept.id] || []).map(m => ({
          id: m.id, label: m.name, type: "faculty-member"
        }));
      }
    });
  });
})();

/* Dynamic ROLES for specific Deans, HoDs, and Faculty Members */
UNIVERSITY_FACULTIES.forEach(fac => {
  ROLES[`dean-${fac.id}`] = {
    label: `Dean — ${fac.name.replace("Faculty of ","")}`,
    icon: BookOpen, color: "#db2777",
    subtitle: `${fac.name} — Academic & Research Oversight`,
    tier: "Academic", reportsTo: "Provost",
    coordinates: fac.departments.map(d => `HoD ${d.name}`),
  };
  fac.departments.forEach(dept => {
    ROLES[`hod-${dept.id}`] = {
      label: `HoD — ${dept.name}`,
      icon: Users, color: "#e11d48",
      subtitle: `${dept.name} — ${dept.students} students, ${dept.courses} courses`,
      tier: "Academic", reportsTo: `Dean — ${fac.name.replace("Faculty of ","")}`,
      coordinates: ["Faculty", "Labs", "Registrar", "Students"],
    };
  });
});

/* Add faculty member entries to ROLES */
UNIVERSITY_FACULTIES.forEach(fac => {
  fac.departments.forEach(dept => {
    (DEPT_FACULTY[dept.id] || []).forEach(m => {
      ROLES[m.id] = {
        label: m.name,
        icon: GraduationCap, color: "#6366f1",
        subtitle: `${m.designation} — ${dept.name} (${m.courses} courses)`,
        tier: "Faculty", reportsTo: `HoD ${dept.name}`,
        coordinates: ["HoD", "Students", "Colleagues"],
      };
    });
  });
});

/* Generate workspace data for dynamic dean/HoD/faculty roles */
UNIVERSITY_FACULTIES.forEach(fac => {
  WS[`dean-${fac.id}`] = {
    decisions: [
      { id: `D-${fac.id}-01`, title: `Approve course assignments for ${fac.name.replace("Faculty of ","")}`, priority: "high", status: "pending", deadline: "Apr 10", from: "HoDs", impact: "Blocks timetable", recommended: "Review pending submissions" },
      { id: `D-${fac.id}-02`, title: `Faculty recruitment plan — ${fac.departments.length} departments`, priority: "medium", status: "inProgress", deadline: "May 1", from: "HR", impact: "Address faculty shortage", recommended: "Prioritize CS and Physics" },
    ],
    kpis: [
      { name: "Faculty", value: `${fac.departments.reduce((s,d) => s + Math.floor(d.courses * 0.8), 0)}`, target: `${fac.departments.reduce((s,d) => s + d.courses, 0)}`, trend: "up", delta: "Recruiting" },
      { name: "Students", value: `${fac.departments.reduce((s,d) => s + d.students, 0).toLocaleString()}`, target: "Growth", trend: "up", delta: "+5%" },
      { name: "Courses", value: `${fac.departments.reduce((s,d) => s + d.courses, 0)}`, target: "Staffed", trend: "stable", delta: "On track" },
      { name: "Research", value: `${80 + fac.departments.length * 15}`, target: "200", trend: "up", delta: "+8%" },
    ],
    alerts: [
      { type: "warning", title: `${fac.departments.length > 3 ? 2 : 1} department(s) above HEC student-faculty ratio`, message: "Review workload distribution across departments.", action: "Review staffing" },
    ],
    playbook: [
      { title: "Faculty Programme Review", description: "Annual review of all programmes in the faculty.", trigger: "Annual", policy: "PSG-2023" },
    ],
  };
  fac.departments.forEach(dept => {
    const seed = dept.id.charCodeAt(0);
    WS[`hod-${dept.id}`] = {
      decisions: [
        { id: `D-${dept.id}-01`, title: `Assign instructors to ${dept.courses} course sections`, priority: "high", status: "inProgress", deadline: "Apr 5", from: "Planning", impact: "Prerequisite for timetable", recommended: "Review workload balance" },
        { id: `D-${dept.id}-02`, title: `Lab readiness check — ${dept.name}`, priority: "medium", status: "pending", deadline: "Jul 15", from: "Labs", impact: "Blocks practicals", recommended: "Verify equipment" },
      ],
      kpis: [
        { name: "Courses", value: `${dept.courses}`, target: "Staffed", trend: "stable", delta: `${2 + seed % 3} need instructors` },
        { name: "Students", value: `${dept.students}`, target: "Enrolled", trend: "up", delta: "+4%" },
        { name: "Satisfaction", value: `${(3.8 + (seed % 10) * 0.05).toFixed(1)}/5`, target: "4.3", trend: "up", delta: "+0.1" },
        { name: "Lab Ready", value: `${70 + seed % 25}%`, target: "100%", trend: "up", delta: "In progress" },
      ],
      alerts: [
        { type: seed % 3 === 0 ? "critical" : "warning", title: `${1 + seed % 2} faculty at max workload`, message: "Above 15-hour weekly limit.", action: "Reassign sections" },
      ],
      playbook: [
        { title: "Course File Management", description: "Maintain course files per PSG-2023 requirements.", trigger: "Each semester", policy: "PSG-2023" },
      ],
    };
  });
});

/* Workspace data for individual faculty members */
UNIVERSITY_FACULTIES.forEach(fac => {
  fac.departments.forEach(dept => {
    (DEPT_FACULTY[dept.id] || []).forEach(m => {
      const seed = m.id.charCodeAt(m.id.length - 1);
      WS[m.id] = {
        decisions: [
          { id: `D-${m.id}-01`, title: `Submit monthly report for ${new Date().toLocaleString('en',{month:'long'})}`, priority: "high", status: m.reportStatus === "submitted" ? "resolved" : "pending", deadline: "Mar 30", from: "HoD", impact: "Required for HoD aggregation", recommended: "Complete all 14 sections" },
        ],
        kpis: [
          { name: "Courses", value: `${m.courses}`, target: "Scheduled", trend: "stable", delta: "On track" },
          { name: "Lectures", value: `${12 + seed % 8}/${16 + seed % 4}`, target: "100%", trend: "up", delta: `${Math.round((12 + seed % 8) / (16 + seed % 4) * 100)}%` },
          { name: "Research", value: `${seed % 3} papers`, target: "2/semester", trend: seed % 2 === 0 ? "up" : "stable", delta: seed % 2 === 0 ? "+1" : "On track" },
          { name: "Advising", value: `${5 + seed % 10} students`, target: "Assigned", trend: "stable", delta: "Active" },
        ],
        alerts: m.reportStatus === "not_submitted" ? [
          { type: "warning", title: "Monthly report not yet submitted", message: `Report for ${new Date().toLocaleString('en',{month:'long'})} is pending. Due by end of month.`, action: "Submit report" },
        ] : [],
        playbook: [
          { title: "Monthly Faculty Report", description: "Submit monthly status report covering all 14 responsibility areas.", trigger: "Monthly", policy: "Faculty Responsibilities Policy" },
        ],
      };
    });
  });
});

/* Generate mock faculty report data */
const generateFacultyReport = (facultyId) => {
  const seed = facultyId.charCodeAt(5) || 42;
  return {
    /* Teaching */
    lecturesDelivered: 12 + (seed % 8),
    lecturesScheduled: 16 + (seed % 4),
    /* Attendance Monitoring */
    attendanceMarkedWithin24h: ["Yes — all classes","Partial — some missed","Yes — all classes"][seed % 3],
    classesWithAbove75Pct: 70 + (seed % 28),
    studentsMissing3Plus: seed % 6,
    studentsBelow50Pct: seed % 3,
    students51to75Pct: 2 + (seed % 5),
    /* LMS Compliance */
    lmsCourseInfoComplete: ["Yes — all courses","Partial","Yes — all courses"][seed % 3],
    lmsGradeTemplate: ["Yes","Partially","Yes"][seed % 3],
    lmsWeeklyPlanUploaded: ["Yes — up to date","Behind by 1-2 weeks","Yes — up to date"][seed % 3],
    lmsGradingInstrUploaded: ["Yes","Partially","Yes"][seed % 3],
    lmsCoursePackAvail: ["Yes","In progress","Yes"][seed % 3],
    /* Assessment */
    quizzesGiven: 1 + (seed % 3),
    assignmentsGiven: 2 + (seed % 2),
    feedbackProvided: ["Within 1 week","Within 2 weeks","Within 1 week"][seed % 3],
    gradesSubmitted: ["Yes","Late by <1 week","Yes"][seed % 3],
    /* Counseling */
    advisingSessions: 2 + (seed % 6),
    studentsAdvised: 5 + (seed % 10),
    vulnerableStudentsIdentified: seed % 4,
    supportActionsReferred: seed % 3,
    /* Office Hours */
    officeHoursAnnounced: ["Yes","Partially","Yes"][seed % 3],
    weakStudentsSupported: 1 + (seed % 4),
    /* Supervision */
    ugProjectsSupervised: seed % 4,
    pgProjectsSupervised: seed % 2,
    supervisionMeetings: 2 + (seed % 4),
    /* Research */
    papersPublished: seed % 2,
    papersSubmitted: seed % 3,
    conferencesAttended: seed % 2,
    grantProposalsSubmitted: seed % 2,
    grantProposalsActive: seed % 2,
    /* Institutional */
    committeesServing: 1 + (seed % 3),
    committeeMeetings: 1 + (seed % 3),
    /* Meetings */
    deptMeetingsAttended: 1 + (seed % 2),
    facultyMeetingsAttended: seed % 2,
    /* Activities */
    clubsAdvising: seed % 2,
    eventsSupported: seed % 3,
    /* Industry */
    industryContacts: seed % 3,
    internshipsFacilitated: seed % 2,
    guestLecturesArranged: seed % 2,
    /* Professional Development */
    fdpAttended: seed % 2,
    workshopsAttended: seed % 2,
  };
};

/* ══════════════════════════════════════════════════════════
   FACULTY REPORTING SYSTEM — DATA CONSTANTS
   ══════════════════════════════════════════════════════════ */
const REPORTING_DEPARTMENTS = [
  { id: 'cs', name: 'Computer Science', hodName: 'Dr. Ahmed Hassan' },
  { id: 'ee', name: 'Electrical Engineering', hodName: 'Dr. Fatima Khan' },
  { id: 'ba', name: 'Business Administration', hodName: 'Dr. Muhammad Ali' },
  { id: 'ce', name: 'Civil Engineering', hodName: 'Dr. Sarah Ahmed' },
  { id: 'math', name: 'Mathematics', hodName: 'Dr. Hassan Malik' },
];

const REPORTING_FACULTY = [
  { id: 'f1', name: 'Dr. Rashid Usman', department: 'cs', email: 'rashid@must.edu.pk', designation: 'Assistant Professor' },
  { id: 'f2', name: 'Dr. Amina Hassan', department: 'cs', email: 'amina@must.edu.pk', designation: 'Associate Professor' },
  { id: 'f3', name: 'Dr. Ali Raza', department: 'cs', email: 'ali@must.edu.pk', designation: 'Lecturer' },
  { id: 'f4', name: 'Dr. Saira Muhammad', department: 'ee', email: 'saira@must.edu.pk', designation: 'Assistant Professor' },
  { id: 'f5', name: 'Dr. Hassan Khan', department: 'ee', email: 'hassan@must.edu.pk', designation: 'Associate Professor' },
  { id: 'f6', name: 'Dr. Nida Akram', department: 'ee', email: 'nida@must.edu.pk', designation: 'Lecturer' },
  { id: 'f7', name: 'Dr. Bilal Ahmed', department: 'ba', email: 'bilal@must.edu.pk', designation: 'Professor' },
  { id: 'f8', name: 'Dr. Hira Malik', department: 'ba', email: 'hira@must.edu.pk', designation: 'Assistant Professor' },
  { id: 'f9', name: 'Dr. Omar Hassan', department: 'ce', email: 'omar@must.edu.pk', designation: 'Lecturer' },
  { id: 'f10', name: 'Dr. Zainab Khan', department: 'ce', email: 'zainab@must.edu.pk', designation: 'Associate Professor' },
];

const REPORTING_SAMPLE_REPORT = {
  classesScheduled: 24,
  classesDelivered: 23,
  attendanceMarkingCompliance: true,
  attendanceMarkingPercentage: 95,
  studentsFlaggedLowAttendance: 2,
  studentsMissing3Classes: 1,
  lmsCompliance: {
    courseOutlineUploaded: true,
    gradeAssessmentTemplateUpdated: true,
    weeklyLecturePlanUploaded: true,
    coursePackAvailable: true,
  },
  curriculumOnTrack: true,
  curriculumComments: 'Delivery is on schedule with all planned topics covered.',
  assessmentsQuizzes: 4,
  assessmentsAssignments: 3,
  assessmentsMidterm: true,
  assessmentsFinal: false,
  gradingInstrumentsOnTime: true,
  gradesSubmittedOnTime: true,
  midtermReviewAppropriate: true,
  feedbackProvidedStudents: true,
  feedbackMethod: 'Written comments and in-class discussion',
  assessmentComments: 'All assessments conducted as per course plan.',
  studentsAssignedAdvising: 15,
  advisingSessionsHeld: 8,
  vulnerableStudentsIdentified: 2,
  supportActionsTaken: 'Arranged peer tutoring and referred to counseling services',
  counselingTopics: ['course_selection', 'academic_progress', 'career_planning'],
  counselingComments: 'Students are responding well to support measures.',
  officeHoursAnnounced: true,
  officeHoursPerWeek: 4,
  studentConsultations: 12,
  academicWeakStudentSupport: true,
  academicWeakDetails: 'Extra practice sessions and study materials provided',
  fypSupervised: 2,
  pgThesisSupervised: 1,
  industryPartneredProjects: 1,
  progressReviewsConducted: 4,
  vivaDefensesParticipated: 2,
  projectComments: 'All projects progressing well.',
  papersPublished: [{ id: '1', journalName: 'IEEE Transactions', hecRecognized: true, impactFactor: '3.2' }],
  papersSubmitted: 1,
  conferencePapersPresented: 1,
  grantsAppliedFor: 1,
  grantsAppliedAmount: 500000,
  grantsActive: 1,
  grantsActiveAmount: 1200000,
  conferencesAttended: ['International Conference on Computing'],
  researchComments: 'Good research output this month.',
  committeesServed: 'Curriculum Committee (Member), Quality Committee (Chair)',
  curriculumActivities: 'Review of CS101 course curriculum',
  qecActivities: 'Participated in semester quality review meeting',
  accreditationWork: 'Supported NCEAC accreditation documentation',
  selfAssessmentActivities: 'Completed self-assessment questionnaire',
  institutionalComments: 'Active participation in institutional initiatives.',
  departmentMeetingsAttended: 2,
  departmentMeetingsTotal: 2,
  facultyMeetingsAttended: 1,
  universityMeetingsAttended: 1,
  keyContributions: 'Proposed new curriculum improvement initiative',
  societiesAdvised: 'Programming Club, AI Society',
  coCurricularEventsFacilitated: 'Code competition, Seminar on Machine Learning',
  studentCompetitions: 'National Programming Olympiad (organized)',
  activitiesComments: 'Good engagement with student activities',
  industryVisits: 2,
  industryOrganizations: 'Tech Corp, Software Solutions Inc',
  guestLecturesFacilitated: 2,
  internshipPlacementsFacilitated: 3,
  studyToursOrganized: 0,
  communityOutreach: 'Conducted workshop on cybersecurity for school students',
  softSkillsActivities: 'Delivered presentation on professional communication',
  industryComments: 'Strong industry connections maintained.',
  admissionsSupport: 'Reviewed 15 applications for graduate program',
  examinationDuties: 'Conducted final exams and supervised 2 exam sessions',
  documentationMaintained: 'Updated course materials and student records',
  auditInspectionSupport: 'Prepared documentation for academic audit',
  complianceIssues: 'None',
  trainingPrograms: ['Advanced Teaching Methods Workshop', 'Research Grant Writing'],
  pdWorkshopsAttended: ['Data Science Trends Conference'],
  teachingInnovations: 'Implemented flipped classroom model in one course',
  certificationObtained: 'None this month',
  pdComments: 'Continuous professional growth',
  overallAssessment: { teaching: 4, research: 4, service: 4, studentSupport: 4 },
  keyAchievements: 'Published one paper, maintained strong student support, active in committees',
  challengesFaced: 'Managing multiple responsibilities due to teaching load increase',
  supportNeeded: 'Need additional teaching assistant for lab sessions',
  plansNextMonth: 'Submit two more papers, increase industry collaboration projects',
};

/* ══════════════════════════════════════════════════════════
   FACULTY REPORTING SYSTEM — 13 SECTION COMPONENTS
   ══════════════════════════════════════════════════════════ */

function TeachingSection({ data, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">1. Teaching & Course Management</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Classes Scheduled</label>
          <input type="number" value={data.classesScheduled || ''} onChange={(e) => onChange({ ...data, classesScheduled: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Classes Delivered</label>
          <input type="number" value={data.classesDelivered || ''} onChange={(e) => onChange({ ...data, classesDelivered: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.attendanceMarkingCompliance || false} onChange={(e) => onChange({ ...data, attendanceMarkingCompliance: e.target.checked })} className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">Attendance Marking Compliance</span>
        </label>
        {data.attendanceMarkingCompliance && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">% Classes Marked within 24hrs</label>
            <input type="number" min="0" max="100" value={data.attendanceMarkingPercentage || ''} onChange={(e) => onChange({ ...data, attendanceMarkingPercentage: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Students Flagged for Low Attendance (&lt;75%)</label>
          <input type="number" value={data.studentsFlaggedLowAttendance || ''} onChange={(e) => onChange({ ...data, studentsFlaggedLowAttendance: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Students Missing 3+ Consecutive Classes</label>
          <input type="number" value={data.studentsMissing3Classes || ''} onChange={(e) => onChange({ ...data, studentsMissing3Classes: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">LMS Compliance</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'courseOutlineUploaded', label: 'Course Outline Uploaded' },
            { key: 'gradeAssessmentTemplateUpdated', label: 'Grade Assessment Template Updated' },
            { key: 'weeklyLecturePlanUploaded', label: 'Weekly Lecture Plan Uploaded' },
            { key: 'coursePackAvailable', label: 'Course Pack Available' },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={data.lmsCompliance?.[item.key] || false} onChange={(e) => onChange({ ...data, lmsCompliance: { ...data.lmsCompliance, [item.key]: e.target.checked } })} className="w-4 h-4" />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.curriculumOnTrack || false} onChange={(e) => onChange({ ...data, curriculumOnTrack: e.target.checked })} className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">Curriculum Delivery On Track Per Lecture Plan</span>
        </label>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
          <textarea value={data.curriculumComments || ''} onChange={(e) => onChange({ ...data, curriculumComments: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function AssessmentSection({ data, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">2. Assessment & Evaluation</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { key: 'assessmentsQuizzes', label: 'Quizzes' },
          { key: 'assessmentsAssignments', label: 'Assignments' },
          { key: 'assessmentsMidterm', label: 'Midterm' },
          { key: 'assessmentsFinal', label: 'Final' },
        ].map((item) => (
          <div key={item.key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">{item.label}</label>
            {item.key.includes('Midterm') || item.key.includes('Final') ? (
              <input type="checkbox" checked={data[item.key] || false} onChange={(e) => onChange({ ...data, [item.key]: e.target.checked })} className="w-4 h-4" />
            ) : (
              <input type="number" value={data[item.key] || ''} onChange={(e) => onChange({ ...data, [item.key]: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" />
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.gradingInstrumentsOnTime || false} onChange={(e) => onChange({ ...data, gradingInstrumentsOnTime: e.target.checked })} className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">Grading Instruments Uploaded On Time</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.gradesSubmittedOnTime || false} onChange={(e) => onChange({ ...data, gradesSubmittedOnTime: e.target.checked })} className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">Grades Submitted Within Deadline</span>
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.midtermReviewAppropriate || false} onChange={(e) => onChange({ ...data, midtermReviewAppropriate: e.target.checked })} className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">Midterm Review Appropriate</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.feedbackProvidedStudents || false} onChange={(e) => onChange({ ...data, feedbackProvidedStudents: e.target.checked })} className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">Feedback Provided to Students</span>
        </label>
      </div>
      {data.feedbackProvidedStudents && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Method</label>
          <input type="text" value={data.feedbackMethod || ''} onChange={(e) => onChange({ ...data, feedbackMethod: e.target.value })} placeholder="e.g., Written comments, in-class discussion" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
        <textarea value={data.assessmentComments || ''} onChange={(e) => onChange({ ...data, assessmentComments: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
    </div>
  );
}

function CounselingSection({ data, onChange }) {
  const counselingTopics = [
    { value: 'course_selection', label: 'Course Selection' },
    { value: 'career_planning', label: 'Career Planning' },
    { value: 'academic_progress', label: 'Academic Progress' },
    { value: 'personal_challenges', label: 'Personal Challenges' },
  ];
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">3. Student Counseling & Mentorship</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Students Assigned for Advising</label>
          <input type="number" value={data.studentsAssignedAdvising || ''} onChange={(e) => onChange({ ...data, studentsAssignedAdvising: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Advising Sessions Held This Month</label>
          <input type="number" value={data.advisingSessionsHeld || ''} onChange={(e) => onChange({ ...data, advisingSessionsHeld: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vulnerable/At-Risk Students Identified</label>
          <input type="number" value={data.vulnerableStudentsIdentified || ''} onChange={(e) => onChange({ ...data, vulnerableStudentsIdentified: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Support Actions Taken</label>
          <input type="text" value={data.supportActionsTaken || ''} onChange={(e) => onChange({ ...data, supportActionsTaken: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Counseling Topics Covered</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {counselingTopics.map((topic) => (
            <label key={topic.value} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={data.counselingTopics?.includes(topic.value) || false} onChange={(e) => { const topics = data.counselingTopics || []; onChange({ ...data, counselingTopics: e.target.checked ? [...topics, topic.value] : topics.filter((t) => t !== topic.value) }); }} className="w-4 h-4" />
              <span className="text-sm text-gray-700">{topic.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
        <textarea value={data.counselingComments || ''} onChange={(e) => onChange({ ...data, counselingComments: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
    </div>
  );
}

function OfficeHoursSection({ data, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">4. Office Hours & Student Support</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.officeHoursAnnounced || false} onChange={(e) => onChange({ ...data, officeHoursAnnounced: e.target.checked })} className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">Weekly Office Hours Announced</span>
        </label>
        {data.officeHoursAnnounced && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Office Hours Per Week</label>
            <input type="number" value={data.officeHoursPerWeek || ''} onChange={(e) => onChange({ ...data, officeHoursPerWeek: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Student Consultations This Month</label>
          <input type="number" value={data.studentConsultations || ''} onChange={(e) => onChange({ ...data, studentConsultations: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.academicWeakStudentSupport || false} onChange={(e) => onChange({ ...data, academicWeakStudentSupport: e.target.checked })} className="w-4 h-4" />
          <span className="text-sm font-medium text-gray-700">Support for Weak Students</span>
        </label>
      </div>
      {data.academicWeakStudentSupport && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
          <textarea value={data.academicWeakDetails || ''} onChange={(e) => onChange({ ...data, academicWeakDetails: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      )}
    </div>
  );
}

function ResearchSection({ data, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">5. Supervision of Projects & Research</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">FYPs Supervised (UG)</label>
          <input type="number" value={data.fypSupervised || ''} onChange={(e) => onChange({ ...data, fypSupervised: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Thesis Supervised (PG)</label>
          <input type="number" value={data.pgThesisSupervised || ''} onChange={(e) => onChange({ ...data, pgThesisSupervised: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Industry-Partnered Projects</label>
          <input type="number" value={data.industryPartneredProjects || ''} onChange={(e) => onChange({ ...data, industryPartneredProjects: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Progress Reviews Conducted</label>
          <input type="number" value={data.progressReviewsConducted || ''} onChange={(e) => onChange({ ...data, progressReviewsConducted: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Viva Voce / Thesis Defenses Participated</label>
        <input type="number" value={data.vivaDefensesParticipated || ''} onChange={(e) => onChange({ ...data, vivaDefensesParticipated: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
        <textarea value={data.projectComments || ''} onChange={(e) => onChange({ ...data, projectComments: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
    </div>
  );
}

function ScholarlySection({ data, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">6. Research & Scholarly Activities</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Papers Submitted/Under Review</label>
          <input type="number" value={data.papersSubmitted || ''} onChange={(e) => onChange({ ...data, papersSubmitted: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Conference Papers Presented</label>
          <input type="number" value={data.conferencePapersPresented || ''} onChange={(e) => onChange({ ...data, conferencePapersPresented: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Research Grants Applied For (Count)</label>
          <input type="number" value={data.grantsAppliedFor || ''} onChange={(e) => onChange({ ...data, grantsAppliedFor: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Applied For (Amount PKR)</label>
          <input type="number" value={data.grantsAppliedAmount || ''} onChange={(e) => onChange({ ...data, grantsAppliedAmount: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Research Grants Active (Count)</label>
          <input type="number" value={data.grantsActive || ''} onChange={(e) => onChange({ ...data, grantsActive: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Active Grants (Amount PKR)</label>
          <input type="number" value={data.grantsActiveAmount || ''} onChange={(e) => onChange({ ...data, grantsActiveAmount: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Conferences/Seminars/Workshops Attended</label>
        <textarea value={data.conferencesAttended?.join('\n') || ''} onChange={(e) => onChange({ ...data, conferencesAttended: e.target.value.split('\n').filter((c) => c.trim()) })} rows="3" placeholder="Enter one per line" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
        <textarea value={data.researchComments || ''} onChange={(e) => onChange({ ...data, researchComments: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
    </div>
  );
}

function InstitutionalSection({ data, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">7. Institutional Service & Committees</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Committees Served On</label>
          <textarea value={data.committeesServed || ''} onChange={(e) => onChange({ ...data, committeesServed: e.target.value })} rows="2" placeholder="e.g., Committee Name (Role)" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Curriculum Development/Review Activities</label>
          <textarea value={data.curriculumActivities || ''} onChange={(e) => onChange({ ...data, curriculumActivities: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">QEC Activities Participated In</label>
          <textarea value={data.qecActivities || ''} onChange={(e) => onChange({ ...data, qecActivities: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Accreditation-Related Work</label>
          <textarea value={data.accreditationWork || ''} onChange={(e) => onChange({ ...data, accreditationWork: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Self-Assessment Review Activities</label>
          <textarea value={data.selfAssessmentActivities || ''} onChange={(e) => onChange({ ...data, selfAssessmentActivities: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
          <textarea value={data.institutionalComments || ''} onChange={(e) => onChange({ ...data, institutionalComments: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function MeetingsSection({ data, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">8. Meetings & Academic Participation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department Meetings Attended / Total</label>
          <div className="flex gap-2">
            <input type="number" value={data.departmentMeetingsAttended || ''} onChange={(e) => onChange({ ...data, departmentMeetingsAttended: parseInt(e.target.value) || 0 })} placeholder="Attended" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
            <span className="flex items-center text-gray-600">/</span>
            <input type="number" value={data.departmentMeetingsTotal || ''} onChange={(e) => onChange({ ...data, departmentMeetingsTotal: parseInt(e.target.value) || 0 })} placeholder="Total" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Faculty Meetings Attended</label>
          <input type="number" value={data.facultyMeetingsAttended || ''} onChange={(e) => onChange({ ...data, facultyMeetingsAttended: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">University-Level Meetings Attended</label>
          <input type="number" value={data.universityMeetingsAttended || ''} onChange={(e) => onChange({ ...data, universityMeetingsAttended: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Key Contributions/Decisions</label>
        <textarea value={data.keyContributions || ''} onChange={(e) => onChange({ ...data, keyContributions: e.target.value })} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
      </div>
    </div>
  );
}

function ActivitiesSection({ data, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">9. Student Activities & Clubs</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Societies/Clubs Advised</label>
          <textarea value={data.societiesAdvised || ''} onChange={(e) => onChange({ ...data, societiesAdvised: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Co-Curricular Events Facilitated</label>
          <textarea value={data.coCurricularEventsFacilitated || ''} onChange={(e) => onChange({ ...data, coCurricularEventsFacilitated: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Student Competitions/Hackathons Facilitated</label>
          <textarea value={data.studentCompetitions || ''} onChange={(e) => onChange({ ...data, studentCompetitions: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
          <textarea value={data.activitiesComments || ''} onChange={(e) => onChange({ ...data, activitiesComments: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function IndustrySection({ data, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">10. Industry Liaison & Community Engagement</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Industry Visits/Interactions Count</label>
          <input type="number" value={data.industryVisits || ''} onChange={(e) => onChange({ ...data, industryVisits: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Organizations Involved</label>
          <input type="text" value={data.industryOrganizations || ''} onChange={(e) => onChange({ ...data, industryOrganizations: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Guest Lectures Facilitated</label>
          <input type="number" value={data.guestLecturesFacilitated || ''} onChange={(e) => onChange({ ...data, guestLecturesFacilitated: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Internship Placements Facilitated</label>
          <input type="number" value={data.internshipPlacementsFacilitated || ''} onChange={(e) => onChange({ ...data, internshipPlacementsFacilitated: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Study Tours Organized</label>
          <input type="number" value={data.studyToursOrganized || ''} onChange={(e) => onChange({ ...data, studyToursOrganized: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Community Outreach Activities</label>
          <textarea value={data.communityOutreach || ''} onChange={(e) => onChange({ ...data, communityOutreach: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Soft Skills Enhancement Activities</label>
          <textarea value={data.softSkillsActivities || ''} onChange={(e) => onChange({ ...data, softSkillsActivities: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
          <textarea value={data.industryComments || ''} onChange={(e) => onChange({ ...data, industryComments: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function AdministrativeSection({ data, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">11. Administrative Responsibilities</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Admissions Support Activities</label>
          <textarea value={data.admissionsSupport || ''} onChange={(e) => onChange({ ...data, admissionsSupport: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Examination Duties Performed</label>
          <textarea value={data.examinationDuties || ''} onChange={(e) => onChange({ ...data, examinationDuties: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Documentation/Records Maintained</label>
          <textarea value={data.documentationMaintained || ''} onChange={(e) => onChange({ ...data, documentationMaintained: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Audit/Inspection/Accreditation Visit Support</label>
          <textarea value={data.auditInspectionSupport || ''} onChange={(e) => onChange({ ...data, auditInspectionSupport: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Issues (if any)</label>
          <textarea value={data.complianceIssues || ''} onChange={(e) => onChange({ ...data, complianceIssues: e.target.value })} rows="2" placeholder="Leave blank if none" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function ProfessionalDevelopmentSection({ data, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">12. Professional Development</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Training Programs Attended</label>
          <textarea value={data.trainingPrograms?.join('\n') || ''} onChange={(e) => onChange({ ...data, trainingPrograms: e.target.value.split('\n').filter((c) => c.trim()) })} rows="3" placeholder="Enter one per line with dates if possible" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Workshops/Conferences for PD</label>
          <textarea value={data.pdWorkshopsAttended?.join('\n') || ''} onChange={(e) => onChange({ ...data, pdWorkshopsAttended: e.target.value.split('\n').filter((c) => c.trim()) })} rows="3" placeholder="Enter one per line" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">New Teaching Methods/Innovations Adopted</label>
          <textarea value={data.teachingInnovations || ''} onChange={(e) => onChange({ ...data, teachingInnovations: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Certifications Obtained</label>
          <textarea value={data.certificationObtained || ''} onChange={(e) => onChange({ ...data, certificationObtained: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
          <textarea value={data.pdComments || ''} onChange={(e) => onChange({ ...data, pdComments: e.target.value })} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function SummarySection({ data, onChange }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">Overall Summary & Self-Assessment</h3>
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-4">Self-Assessment Rating (1-5)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'teaching', label: 'Teaching' },
            { key: 'research', label: 'Research' },
            { key: 'service', label: 'Service' },
            { key: 'studentSupport', label: 'Student Support' },
          ].map((item) => (
            <div key={item.key}>
              <label className="block text-xs font-medium text-gray-700 mb-2">{item.label}</label>
              <select value={data.overallAssessment?.[item.key] || 3} onChange={(e) => onChange({ ...data, overallAssessment: { ...data.overallAssessment, [item.key]: parseInt(e.target.value) } })} className="w-full px-2 py-2 border border-gray-300 rounded text-sm">
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Key Achievements This Month</label>
          <textarea value={data.keyAchievements || ''} onChange={(e) => onChange({ ...data, keyAchievements: e.target.value })} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Challenges Faced</label>
          <textarea value={data.challengesFaced || ''} onChange={(e) => onChange({ ...data, challengesFaced: e.target.value })} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Support Needed from Department/University</label>
          <textarea value={data.supportNeeded || ''} onChange={(e) => onChange({ ...data, supportNeeded: e.target.value })} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Plans for Next Month</label>
          <textarea value={data.plansNextMonth || ''} onChange={(e) => onChange({ ...data, plansNextMonth: e.target.value })} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function FacultyReportsView({ defaultLevel = "faculty", roleKey = "", roleLabel = "" }) {
  /* ═══ Auth State — auto-connect using organogram identity ═══ */
  const [reportingAuth, setReportingAuth] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  /* ═══ Report State ═══ */
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState({});
  const [selectedFacultyUser, setSelectedFacultyUser] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [returnComments, setReturnComments] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [expandedDept, setExpandedDept] = useState(null);
  const [deanStats, setDeanStats] = useState(null);

  /* ═══ Months for selection ═══ */
  const months = [
    { value: "2026-03", label: "March 2026 (Current)" },
    { value: "2026-02", label: "February 2026" },
    { value: "2026-01", label: "January 2026" },
  ];

  /* ═══ Authenticated Fetch Wrapper ═══ */
  const apiFetch = useCallback(async (path, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (reportingAuth?.token) {
      headers.Authorization = `Bearer ${reportingAuth.token}`;
    }
    const res = await fetch(`${REPORTING_API_BASE}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }, [reportingAuth]);

  /* ═══ Auto-connect on mount using organogram identity ═══ */
  const autoConnect = useCallback(async () => {
    if (!roleKey) { setAuthError("No role identity available"); setAuthLoading(false); return; }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${REPORTING_API_BASE}/api/login-dss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: roleKey, roleLabel }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Connection failed" }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const result = await res.json();
      setReportingAuth(result);
      setAuthError("");
    } catch (err) {
      setAuthError(err.message || "Cannot connect to Reporting Server");
    } finally {
      setAuthLoading(false);
    }
  }, [roleKey, roleLabel]);

  useEffect(() => {
    autoConnect();
  }, [autoConnect]);

  /* ═══ Handle logout / reconnect ═══ */
  const handleLogout = () => {
    setReportingAuth(null);
    setSelectedFacultyUser(null);
    setFacultyList([]);
    setReportsList([]);
    setCurrentReport(null);
    setFormData({});
  };

  /* ═══ Load faculty reports (HoD view) ═══ */
  useEffect(() => {
    if (!reportingAuth || reportingAuth.user.role !== "hod") return;
    const loadReports = async () => {
      try {
        const [month, year] = selectedMonth.split("-");
        const data = await apiFetch(`/api/reports?month=${month}&year=${year}&departmentId=${reportingAuth.user.departmentId}`);
        setReportsList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log("Error loading reports:", err.message);
        setReportsList([]);
      }
    };
    loadReports();
  }, [reportingAuth, selectedMonth, apiFetch]);

  /* ═══ Load faculty list from organogram data (HoD view) ═══ */
  useEffect(() => {
    if (!reportingAuth || reportingAuth.user.role !== "hod") return;
    const deptId = reportingAuth.user.departmentId;
    const orgFaculty = DEPT_FACULTY[deptId] || [];
    setFacultyList(orgFaculty.map(f => ({
      id: f.id,
      name: f.name,
      designation: f.designation,
      department_id: deptId,
      role: "faculty",
    })));
  }, [reportingAuth]);

  /* ═══ Load dean stats ═══ */
  useEffect(() => {
    if (!reportingAuth || reportingAuth.user.role !== "dean") return;
    const loadStats = async () => {
      try {
        const [month, year] = selectedMonth.split("-");
        const data = await apiFetch(`/api/dean/stats?month=${month}&year=${year}`);
        setDeanStats(data);
      } catch (err) {
        console.log("Error loading dean stats:", err.message);
        setDeanStats(null);
      }
    };
    loadStats();
  }, [reportingAuth, selectedMonth, apiFetch]);

  /* ═══ Save/Submit Report ═══ */
  const saveReport = useCallback(async (status = "draft") => {
    if (!reportingAuth || reportingAuth.user.role !== "faculty") return;
    setSaveLoading(true);
    try {
      const [month, year] = selectedMonth.split("-");
      const result = await apiFetch("/api/reports", {
        method: "PUT",
        body: JSON.stringify({
          month: parseInt(month),
          year: parseInt(year),
          data: formData,
          status,
        }),
      });
      setCurrentReport(result);
      setFormData(result.data || {});
    } catch (err) {
      alert("Error saving report: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  }, [reportingAuth, selectedMonth, formData, apiFetch]);

  /* ═══ Return report with comments ═══ */
  const returnReport = useCallback(async (reportId) => {
    if (!reportingAuth || reportingAuth.user.role !== "hod") return;
    try {
      await apiFetch(`/api/reports/${reportId}/return`, {
        method: "POST",
        body: JSON.stringify({ comments: returnComments }),
      });
      setReturnComments("");
      setReportsList(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      alert("Error returning report: " + err.message);
    }
  }, [reportingAuth, returnComments, apiFetch]);

  /* ═══ Approve report ═══ */
  const approveReport = useCallback(async (reportId) => {
    if (!reportingAuth || reportingAuth.user.role !== "hod") return;
    try {
      await apiFetch(`/api/reports/${reportId}/approve`, { method: "POST" });
      setReportsList(prev => prev.map(r => r.id === reportId ? { ...r, status: "approved" } : r));
    } catch (err) {
      alert("Error approving report: " + err.message);
    }
  }, [reportingAuth, apiFetch]);

  /* ═══ Render field based on type ═══ */
  const renderField = (field, sectionId) => {
    const value = formData[field.key] !== undefined ? formData[field.key] : field.defaultValue;
    const shouldShow = !field.visibleIf || formData[field.visibleIf];
    if (!shouldShow) return null;

    const handleChange = (newVal) => {
      setFormData(prev => ({ ...prev, [field.key]: newVal }));
    };

    switch (field.type) {
      case "number":
        return (
          <input type="number" value={value} onChange={(e) => handleChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-40" />
        );
      case "text":
        return (
          <input type="text" value={value} onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
        );
      case "textarea":
        return (
          <textarea value={value} onChange={(e) => handleChange(e.target.value)} rows={field.rows || 2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
        );
      case "checkbox":
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={value} onChange={(e) => handleChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200" />
            <span className="text-sm text-gray-700">{field.label}</span>
          </label>
        );
      case "checklist":
        if (field.subType === "grouped-checkboxes") {
          return (
            <div className="space-y-2">
              {field.options.map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={value[opt.key] || false}
                    onChange={(e) => handleChange({ ...value, [opt.key]: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          );
        } else if (field.isMultiSelect) {
          return (
            <div className="space-y-2">
              {field.options.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={value.includes(opt.value)}
                    onChange={(e) => handleChange(e.target.checked ? [...value, opt.value] : value.filter(v => v !== opt.value))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          );
        }
        break;
      case "array":
        if (field.subType === "textarea-array") {
          return (
            <textarea value={Array.isArray(value) ? value.join("\n") : ""} onChange={(e) => handleChange(e.target.value.split("\n").filter(l => l.trim()))}
              rows={field.rows || 3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          );
        }
        break;
      case "composite":
        if (field.subType === "rating-select") {
          return (
            <div className="space-y-3">
              {field.options.map(opt => (
                <div key={opt.key} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 w-32">{opt.label}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: field.ratingScale.max }).map((_, i) => (
                      <button key={i + 1} onClick={() => handleChange({ ...value, [opt.key]: i + 1 })}
                        className={`px-3 py-1 rounded text-xs font-medium ${value[opt.key] === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        }
        break;
      default:
        return null;
    }
  };

  /* ═══ CONNECTING / ERROR SCREEN ═══ */
  if (!reportingAuth) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Faculty Reports {roleLabel ? `— ${roleLabel}` : ""}</h2>

          {authLoading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-sm text-blue-700">Connecting to Reporting Server...</p>
            </div>
          )}

          {authError && !authLoading && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 font-medium mb-2">Reporting Server Not Available</p>
              <p className="text-xs text-amber-700 mb-3">Please ensure the MUST backend is running on port 3000.</p>
              <div className="bg-gray-800 rounded p-3 mb-3">
                <code className="text-xs text-green-400 font-mono">cd "Claude for MUST/must-reporting-system"<br/>node server.js</code>
              </div>
              <button onClick={autoConnect}
                className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition">
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══ FACULTY VIEW — Report submission ═══ */
  if (reportingAuth.user.role === "faculty") {
    const currentSection = REPORT_TEMPLATE.sections[activeSection];

    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Faculty Monthly Report</h2>
            <p className="text-sm text-gray-600 mt-1">{reportingAuth.user.name} — {roleLabel}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex gap-3 items-end">
            <div className="w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => saveReport("draft")} disabled={saveLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2">
                <Save size={14} /> Save Draft
              </button>
              <button onClick={() => saveReport("submitted")} disabled={saveLoading}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2">
                <ArrowUp size={14} /> Submit
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-5">
          {/* Section nav */}
          <div className="w-56 flex-shrink-0 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Sections ({REPORT_TEMPLATE.sections.length})</p>
            {REPORT_TEMPLATE.sections.map((sec, idx) => (
              <button key={idx} onClick={() => setActiveSection(idx)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                  activeSection === idx ? "bg-blue-50 text-blue-900 font-semibold" : "text-gray-600 hover:bg-gray-50"
                }`}>
                {sec.sectionNumber}. {sec.sectionName}
              </button>
            ))}
          </div>

          {/* Form area */}
          {currentSection && (
            <div className="flex-1">
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{currentSection.sectionName}</h3>
                <p className="text-xs text-gray-500 mb-4">Section {currentSection.sectionNumber} of {REPORT_TEMPLATE.sections.length}</p>
                <div className="space-y-5 border-t border-gray-100 pt-4">
                  {currentSection.fields.map((field, idx) => (
                    <div key={idx}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                      {renderField(field, currentSection.sectionId)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══ HOD VIEW — Review faculty reports ═══ */
  if (reportingAuth.user.role === "hod") {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Faculty Reports Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">{roleLabel}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex gap-3">
            <div className="w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Faculty Reports</h3>
          <div className="space-y-2">
            {facultyList.length === 0 ? (
              <p className="text-sm text-gray-500">No faculty members found</p>
            ) : (
              facultyList.map(faculty => (
                <div key={faculty.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => setSelectedFacultyUser(selectedFacultyUser?.id === faculty.id ? null : faculty)}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{faculty.name}</p>
                    <p className="text-xs text-gray-500">{faculty.designation}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">View Report</span>
                    {selectedFacultyUser?.id === faculty.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedFacultyUser && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h4 className="font-semibold text-gray-900 mb-4">{selectedFacultyUser.name} — Report Summary</h4>
            <p className="text-sm text-gray-600">Report data from API would display here. Faculty report viewing and approval features integrated with MUST backend.</p>
            <div className="mt-4 flex gap-2">
              <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">Approve</button>
              <button className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600">Request Revision</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══ DEAN VIEW — Cross-department overview ═══ */
  if (reportingAuth.user.role === "dean") {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Dean Reports Overview</h2>
            <p className="text-sm text-gray-600 mt-1">{roleLabel}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex gap-3">
            <div className="w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {deanStats && (
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Total Submitted</p>
              <p className="text-2xl font-bold text-gray-900">{deanStats.totalSubmitted || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600">{deanStats.pendingReview || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-600">{deanStats.approved || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Returned</p>
              <p className="text-2xl font-bold text-red-600">{deanStats.returned || 0}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Department Reports</h3>
          <p className="text-sm text-gray-600">Cross-department overview and statistics from dean API endpoint integrated here. Can drill into individual departments and approve/return reports.</p>
        </div>
      </div>
    );
  }

  return <div className="p-6"><p className="text-gray-500">Invalid role configuration</p></div>;
}

/* ══════════════════════════════════════════════════════════
   HOD MONTHLY REPORTS — Submit & Review (Based on HoD JDs)
   Hierarchy: HoD submits → Dean reviews faculty → Registrar institutional
   ══════════════════════════════════════════════════════════ */

/* Report sections derived from HoD Job Descriptions */
const REPORT_SECTIONS = [
  { id: "facsubmissions", title: "Faculty Submissions Summary", icon: GraduationCap, color: "#1e40af",
    fields: [
      { id: "totalFaculty", label: "Total faculty members in department", type: "number" },
      { id: "reportsSubmitted", label: "Faculty monthly reports submitted", type: "number" },
      { id: "reportsReviewed", label: "Reports reviewed by HoD", type: "number" },
      { id: "reportsPending", label: "Reports not yet submitted", type: "number" },
      { id: "facAttendanceCompliant", label: "Faculty marking attendance within 24h (%)", type: "number", unit: "%" },
      { id: "facLmsCompliant", label: "Faculty with complete LMS compliance (%)", type: "number", unit: "%" },
      { id: "facCounselingActive", label: "Faculty conducting student counseling (%)", type: "number", unit: "%" },
      { id: "facOfficeHoursObserved", label: "Faculty observing office hours (%)", type: "number", unit: "%" },
      { id: "facResearchActive", label: "Faculty with active research output (%)", type: "number", unit: "%" },
      { id: "aggregateVulnerableStudents", label: "Total vulnerable students identified (all faculty)", type: "number" },
      { id: "aggregateStudentsBelow50", label: "Total students with attendance <50% (all faculty)", type: "number" },
      { id: "aggregateStudentsMissing3", label: "Total students missing 3+ classes (all faculty)", type: "number" },
      { id: "facSubmissionRemarks", label: "Faculty submission highlights / non-compliance issues", type: "textarea" },
    ]},
  { id: "attendance", title: "Attendance Monitoring", icon: UserCheck, color: "#3b82f6",
    fields: [
      { id: "instrMarkingPct", label: "Instructors marking attendance within 24hrs (%)", type: "number", unit: "%" },
      { id: "instrNotMarking", label: "Instructors not marking (flagged daily)", type: "number" },
      { id: "studentAbove75Pct", label: "Classes with >75% student attendance (%)", type: "number", unit: "%" },
      { id: "redFlagMissing3", label: "Students missing 3+ classes in a row", type: "number" },
      { id: "redFlagBelow50", label: "Students with cumulative attendance <50%", type: "number" },
      { id: "redFlag51to75", label: "Students with attendance 51%–75%", type: "number" },
      { id: "attendanceRemarks", label: "Attendance actions taken this month", type: "textarea" },
    ]},
  { id: "lms", title: "LMS Compliance", icon: Monitor, color: "#8b5cf6",
    fields: [
      { id: "courseInfoComplete", label: "Courses with complete info on LMS (%)", type: "number", unit: "%" },
      { id: "gradeTemplateUpdated", label: "Courses with grade assessment template updated (%)", type: "number", unit: "%" },
      { id: "weeklyLecturePlan", label: "Courses with weekly lecture plan uploaded (%)", type: "number", unit: "%" },
      { id: "gradingInstrUploaded", label: "Grading instruments uploaded on time (%)", type: "number", unit: "%" },
      { id: "midtermReviewed", label: "Midterms reviewed for coverage & level", type: "select", options: ["Not yet due","In progress","Completed","N/A"] },
      { id: "coursePackAvail", label: "Course packs available on LMS (%)", type: "number", unit: "%" },
      { id: "curriculumDelivery", label: "Curriculum delivered as per lecture plan (%)", type: "number", unit: "%" },
      { id: "lmsRemarks", label: "LMS issues or actions this month", type: "textarea" },
    ]},
  { id: "admin", title: "Department Administration", icon: Settings, color: "#0891b2",
    fields: [
      { id: "nextSemPlanReady", label: "Course offering plan for next 3 semesters", type: "select", options: ["Not started","In progress","Submitted to Dean","Approved"] },
      { id: "facultyTeachingPlan", label: "Faculty-to-course mapping complete", type: "select", options: ["Not started","Draft","Finalized","Submitted"] },
      { id: "adminRemarks", label: "Administrative highlights or issues", type: "textarea" },
    ]},
  { id: "faculty", title: "Faculty Management", icon: Users, color: "#10b981",
    fields: [
      { id: "recruitmentVacancies", label: "Open faculty vacancies", type: "number" },
      { id: "recruitmentInProgress", label: "Recruitment in progress (positions)", type: "number" },
      { id: "annualReviewsDone", label: "Annual faculty reviews completed this cycle", type: "number" },
      { id: "probationReviewsDue", label: "Probation reviews due this quarter", type: "number" },
      { id: "probationReviewsDone", label: "Probation reviews completed", type: "number" },
      { id: "trainingsConducted", label: "Faculty trainings conducted this month", type: "number" },
      { id: "facultyRetentionIssues", label: "Retention concerns or faculty departures", type: "textarea" },
    ]},
  { id: "meetings", title: "Meetings & Governance", icon: Briefcase, color: "#f59e0b",
    fields: [
      { id: "facultyMeetingsHeld", label: "Department faculty meetings held this month", type: "number" },
      { id: "keyDecisions", label: "Key decisions made in meetings", type: "textarea" },
      { id: "statutoryCompliance", label: "Compliance with statutory body decisions", type: "select", options: ["Fully compliant","Partially compliant","Action required","N/A"] },
      { id: "meetingRemarks", label: "Meeting minutes summary", type: "textarea" },
    ]},
  { id: "qa", title: "Quality Assurance & Accreditation", icon: Shield, color: "#ef4444",
    fields: [
      { id: "accreditationStatus", label: "Program accreditation status", type: "select", options: ["Fully accredited","Accreditation due <6 months","Self-assessment in progress","Overdue","N/A"] },
      { id: "curriculumApproved", label: "Delivering HEC/accreditation-approved curriculum", type: "select", options: ["Yes","Partially — deviations documented","No — gaps identified"] },
      { id: "selfAssessmentDate", label: "Last self-assessment review date", type: "text" },
      { id: "qecSurveysComplete", label: "QEC surveys completed on time", type: "select", options: ["Yes","Partially","Not yet","N/A"] },
      { id: "surveyImprovements", label: "Tangible improvements from survey results", type: "textarea" },
      { id: "externalAccredProgress", label: "External accreditation requirements progress", type: "textarea" },
    ]},
  { id: "industry", title: "Industrial Linkages", icon: Globe, color: "#9333ea",
    fields: [
      { id: "industryMoUs", label: "Active industry MoUs/partnerships", type: "number" },
      { id: "internshipsArranged", label: "Student internships arranged this month", type: "number" },
      { id: "fypIndustry", label: "Final year projects with industry partners", type: "number" },
      { id: "guestLectures", label: "Industry guest lectures/workshops held", type: "number" },
      { id: "softSkillsPrograms", label: "Soft skills enhancement activities", type: "textarea" },
      { id: "competitionsEnrolled", label: "Students enrolled in competitions/hackathons", type: "number" },
    ]},
  { id: "research", title: "Faculty Research & Development", icon: Lightbulb, color: "#ec4899",
    fields: [
      { id: "papersPublished", label: "Research papers published this month", type: "number" },
      { id: "conferencesAttended", label: "Conferences/workshops attended by faculty", type: "number" },
      { id: "grantProposals", label: "Grant proposals submitted", type: "number" },
      { id: "researchSupport", label: "Research support actions taken", type: "textarea" },
    ]},
  { id: "students", title: "Student Welfare & Counseling", icon: Heart, color: "#f43f5e",
    fields: [
      { id: "counselingSessions", label: "Academic counseling sessions held", type: "number" },
      { id: "vulnerableIdentified", label: "Vulnerable students identified", type: "number" },
      { id: "supportProvided", label: "Students receiving active support", type: "number" },
      { id: "studentRemarks", label: "Student welfare actions & concerns", type: "textarea" },
    ]},
];

/* Mock submitted reports — varied by department and month */
const generateMockReports = () => {
  const reports = {};
  const months = ["2026-01","2026-02","2026-03"];
  UNIVERSITY_FACULTIES.forEach(fac => {
    fac.departments.forEach(dept => {
      reports[dept.id] = {};
      months.forEach((month, mi) => {
        const seed = dept.id.charCodeAt(0) + mi * 7;
        const submitted = mi < 2 || (seed % 3 !== 0);
        if (submitted) {
          reports[dept.id][month] = {
            status: mi < 2 ? "reviewed" : (seed % 2 === 0 ? "submitted" : "draft"),
            submittedDate: mi < 2 ? `${month}-28` : (seed % 2 === 0 ? "2026-03-25" : null),
            reviewedBy: mi < 2 ? fac.dean : null,
            data: {
              totalFaculty: 6 + (seed % 5),
              reportsSubmitted: 4 + (seed % 4),
              reportsReviewed: mi < 2 ? 4 + (seed % 4) : 2 + (seed % 3),
              reportsPending: 1 + (seed % 3),
              facAttendanceCompliant: 75 + (seed % 22),
              facLmsCompliant: 70 + (seed % 28),
              facCounselingActive: 65 + (seed % 30),
              facOfficeHoursObserved: 80 + (seed % 18),
              facResearchActive: 40 + (seed % 35),
              aggregateVulnerableStudents: 5 + (seed % 12),
              aggregateStudentsBelow50: 2 + (seed % 6),
              aggregateStudentsMissing3: 3 + (seed % 8),
              instrMarkingPct: 80 + (seed % 18),
              studentAbove75Pct: 70 + (seed % 25),
              redFlagMissing3: 2 + (seed % 8),
              redFlagBelow50: seed % 5,
              courseInfoComplete: 75 + (seed % 25),
              gradeTemplateUpdated: 60 + (seed % 35),
              weeklyLecturePlan: 65 + (seed % 30),
              curriculumDelivery: 70 + (seed % 28),
              facultyMeetingsHeld: 1 + (seed % 3),
              recruitmentVacancies: seed % 4,
              papersPublished: seed % 6,
              counselingSessions: 5 + (seed % 15),
              vulnerableIdentified: 2 + (seed % 7),
              industryMoUs: 1 + (seed % 4),
              internshipsArranged: seed % 12,
              competitionsEnrolled: seed % 20,
            },
          };
        }
      });
    });
  });
  return reports;
};

const MOCK_REPORTS = generateMockReports();

/* ══════════════════════════════════════════════════════════
   HR DIRECTOR MONTHLY REPORT — Submission to VP Operations / Registrar
   Based on Director HR Job Description
   ══════════════════════════════════════════════════════════ */

const HR_REPORT_SECTIONS = [
  { id: "academic_hr", title: "Academic HR — Faculty Lifecycle", icon: GraduationCap, color: "#3b82f6",
    fields: [
      { id: "facultyHeadcount", label: "Total faculty headcount", type: "number" },
      { id: "facultyVacancies", label: "Open faculty positions", type: "number" },
      { id: "recruitmentInProgress", label: "Faculty recruitments in progress", type: "number" },
      { id: "hiresCompletedMonth", label: "Faculty hires completed this month", type: "number" },
      { id: "avgTimeToHire", label: "Avg. time-to-hire (days)", type: "number" },
      { id: "facultyExits", label: "Faculty departures this month", type: "number" },
      { id: "retentionRate", label: "Faculty retention rate (%)", type: "number", unit: "%" },
      { id: "recruitmentRemarks", label: "Recruitment pipeline highlights/challenges", type: "textarea" },
    ]},
  { id: "performance_mgmt", title: "Faculty Performance Management", icon: Target, color: "#10b981",
    fields: [
      { id: "annualReviewsDue", label: "Annual performance reviews due this cycle", type: "number" },
      { id: "annualReviewsComplete", label: "Reviews completed", type: "number" },
      { id: "probationReviewsDue", label: "Probation reviews due", type: "number" },
      { id: "probationReviewsDone", label: "Probation reviews completed", type: "number" },
      { id: "promotionCasesSubmitted", label: "Promotion cases submitted to committee", type: "number" },
      { id: "teachingQualityFlag", label: "Faculty flagged for teaching quality issues", type: "number" },
      { id: "researchOutputFlag", label: "Faculty below minimum research output threshold", type: "number" },
      { id: "performanceRemarks", label: "Performance management highlights", type: "textarea" },
    ]},
  { id: "faculty_dev", title: "Faculty Development & Training", icon: Award, color: "#8b5cf6",
    fields: [
      { id: "trainingsConducted", label: "Training/development programs conducted", type: "number" },
      { id: "facultyTrained", label: "Faculty members trained this month", type: "number" },
      { id: "sabbaticalRequests", label: "Sabbatical requests pending", type: "number" },
      { id: "confAttendanceApproved", label: "Conference attendance approved", type: "number" },
      { id: "devBudgetUtilized", label: "Development budget utilized (%)", type: "number", unit: "%" },
      { id: "devRemarks", label: "Development program highlights", type: "textarea" },
    ]},
  { id: "corporate_hr", title: "Corporate HR — Admin & Staff", icon: Briefcase, color: "#f59e0b",
    fields: [
      { id: "staffHeadcount", label: "Total admin/support staff headcount", type: "number" },
      { id: "staffVacancies", label: "Open staff positions", type: "number" },
      { id: "staffHires", label: "Staff hires completed this month", type: "number" },
      { id: "staffExits", label: "Staff departures this month", type: "number" },
      { id: "staffRetention", label: "Staff retention rate (%)", type: "number", unit: "%" },
      { id: "grievancesPending", label: "Employee grievances pending", type: "number" },
      { id: "grievancesResolved", label: "Grievances resolved this month", type: "number" },
      { id: "staffRemarks", label: "Staff HR highlights/issues", type: "textarea" },
    ]},
  { id: "compensation", title: "Compensation & Payroll", icon: DollarSign, color: "#0891b2",
    fields: [
      { id: "payrollProcessed", label: "Monthly payroll processed on time", type: "select", options: ["Yes — on schedule", "Delayed 1-2 days", "Delayed >2 days", "Pending"] },
      { id: "payrollErrors", label: "Payroll discrepancies reported", type: "number" },
      { id: "benefitsClaims", label: "Benefits/medical claims processed", type: "number" },
      { id: "salaryBenchmarkProgress", label: "Salary benchmarking study progress", type: "select", options: ["Not started", "Data collection", "Analysis", "Draft report", "Completed", "N/A"] },
      { id: "compensationRemarks", label: "Compensation/payroll remarks", type: "textarea" },
    ]},
  { id: "odoo_system", title: "Odoo HR System & Digitization", icon: Monitor, color: "#4f46e5",
    fields: [
      { id: "odooModulesLive", label: "Odoo modules fully operational", type: "number" },
      { id: "odooModulesTotal", label: "Total Odoo modules planned", type: "number" },
      { id: "digitizationPct", label: "HR process digitization (%)", type: "number", unit: "%" },
      { id: "odooUserAdoption", label: "Staff Odoo adoption rate (%)", type: "number", unit: "%" },
      { id: "odooTrainingsDone", label: "Odoo training sessions this month", type: "number" },
      { id: "odooIssues", label: "System issues reported/resolved", type: "textarea" },
    ]},
  { id: "policy_compliance", title: "Policy & Compliance", icon: Shield, color: "#ef4444",
    fields: [
      { id: "policiesActive", label: "HR policies formally approved & active", type: "number" },
      { id: "policiesDraft", label: "Policies in draft/review", type: "number" },
      { id: "hecCompliance", label: "HEC HR compliance status", type: "select", options: ["Fully compliant", "Minor gaps", "Significant gaps", "Under review"] },
      { id: "laborLawCompliance", label: "Labor law compliance status", type: "select", options: ["Fully compliant", "Minor gaps", "Action required"] },
      { id: "auditReadiness", label: "Audit readiness assessment", type: "select", options: ["Audit-ready", "Minor updates needed", "Significant gaps", "Not yet assessed"] },
      { id: "policyRemarks", label: "Policy development/compliance remarks", type: "textarea" },
    ]},
  { id: "analytics_reporting", title: "HR Analytics & Reporting", icon: BarChart3, color: "#ec4899",
    fields: [
      { id: "facultyStaffRatio", label: "Faculty-to-staff ratio", type: "text" },
      { id: "turnoverRate", label: "Overall turnover rate (%)", type: "number", unit: "%" },
      { id: "avgCostPerHire", label: "Avg. cost per hire (PKR)", type: "number" },
      { id: "timeToFillAvg", label: "Avg. time to fill positions (days)", type: "number" },
      { id: "trainingROI", label: "Training investment ROI assessment", type: "select", options: ["Strong positive", "Moderate positive", "Neutral", "Under evaluation", "N/A"] },
      { id: "analyticsRemarks", label: "Key insights from HR data this month", type: "textarea" },
    ]},
];

/* Mock HR report data */
const generateMockHRReports = () => {
  const months = ["2026-01", "2026-02", "2026-03"];
  const reports = {};
  months.forEach((month, mi) => {
    const seed = mi * 13 + 7;
    reports[month] = {
      status: mi < 2 ? "reviewed" : (seed % 2 === 0 ? "submitted" : "draft"),
      submittedDate: mi < 2 ? `${month}-28` : (seed % 2 === 0 ? "2026-03-26" : null),
      reviewedBy: mi < 2 ? "VP Operations" : null,
      data: {
        facultyHeadcount: 380 + mi * 5,
        facultyVacancies: 14 - mi * 2,
        recruitmentInProgress: 8 - mi,
        hiresCompletedMonth: 2 + mi,
        avgTimeToHire: 45 - mi * 3,
        facultyExits: mi === 0 ? 3 : 1,
        retentionRate: 94 + mi,
        annualReviewsDue: 120,
        annualReviewsComplete: 40 + mi * 35,
        probationReviewsDue: 12,
        probationReviewsDone: 4 + mi * 3,
        staffHeadcount: 210 + mi * 3,
        staffVacancies: 8 - mi,
        staffHires: 3 + mi,
        staffExits: 2,
        staffRetention: 92 + mi,
        grievancesPending: 5 - mi,
        grievancesResolved: 3 + mi,
        trainingsConducted: 2 + mi,
        facultyTrained: 15 + mi * 10,
        digitizationPct: 40 + mi * 12,
        odooModulesLive: 3 + mi,
        odooModulesTotal: 8,
        policiesActive: 6 + mi * 2,
        policiesDraft: 4 - mi,
        turnoverRate: 6 - mi * 0.5,
      },
    };
  });
  return reports;
};
const MOCK_HR_REPORTS = generateMockHRReports();

function HRReportsView({ defaultScope = "hr" }) {
  const [viewScope, setViewScope] = useState(defaultScope); /* hr | vpops */
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const [activeSection, setActiveSection] = useState("academic_hr");
  const [formData, setFormData] = useState({});

  const months = [
    { value: "2026-03", label: "March 2026 (Current)" },
    { value: "2026-02", label: "February 2026" },
    { value: "2026-01", label: "January 2026" },
  ];

  const report = MOCK_HR_REPORTS[selectedMonth];
  const statusStyles = {
    reviewed: { bg: "#ecfdf5", color: "#059669", label: "Reviewed by VP Ops" },
    submitted: { bg: "#eff6ff", color: "#2563eb", label: "Submitted" },
    draft: { bg: "#fffbeb", color: "#d97706", label: "Draft" },
    not_submitted: { bg: "#fef2f2", color: "#dc2626", label: "Not Submitted" },
  };
  const st = report ? statusStyles[report.status] : statusStyles.not_submitted;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">HR Director Monthly Report</h2>
          <p className="text-sm text-gray-500 mt-1">
            {viewScope === "hr" ? "Submit monthly HR report to VP Operations" : "Review HR Director monthly submissions"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[
              { id: "hr", label: "HR Director" },
              { id: "vpops", label: "VP Operations" },
            ].map(s => (
              <button key={s.id} onClick={() => setViewScope(s.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewScope === s.id ? "bg-white shadow text-blue-700" : "text-gray-600 hover:text-gray-900"}`}
              >{s.label}</button>
            ))}
          </div>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: st.bg }}>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
        <span className="text-sm font-medium" style={{ color: st.color }}>{st.label}</span>
        {report?.submittedDate && <span className="text-xs text-gray-500 ml-2">Submitted: {report.submittedDate}</span>}
        {report?.reviewedBy && <span className="text-xs text-gray-500 ml-2">Reviewed by: {report.reviewedBy}</span>}
      </div>

      {viewScope === "hr" ? (
        /* HR Director submission form */
        <div className="flex gap-5">
          {/* Section nav */}
          <div className="w-56 flex-shrink-0 space-y-1">
            {HR_REPORT_SECTIONS.map(sec => {
              const SecIcon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 text-sm transition ${isActive ? "bg-blue-50 text-blue-800 font-medium border border-blue-200" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  <SecIcon size={15} style={{ color: isActive ? sec.color : "#9ca3af" }} />
                  <span className="truncate">{sec.title}</span>
                </button>
              );
            })}
          </div>

          {/* Form fields */}
          <div className="flex-1">
            {HR_REPORT_SECTIONS.filter(s => s.id === activeSection).map(sec => {
              const SecIcon = sec.icon;
              return (
                <div key={sec.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: sec.color + "15" }}>
                      <SecIcon size={18} style={{ color: sec.color }} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{sec.title}</h3>
                  </div>
                  <div className="space-y-4">
                    {sec.fields.map(field => {
                      const val = formData[field.id] ?? report?.data?.[field.id] ?? "";
                      return (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                          {field.type === "textarea" ? (
                            <textarea rows={3} value={val} onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          ) : field.type === "select" ? (
                            <select value={val} onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">Select...</option>
                              {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input type={field.type === "number" ? "number" : "text"} value={val}
                                onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                              {field.unit && <span className="text-sm text-gray-500 font-medium">{field.unit}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end gap-3 mt-4">
              <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Save Draft</button>
              <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Submit to VP Operations</button>
            </div>
          </div>
        </div>
      ) : (
        /* VP Operations review view */
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">HR Monthly Summary — {months.find(m => m.value === selectedMonth)?.label}</h3>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Faculty Headcount", value: report?.data?.facultyHeadcount || "—", color: "#3b82f6" },
                { label: "Faculty Vacancies", value: report?.data?.facultyVacancies || "—", color: "#ef4444" },
                { label: "Staff Headcount", value: report?.data?.staffHeadcount || "—", color: "#8b5cf6" },
                { label: "Turnover Rate", value: report?.data?.turnoverRate ? `${report.data.turnoverRate}%` : "—", color: "#f59e0b" },
              ].map((m, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {HR_REPORT_SECTIONS.map(sec => {
                const SecIcon = sec.icon;
                const filledCount = sec.fields.filter(f => report?.data?.[f.id] != null).length;
                return (
                  <div key={sec.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <SecIcon size={16} style={{ color: sec.color }} />
                      <span className="font-semibold text-sm text-gray-800">{sec.title}</span>
                      <span className="ml-auto text-xs text-gray-400">{filledCount}/{sec.fields.length} fields</span>
                    </div>
                    <div className="space-y-1.5">
                      {sec.fields.filter(f => f.type !== "textarea").slice(0, 4).map(f => (
                        <div key={f.id} className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate flex-1">{f.label}</span>
                          <span className="font-medium text-gray-900 ml-2">{report?.data?.[f.id] ?? "—"}{f.unit || ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Request Revision</button>
            <button className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 flex items-center gap-2">
              <CheckCircle size={16} /> Mark as Reviewed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HR / ODOO IMPLEMENTATION TRACKER
   11-phase roadmap with task-level tracking, progress reports,
   and Director HR submission history
   ══════════════════════════════════════════════════════════ */

const HR_ODOO_ROADMAP = [
  {
    phase: 0, title: "Immediate pre-work — this week's deliverables",
    subtitle: "From today's meeting — must be sent to management before any Odoo work begins",
    timeline: "This week", color: "#ef4444", status: "completed",
    tasks: [
      { id: "p0t1", label: "Email: list of mandatory + optional employee master data fields", category: "action", status: "completed",
        completedDate: "2026-04-05", completedBy: "Ms. Nasra Naqvi",
        deliverable: "Mandatory: Employee Name, Biometric Code, Father Name, Work Mobile, Work Email, CNIC, Payroll Status, Gender, Joining Date, Date of Birth, Department, Designation, Employment Nature. Optional: Department Code, Contact No., Religion, Domicile/Province, Current Position, Tax Payer Status, Visiting Campuses, Report To. Master Data Fields: Remove duplicate biometric code; show Left Date if employee departed." },
      { id: "p0t2", label: "Email: list of documents to be uploaded per employee", category: "action", status: "completed",
        completedDate: "2026-04-05", completedBy: "Ms. Nasra Naqvi",
        deliverable: "Mandatory: Attested Educational Docs, CNIC, Council Registration Card/Certificate, Photograph, HEC Equivalence Certificate (foreign degrees), Resume, Appointment Letter. Optional: Domicile, Experience Certificate, Thesis Title & Abstract, Job Offer, Joining Report, Undertaking, Any other Documents." },
      { id: "p0t3", label: "Email: version 1.2 policy questions — leave, attendance, salary, probation, notice period", category: "action", status: "completed",
        completedDate: "2026-04-05", completedBy: "Ms. Nasra Naqvi",
        deliverable: "Policy observations: Faculty attendance rules (Section 5.3) — revision needed. Salary Bands (Section 7.3) — to be defined. Employment Contracts (Section 8.1) — revision needed." },
      { id: "p0t4", label: "Confirm Odoo as the single system (not Udyog)", category: "action", status: "completed",
        completedDate: "2026-04-05", completedBy: "Ms. Nasra Naqvi",
        deliverable: "Confirmed — Odoo is the single HR system." },
      { id: "p0t5", label: "Designate Odoo administrator from HR team", category: "action", status: "completed",
        completedDate: "2026-04-05", completedBy: "Ms. Nasra Naqvi",
        deliverable: "Designated: Ms. Nasra Naqvi (Director HR) as Odoo administrator." },
    ],
    authorities: ["Registrar — coordinate & accelerate all pending policy approvals", "Vice Chancellor — centralized decisions on key HR parameters", "BOG — formal policy approvals if required"],
    note: "Key insight from meeting: The system does not think automatically — every rule in Odoo must first be decided on paper. Policies that remain \"under verbal approval\" will paralyze implementation."
  },
  {
    phase: 1, title: "Policy foundation — the bedrock of everything",
    subtitle: "Nothing in Odoo can be correctly configured without these approvals",
    timeline: "Weeks 1–3", color: "#f59e0b", status: "in_progress",
    tasks: [
      { id: "p1t1", label: "Employee categories policy (permanent, contract, visiting faculty; admin; support)", category: "policy", status: "in_progress" },
      { id: "p1t2", label: "Working hours policy — faculty flexible vs admin fixed", category: "policy", status: "pending" },
      { id: "p1t3", label: "Leave policy — casual, sick, earned, LWP entitlements per category", category: "policy", status: "pending" },
      { id: "p1t4", label: "Probation period — 3 or 6 months, faculty vs admin separately", category: "policy", status: "pending" },
      { id: "p1t5", label: "Notice period — resignation & termination, faculty vs admin", category: "policy", status: "pending" },
      { id: "p1t6", label: "Salary & compensation policy — monthly salary + per-lecture for visiting", category: "policy", status: "pending" },
      { id: "p1t7", label: "Attendance deduction rules — grace time, half-day trigger, late deduction formula", category: "policy", status: "pending" },
      { id: "p1t8", label: "HEC-aligned faculty recruitment policy", category: "policy", status: "pending" },
      { id: "p1t9", label: "HR Policy Manual v1.0 (consolidating all approved policies)", category: "document", status: "in_progress" },
      { id: "p1t10", label: "Organogram (approved hierarchy: Lecturer → HoD → Dean → VC/Rector)", category: "document", status: "pending" },
      { id: "p1t11", label: "Employment contract templates — 4 versions: permanent faculty, contract faculty, visiting faculty, admin staff", category: "document", status: "pending" },
    ],
    odooSteps: ["None — Odoo configuration cannot begin without approved policies"],
    authorities: ["Board of Governors — all foundational policies", "Vice Chancellor — organogram and category definitions"],
    note: "Faculty and admin must never share the same leave, attendance, or salary structures in Odoo. Establishing distinct categories here prevents irreversible configuration errors later."
  },
  {
    phase: 2, title: "Organizational structure & employee master data",
    subtitle: "The core foundation of Odoo — every other module depends on this",
    timeline: "Weeks 2–4", color: "#f59e0b", status: "pending",
    tasks: [
      { id: "p2t1", label: "Employee data collection form (mandatory vs optional fields separated)", category: "document", status: "pending" },
      { id: "p2t2", label: "Document upload checklist — CNIC, degrees, experience letters, appointment letter, contract, photo", category: "document", status: "pending" },
      { id: "p2t3", label: "Data collection drive plan (who collects from whom, by when)", category: "document", status: "pending" },
    ],
    odooSteps: [
      "Create Schools as departments (Engineering, Nursing, Management, etc.)",
      "Create sub-departments within each School",
      "Set up job positions with correct hierarchy",
      "Create employee profiles — mandatory fields only, no incomplete records",
      "Upload signed contracts and required documents for each employee",
      "Set reporting lines (Lecturer → HoD → Dean → VC) in Odoo"
    ],
    authorities: ["Director HR — validates all employee profiles", "HoDs — verify faculty data in their departments"],
    note: "No employee should exist in Odoo without a complete profile and at least one signed document uploaded. Odoo is the sole source of truth — if it is not in Odoo, it does not exist officially."
  },
  {
    phase: 3, title: "Attendance configuration & biometric integration",
    subtitle: "Upgrade existing biometric infrastructure to full Odoo integration",
    timeline: "Weeks 3–5", color: "#3b82f6", status: "pending",
    tasks: [
      { id: "p3t1", label: "Attendance parameters summary sheet (for Odoo admin configuration)", category: "document", status: "pending" },
      { id: "p3t2", label: "Biometric machine integration record", category: "document", status: "pending" },
      { id: "p3t3", label: "Missing punch and exceptions register", category: "document", status: "pending" },
    ],
    prerequisites: ["Attendance deduction rules (approved)", "Working hours policy (approved)", "Grace time and half-day policy (approved)"],
    odooSteps: [
      "Create 3 separate work schedules: admin strict (9–5), faculty flexible, visiting lecture-based",
      "Set late arrival grace time per schedule",
      "Configure half-day deduction triggers",
      "Sync biometric machines with Odoo Attendance module",
      "Assign each employee to their correct work schedule",
      "Set up daily HR monitoring view (missing punches, repeated late)"
    ],
    authorities: ["Director HR — approves attendance rules before configuration", "IT team — biometric sync technical implementation"],
    note: "Faculty attendance must never be treated identically to admin attendance. Visiting faculty attendance is lecture-based, not clock-in/out. Three distinct schedules are non-negotiable."
  },
  {
    phase: 4, title: "Leave management",
    subtitle: "Replaces all verbal leave approvals with system-driven workflows",
    timeline: "Weeks 4–6", color: "#3b82f6", status: "pending",
    tasks: [
      { id: "p4t1", label: "Opening leave balance register (for migration of existing balances)", category: "document", status: "pending" },
      { id: "p4t2", label: "Leave allocation schedule (annual entitlements by category)", category: "document", status: "pending" },
    ],
    prerequisites: ["Leave types and entitlements per category (approved)", "Carry-forward rules (approved)", "Leave approval hierarchy (approved)"],
    odooSteps: [
      "Create leave types: Casual Leave, Sick Leave, Earned Leave, LWP, Study Leave (faculty)",
      "Set annual entitlements by employee category",
      "Configure carry-forward rules",
      "Set approval workflow: Employee → HoD → HR (3-tier)",
      "Allocate opening leave balances for all current employees",
      "Mark visiting faculty as ineligible for paid leave types"
    ],
    authorities: ["Director HR — configures and activates the module", "HoDs — first approvers in the workflow"],
    note: "Odoo becomes the final authority on leave — not verbal approvals. From go-live, any leave not applied in Odoo will be treated as absent."
  },
  {
    phase: 5, title: "Payroll implementation",
    subtitle: "Most critical and complex phase — run parallel for 2 months before going live",
    timeline: "Weeks 6–10", color: "#10b981", status: "pending",
    tasks: [
      { id: "p5t1", label: "Salary grade chart (approved by Finance + BOG)", category: "document", status: "pending" },
      { id: "p5t2", label: "Payroll input template for monthly variables", category: "document", status: "pending" },
      { id: "p5t3", label: "Loan register (existing advances to be migrated)", category: "document", status: "pending" },
      { id: "p5t4", label: "Tax calculation sheet (per employee where applicable)", category: "document", status: "pending" },
    ],
    prerequisites: ["Salary bands approved — separate for faculty and admin", "Salary structure components: basic, allowances, deductions, tax", "Per-lecture rate for visiting faculty (approved)", "Loan and advance policy (approved)", "Late deduction formula (approved)", "Attendance fully functional in Odoo", "Leave management live in Odoo"],
    odooSteps: [
      "Create 4 salary structures: permanent faculty, contract faculty, admin staff, visiting faculty",
      "Configure allowances as separate rules (house, medical, transport)",
      "Configure deduction rules (late, EOBI, loan installments)",
      "Link attendance and leave to payroll engine",
      "Assign each employee to correct salary structure",
      "Run 2 months of parallel payroll — Odoo vs manual — before full go-live",
      "Generate and archive first official payslips in Odoo"
    ],
    authorities: ["BOG — salary bands and grade chart approval", "Finance Department — payroll go-live sign-off", "Director HR — monthly payroll closure authority"],
    note: "Never mix faculty and admin salary structures. Parallel running is mandatory — processing live payroll without validation is the most common and costly Odoo implementation mistake."
  },
  {
    phase: 6, title: "Contracts, probation & confirmations",
    subtitle: "Critical for HEC compliance — illegal over-probation must be prevented",
    timeline: "Weeks 8–12", color: "#10b981", status: "pending",
    tasks: [
      { id: "p6t1", label: "Appointment letter template (per category)", category: "document", status: "pending" },
      { id: "p6t2", label: "Contract templates v1.0 (4 versions — signed, uploaded in Phase 2)", category: "document", status: "pending" },
      { id: "p6t3", label: "Probation completion notice template", category: "document", status: "pending" },
      { id: "p6t4", label: "Confirmation/regularization letter template", category: "document", status: "pending" },
      { id: "p6t5", label: "Contract renewal letter template", category: "document", status: "pending" },
    ],
    prerequisites: ["Probation period (3 or 6 months per category — approved)", "Confirmation criteria (approved)", "Contract types and renewal rules (approved)"],
    odooSteps: [
      "Assign contract type to every employee in Odoo",
      "Set probation end dates — Odoo generates alerts when due",
      "Configure automated alert to Director HR 30 days before probation end",
      "Set contract expiry alerts for contract/visiting faculty",
      "Generate confirmation letters from Odoo upon completion"
    ],
    authorities: ["Registrar — probation completion and confirmation", "Director HR — contract renewals"],
    note: "HEC audits frequently check whether employees were held in probation beyond the policy limit. Odoo's alert system is the safeguard — but only if probation dates are entered correctly in Phase 2."
  },
  {
    phase: 7, title: "Recruitment workflow (end-to-end in Odoo)",
    subtitle: "Eliminates Excel-based recruitment — all stages recorded in system",
    timeline: "Month 3–4", color: "#3b82f6", status: "pending",
    tasks: [
      { id: "p7t1", label: "Job advertisement template (faculty and admin versions)", category: "document", status: "pending" },
      { id: "p7t2", label: "Application form (online via Odoo portal)", category: "document", status: "pending" },
      { id: "p7t3", label: "Shortlisting criteria matrix per job category", category: "document", status: "pending" },
      { id: "p7t4", label: "Interview score sheet (structured, per HEC criteria)", category: "document", status: "pending" },
      { id: "p7t5", label: "Offer/appointment letter template (auto-generated from Odoo)", category: "document", status: "pending" },
    ],
    prerequisites: ["HEC-aligned faculty recruitment policy (approved)", "Merit criteria and interview scoring rubric (approved)", "Selection committee composition (approved)"],
    odooSteps: [
      "Create recruitment pipeline: Application → Shortlisted → Interview Scheduled → Interview Scored → Offer → Appointed",
      "Configure interview scheduling within Odoo",
      "Set up interview score entry forms",
      "Link appointed candidate directly to employee profile creation",
      "Generate appointment letter from Odoo automatically"
    ],
    authorities: ["Selection Committee + Rector — final faculty appointments", "Registrar — admin staff appointments"],
    note: "Every recruitment decision — shortlisting reason, interview score, selection rationale — must be recorded in Odoo. HEC compliance audits require documented evidence of merit-based hiring."
  },
  {
    phase: 8, title: "Performance management (Academic HR priority)",
    subtitle: "Faculty evaluation — teaching, research, institutional service",
    timeline: "Month 4–5", color: "#6b7280", status: "pending",
    tasks: [
      { id: "p8t1", label: "Faculty performance evaluation policy — 3 pillars: teaching quality, research output, institutional service", category: "policy", status: "pending" },
      { id: "p8t2", label: "Staff KPI framework for admin roles", category: "policy", status: "pending" },
      { id: "p8t3", label: "Annual appraisal calendar (academic year cycle)", category: "policy", status: "pending" },
      { id: "p8t4", label: "Promotion and increment criteria linked to performance", category: "policy", status: "pending" },
      { id: "p8t5", label: "Faculty self-assessment form (annual)", category: "document", status: "pending" },
      { id: "p8t6", label: "HoD / supervisor evaluation form", category: "document", status: "pending" },
      { id: "p8t7", label: "Student feedback aggregation form (manual upload initially)", category: "document", status: "pending" },
      { id: "p8t8", label: "Performance review meeting record template", category: "document", status: "pending" },
      { id: "p8t9", label: "Research and publication log per faculty member", category: "document", status: "pending" },
    ],
    odooSteps: [
      "Create performance appraisal templates (faculty and admin separately)",
      "Set up annual appraisal cycle with automated employee notifications",
      "Configure staged workflow: self-assessment → supervisor review → HR → meeting record",
      "Upload research publications, training records, feedback scores as documents"
    ],
    authorities: ["Academic Council — faculty evaluation policy", "Director HR — staff appraisal process", "Deans/HoDs — faculty supervisor evaluations"],
    note: ""
  },
  {
    phase: 9, title: "Discipline & exit management",
    subtitle: "HR's legal protection — all disciplinary and separation actions fully documented",
    timeline: "Month 5–6", color: "#6b7280", status: "pending",
    tasks: [
      { id: "p9t1", label: "Code of conduct (academic and corporate)", category: "policy", status: "pending" },
      { id: "p9t2", label: "Disciplinary procedure — warning, show-cause, suspension, termination", category: "policy", status: "pending" },
      { id: "p9t3", label: "Resignation and termination procedure per category", category: "policy", status: "pending" },
      { id: "p9t4", label: "Clearance process (IT, Library, Finance, HR)", category: "policy", status: "pending" },
      { id: "p9t5", label: "Final settlement computation rules", category: "policy", status: "pending" },
      { id: "p9t6", label: "Warning letter template (first, second, final)", category: "document", status: "pending" },
      { id: "p9t7", label: "Show-cause notice template", category: "document", status: "pending" },
      { id: "p9t8", label: "Resignation acceptance letter template", category: "document", status: "pending" },
      { id: "p9t9", label: "No-objection / clearance form (multi-department)", category: "document", status: "pending" },
      { id: "p9t10", label: "Final settlement computation sheet", category: "document", status: "pending" },
      { id: "p9t11", label: "Experience / relieving letter template", category: "document", status: "pending" },
    ],
    odooSteps: [
      "Set up disciplinary record fields per employee",
      "Configure exit workflow: resignation received → clearance initiated → departments cleared → settlement computed → relieved",
      "Link clearance to Finance and IT (multi-department sign-off)",
      "Generate experience letter from Odoo automatically",
      "Archive exited employee records (not deleted)"
    ],
    authorities: ["Registrar — resignation acceptance and final settlement", "Director HR — clearance process management"],
    note: "If HEC, courts, or audit bodies raise questions, Odoo's disciplinary and exit records are MUST's legal evidence. No exit or disciplinary action should ever be handled manually going forward."
  },
  {
    phase: 10, title: "HR dashboards & management reporting",
    subtitle: "Real-time insights for Vice Chancellor, Registrar, and BOG",
    timeline: "Month 6+ (ongoing)", color: "#6b7280", status: "pending",
    tasks: [
      { id: "p10t1", label: "Monthly HR report template (to be generated from Odoo)", category: "document", status: "pending" },
      { id: "p10t2", label: "HR dashboard design spec (for Odoo admin)", category: "document", status: "pending" },
    ],
    odooSteps: [
      "Configure total headcount dashboard — faculty vs admin, by department",
      "Build faculty-to-student ratio tracker",
      "Set up payroll cost by department report",
      "Configure attendance compliance summary",
      "Build recruitment pipeline dashboard (open positions, TAT)",
      "Configure retention and turnover analytics",
      "Schedule automated monthly email reports to VC and Registrar"
    ],
    authorities: ["Director HR — report design and distribution", "Odoo/Reporting Lead — technical dashboard configuration"],
    note: "One monthly dashboard meeting with VC + Registrar using live Odoo data is the clearest demonstration that HR has become a strategic function — not a transactional one."
  },
];

const HR_PROGRESS_REPORTS = [
  {
    id: "week1",
    title: "Week 1 Deliverables — Phase 0 Completion",
    submittedBy: "Ms. Nasra Naqvi, Director HR",
    submittedDate: "2026-04-05",
    phase: 0,
    summary: "All 5 Phase 0 tasks completed. Employee master data fields defined (mandatory + optional), document checklist finalized, policy observations shared (Sections 5.3, 7.3, 8.1 need revision), Odoo confirmed as single system, and Nasra Naqvi designated as Odoo administrator.",
    keyFindings: [
      "Faculty attendance rules (Section 5.3) need revision before Odoo configuration",
      "Salary Bands (Section 7.3) are yet to be defined — blocks payroll setup",
      "Employment Contracts (Section 8.1) need revision — blocks contract management",
      "Biometric code field has duplicates — needs cleanup (remove one, keep single code)",
      "Left Date field to be shown in master data for departed employees",
    ],
    tasksCompleted: ["p0t1", "p0t2", "p0t3", "p0t4", "p0t5"],
  },
];

const CATEGORY_STYLES = {
  policy:    { bg: "#fffbeb", color: "#d97706", border: "#fde68a", label: "Policy" },
  document:  { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "Document" },
  odoo:      { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0", label: "Odoo Config" },
  action:    { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Immediate Action" },
  authority: { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb", label: "Authority" },
};

const TASK_STATUS_STYLES = {
  completed:   { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0", label: "Completed", icon: CheckCircle },
  in_progress: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", label: "In Progress", icon: Activity },
  pending:     { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb", label: "Pending", icon: Clock },
  blocked:     { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Blocked", icon: AlertTriangle },
};

function HROdooTracker({ role = "hr" }) {
  const isHR = role === "hr";
  const [expandedPhase, setExpandedPhase] = useState(0);
  const [viewMode, setViewMode] = useState("roadmap"); // roadmap | progress | submit | summary
  const [selectedReport, setSelectedReport] = useState(HR_PROGRESS_REPORTS[0]?.id || null);

  /* ═══ Live task state — Director HR can update these ═══ */
  const [roadmap, setRoadmap] = useState(() => JSON.parse(JSON.stringify(HR_ODOO_ROADMAP)));
  const [progressReports, setProgressReports] = useState(() => JSON.parse(JSON.stringify(HR_PROGRESS_REPORTS)));

  /* ═══ Task-level editing state ═══ */
  const [editingTask, setEditingTask] = useState(null); // task id being edited
  const [taskNote, setTaskNote] = useState("");
  const [taskDeliverable, setTaskDeliverable] = useState("");

  /* ═══ Progress report submission form ═══ */
  const [reportForm, setReportForm] = useState({ title: "", summary: "", keyFindings: [""] });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /* ═══ Notification state ═══ */
  const [notification, setNotification] = useState(null);
  const showNotify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  /* ═══ Computed stats from live roadmap ═══ */
  const totalTasks = roadmap.reduce((s, p) => s + p.tasks.length, 0);
  const completedTasks = roadmap.reduce((s, p) => s + p.tasks.filter(t => t.status === "completed").length, 0);
  const inProgressTasks = roadmap.reduce((s, p) => s + p.tasks.filter(t => t.status === "in_progress").length, 0);
  const totalOdooSteps = roadmap.reduce((s, p) => s + (p.odooSteps?.length || 0), 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const currentPhase = roadmap.find(p => p.status === "in_progress") || roadmap.find(p => p.status === "pending");

  /* ═══ Task status update handler (Director HR only) ═══ */
  const updateTaskStatus = (phaseIdx, taskId, newStatus) => {
    setRoadmap(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const task = next[phaseIdx].tasks.find(t => t.id === taskId);
      if (!task) return prev;
      task.status = newStatus;
      if (newStatus === "completed") {
        task.completedDate = new Date().toISOString().split("T")[0];
        task.completedBy = "Ms. Nasra Naqvi";
      } else {
        delete task.completedDate;
        delete task.completedBy;
      }
      // Auto-compute phase status
      const allDone = next[phaseIdx].tasks.every(t => t.status === "completed");
      const anyInProgress = next[phaseIdx].tasks.some(t => t.status === "in_progress" || t.status === "completed");
      next[phaseIdx].status = allDone ? "completed" : anyInProgress ? "in_progress" : "pending";
      return next;
    });
    showNotify(`Task status updated to ${newStatus.replace("_", " ")}`);
  };

  /* ═══ Save task note / deliverable ═══ */
  const saveTaskNote = (phaseIdx, taskId) => {
    setRoadmap(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const task = next[phaseIdx].tasks.find(t => t.id === taskId);
      if (!task) return prev;
      if (taskNote.trim()) task.note = taskNote.trim();
      if (taskDeliverable.trim()) task.deliverable = taskDeliverable.trim();
      return next;
    });
    setEditingTask(null);
    setTaskNote("");
    setTaskDeliverable("");
    showNotify("Task details saved");
  };

  /* ═══ Submit a new progress report ═══ */
  const submitProgressReport = () => {
    if (!reportForm.title.trim() || !reportForm.summary.trim()) {
      showNotify("Please fill in the report title and summary", "error");
      return;
    }
    const completedTaskIds = roadmap.flatMap(p => p.tasks).filter(t => t.status === "completed").map(t => t.id);
    const previouslyReported = progressReports.flatMap(r => r.tasksCompleted || []);
    const newlyCompleted = completedTaskIds.filter(id => !previouslyReported.includes(id));

    const newReport = {
      id: `report-${Date.now()}`,
      title: reportForm.title.trim(),
      submittedBy: "Ms. Nasra Naqvi, Director HR",
      submittedDate: new Date().toISOString().split("T")[0],
      phase: currentPhase?.phase ?? 0,
      summary: reportForm.summary.trim(),
      keyFindings: reportForm.keyFindings.filter(f => f.trim() !== ""),
      tasksCompleted: completedTaskIds,
      newlyCompleted,
    };
    setProgressReports(prev => [newReport, ...prev]);
    setReportForm({ title: "", summary: "", keyFindings: [""] });
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 4000);
    showNotify("Progress report submitted successfully");
  };

  return (
    <div className="space-y-6">
      {/* Notification toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 transition-all ${
          notification.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"
        }`}>
          {notification.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Server size={22} className="text-blue-600" />
            Odoo HR Implementation Tracker
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            11-phase roadmap — Director HR: Ms. Nasra Naqvi (Odoo Administrator)
            {isHR && <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">Edit Mode</span>}
            {!isHR && <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-medium">View Only</span>}
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {[
            { id: "roadmap", label: "Roadmap", icon: Layers },
            { id: "progress", label: "Progress Reports", icon: FileCheck },
            ...(isHR ? [{ id: "submit", label: "Submit Report", icon: Send }] : []),
            { id: "summary", label: "Summary", icon: BarChart3 },
          ].map(v => {
            const VIcon = v.icon;
            return (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === v.id ? "bg-white shadow text-blue-700" : "text-gray-600 hover:text-gray-900"
                }`}>
                <VIcon size={14} /> {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Banner */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-700">{overallProgress}%</div>
          <div className="text-xs text-blue-600 mt-1">Overall Progress</div>
          <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-700">{completedTasks}</div>
          <div className="text-xs text-green-600 mt-1">Tasks Completed</div>
          <div className="text-xs text-green-500 mt-1">of {totalTasks} total tasks</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-700">{inProgressTasks}</div>
          <div className="text-xs text-amber-600 mt-1">In Progress</div>
          <div className="text-xs text-amber-500 mt-1">{totalOdooSteps} Odoo config steps total</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-700">{progressReports.length}</div>
          <div className="text-xs text-purple-600 mt-1">Progress Reports Filed</div>
          <div className="text-xs text-purple-500 mt-1">Phase {currentPhase?.phase ?? "—"} active</div>
        </div>
      </div>

      {/* Current status */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-medium text-red-700">
          Current position: Phase 0 complete. Phase 1 (Policy Foundation) in progress. Biometrics only — no finalized policies yet. Odoo setup awaiting Phase 1 completion.
        </span>
      </div>

      {/* ═══ ROADMAP VIEW ═══ */}
      {viewMode === "roadmap" && (
        <div className="space-y-3">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-2">
            {Object.entries(CATEGORY_STYLES).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.color }} />
                {v.label}
              </span>
            ))}
          </div>

          {roadmap.map((phase, phaseIdx) => {
            const isExpanded = expandedPhase === phase.phase;
            const phaseCompleted = phase.tasks.filter(t => t.status === "completed").length;
            const phaseTotal = phase.tasks.length;
            const phaseProgress = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;
            const pStatus = phase.status === "completed" ? TASK_STATUS_STYLES.completed
                          : phase.status === "in_progress" ? TASK_STATUS_STYLES.in_progress
                          : TASK_STATUS_STYLES.pending;
            const PIcon = pStatus.icon;

            return (
              <div key={phase.phase}
                className="border rounded-xl overflow-hidden transition-shadow"
                style={{ borderColor: isExpanded ? phase.color + "60" : "#e5e7eb" }}>
                {/* Phase header */}
                <button
                  onClick={() => setExpandedPhase(isExpanded ? -1 : phase.phase)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition text-left"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                    style={{ backgroundColor: phase.color + "20", color: phase.color }}>
                    {phase.phase}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{phase.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                        style={{ backgroundColor: pStatus.bg, color: pStatus.color, border: `1px solid ${pStatus.border}` }}>
                        <PIcon size={11} /> {pStatus.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{phase.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{phase.timeline}</span>
                    <span className="text-xs font-medium" style={{ color: phase.color }}>{phaseCompleted}/{phaseTotal}</span>
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${phaseProgress}%`, backgroundColor: phase.color }} />
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                {/* Phase body */}
                {isExpanded && (
                  <div className="border-t px-5 py-4 space-y-4" style={{ borderColor: phase.color + "30" }}>
                    {/* Prerequisites */}
                    {phase.prerequisites && phase.prerequisites.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Prerequisites from earlier phases</div>
                        <div className="flex flex-wrap gap-1.5">
                          {phase.prerequisites.map((p, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{p}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks */}
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Tasks & Deliverables ({phaseCompleted}/{phaseTotal} done)
                      </div>
                      <div className="space-y-2">
                        {phase.tasks.map(task => {
                          const cat = CATEGORY_STYLES[task.category] || CATEGORY_STYLES.action;
                          const tSt = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES.pending;
                          const TIcon = tSt.icon;
                          const isEditing = editingTask === task.id;
                          return (
                            <div key={task.id} className="rounded-lg border transition hover:shadow-sm"
                              style={{ borderColor: tSt.border, backgroundColor: tSt.bg + "40" }}>
                              <div className="flex items-start gap-3 p-3">
                                <TIcon size={16} style={{ color: tSt.color, marginTop: 2, flexShrink: 0 }} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-gray-800">{task.label}</span>
                                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
                                      {cat.label}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: tSt.bg, color: tSt.color, border: `1px solid ${tSt.border}` }}>
                                      {tSt.label}
                                    </span>
                                  </div>
                                  {task.completedDate && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Completed {task.completedDate} by {task.completedBy}
                                    </div>
                                  )}
                                  {task.note && (
                                    <div className="text-xs text-gray-500 mt-1 italic">Note: {task.note}</div>
                                  )}
                                  {task.deliverable && (
                                    <div className="text-xs text-gray-600 mt-1.5 p-2 bg-white rounded border border-gray-100 leading-relaxed">
                                      {task.deliverable}
                                    </div>
                                  )}
                                </div>
                                {/* ═══ HR Director action buttons ═══ */}
                                {isHR && (
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <select
                                      value={task.status}
                                      onChange={e => updateTaskStatus(phaseIdx, task.id, e.target.value)}
                                      className="text-xs border border-gray-200 rounded-md px-1.5 py-1 bg-white cursor-pointer focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="completed">Completed</option>
                                      <option value="blocked">Blocked</option>
                                    </select>
                                    <button
                                      onClick={() => {
                                        if (isEditing) { setEditingTask(null); setTaskNote(""); setTaskDeliverable(""); }
                                        else { setEditingTask(task.id); setTaskNote(task.note || ""); setTaskDeliverable(task.deliverable || ""); }
                                      }}
                                      className="p-1.5 rounded-md hover:bg-white transition border border-transparent hover:border-gray-200"
                                      title="Add note / deliverable"
                                    >
                                      <Edit3 size={14} className={isEditing ? "text-blue-600" : "text-gray-400"} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {/* ═══ Expanded edit area ═══ */}
                              {isHR && isEditing && (
                                <div className="border-t px-4 py-3 space-y-2 bg-white rounded-b-lg" style={{ borderColor: tSt.border }}>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Progress Note</label>
                                    <textarea
                                      value={taskNote}
                                      onChange={e => setTaskNote(e.target.value)}
                                      rows={2}
                                      placeholder="What has been done or what is the current status..."
                                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-300 focus:border-blue-300 resize-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Deliverable / Evidence</label>
                                    <textarea
                                      value={taskDeliverable}
                                      onChange={e => setTaskDeliverable(e.target.value)}
                                      rows={3}
                                      placeholder="Describe what was delivered, list items, or paste key information..."
                                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-300 focus:border-blue-300 resize-none"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => { setEditingTask(null); setTaskNote(""); setTaskDeliverable(""); }}
                                      className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                                      Cancel
                                    </button>
                                    <button onClick={() => saveTaskNote(phaseIdx, task.id)}
                                      className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-1">
                                      <Save size={12} /> Save
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Odoo Configuration Steps */}
                    {phase.odooSteps && phase.odooSteps.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Odoo Configuration Steps</div>
                        <div className="space-y-1.5">
                          {phase.odooSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-green-50 border border-green-100">
                              <Database size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-green-800">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Approval Authorities */}
                    {phase.authorities && phase.authorities.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Approval Authority</div>
                        <div className="flex flex-wrap gap-1.5">
                          {phase.authorities.map((a, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Note */}
                    {phase.note && (
                      <div className="mt-3 p-3 bg-amber-50 border-l-3 border-amber-400 rounded-r-lg text-xs text-amber-800 leading-relaxed"
                        style={{ borderLeft: "3px solid #f59e0b" }}>
                        <strong>Note:</strong> {phase.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ PROGRESS REPORTS VIEW ═══ */}
      {viewMode === "progress" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Director HR — Implementation Progress Reports</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Bi-weekly submissions to management</span>
              {isHR && (
                <button onClick={() => setViewMode("submit")}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 flex items-center gap-1.5">
                  <Send size={13} /> New Report
                </button>
              )}
            </div>
          </div>

          {progressReports.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No progress reports filed yet</p>
              {isHR && (
                <button onClick={() => setViewMode("submit")}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  Submit First Report
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {progressReports.map(report => {
                const isSelected = selectedReport === report.id;
                return (
                  <div key={report.id}
                    className={`border rounded-xl overflow-hidden transition ${isSelected ? "border-blue-300 shadow-md" : "border-gray-200"}`}>
                    <button
                      onClick={() => setSelectedReport(isSelected ? null : report.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileCheck size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-sm text-gray-900">{report.title}</span>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>{report.submittedBy}</span>
                          <span>•</span>
                          <span>{report.submittedDate}</span>
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                            Phase {report.phase} — {report.tasksCompleted.length} tasks completed
                          </span>
                          {report.newlyCompleted && report.newlyCompleted.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                              +{report.newlyCompleted.length} new
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </button>

                    {isSelected && (
                      <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                        <div>
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Summary</div>
                          <p className="text-sm text-gray-700 leading-relaxed">{report.summary}</p>
                        </div>

                        {report.keyFindings && report.keyFindings.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Key Findings & Observations</div>
                            <div className="space-y-1.5">
                              {report.keyFindings.map((f, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-gray-700 p-2 bg-amber-50 rounded-lg border border-amber-100">
                                  <Info size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                  <span>{f}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Tasks Completed ({report.tasksCompleted.length})
                            {report.newlyCompleted && report.newlyCompleted.length > 0 && (
                              <span className="ml-2 text-blue-500 normal-case">({report.newlyCompleted.length} newly completed in this report)</span>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            {report.tasksCompleted.map(tid => {
                              const task = roadmap.flatMap(p => p.tasks).find(t => t.id === tid);
                              if (!task) return null;
                              const isNew = report.newlyCompleted?.includes(tid);
                              return (
                                <div key={tid} className={`flex items-center gap-2 text-sm p-2 rounded-lg border ${isNew ? "bg-blue-50 border-blue-100" : "bg-green-50 border-green-100"}`}>
                                  <CheckCircle size={14} className={isNew ? "text-blue-600 flex-shrink-0" : "text-green-600 flex-shrink-0"} />
                                  <span className={isNew ? "text-blue-800" : "text-green-800"}>{task.label}</span>
                                  {isNew && <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-medium">NEW</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ SUBMIT REPORT VIEW (Director HR only) ═══ */}
      {viewMode === "submit" && isHR && (
        <div className="space-y-5">
          {submitSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600" />
              <div>
                <div className="font-medium text-green-800 text-sm">Report submitted successfully</div>
                <div className="text-xs text-green-600 mt-0.5">Your progress report is now visible to the Registrar, VC, and VP Operations.</div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">Submit Implementation Progress Report</h3>
              <p className="text-sm text-gray-500 mt-1">This report captures the current state of the Odoo HR implementation and is visible to management.</p>
            </div>

            {/* Auto-detected status summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Auto-detected Current Status</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-500">Overall progress:</span> <span className="font-semibold text-blue-700">{overallProgress}%</span></div>
                <div><span className="text-gray-500">Tasks completed:</span> <span className="font-semibold text-green-700">{completedTasks}/{totalTasks}</span></div>
                <div><span className="text-gray-500">Current phase:</span> <span className="font-semibold text-amber-700">Phase {currentPhase?.phase ?? "—"}</span></div>
              </div>
              <div className="mt-3 text-xs text-blue-600">
                The report will automatically include all tasks currently marked as completed in the roadmap.
              </div>
            </div>

            {/* Report title */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Report Title *</label>
              <input
                type="text"
                value={reportForm.title}
                onChange={e => setReportForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Week 2 Progress — Phase 1 Policy Drafts"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Summary *</label>
              <textarea
                value={reportForm.summary}
                onChange={e => setReportForm(f => ({ ...f, summary: e.target.value }))}
                rows={4}
                placeholder="Describe what was accomplished this period, any blockers encountered, and next steps planned..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-300 resize-none"
              />
            </div>

            {/* Key findings */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Key Findings & Observations</label>
              <div className="space-y-2">
                {reportForm.keyFindings.map((finding, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={finding}
                      onChange={e => {
                        const next = [...reportForm.keyFindings];
                        next[i] = e.target.value;
                        setReportForm(f => ({ ...f, keyFindings: next }));
                      }}
                      placeholder={`Finding ${i + 1}...`}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-300 focus:border-blue-300"
                    />
                    {reportForm.keyFindings.length > 1 && (
                      <button onClick={() => setReportForm(f => ({ ...f, keyFindings: f.keyFindings.filter((_, j) => j !== i) }))}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setReportForm(f => ({ ...f, keyFindings: [...f.keyFindings, ""] }))}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                  <Plus size={13} /> Add finding
                </button>
              </div>
            </div>

            {/* Tasks that will be included */}
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Tasks to be reported as completed ({completedTasks})</div>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-3 bg-gray-50">
                {roadmap.flatMap(p => p.tasks).filter(t => t.status === "completed").map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-xs text-green-700">
                    <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                    <span>{task.label}</span>
                  </div>
                ))}
                {completedTasks === 0 && <div className="text-xs text-gray-400 text-center py-2">No tasks marked as completed yet. Update task statuses in the Roadmap view first.</div>}
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button onClick={() => setViewMode("roadmap")}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Back to Roadmap
              </button>
              <button onClick={submitProgressReport}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                <Send size={15} /> Submit Progress Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SUMMARY VIEW ═══ */}
      {viewMode === "summary" && (
        <div className="space-y-6">
          {/* Phase progress chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Phase Progress Overview</h3>
            <div className="space-y-3">
              {roadmap.map((phase, phaseIdx) => {
                const done = phase.tasks.filter(t => t.status === "completed").length;
                const total = phase.tasks.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={phase.phase} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ backgroundColor: phase.color + "20", color: phase.color }}>
                      {phase.phase}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 truncate">{phase.title}</span>
                        <span className="text-xs font-medium ml-2" style={{ color: phase.color }}>{pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: phase.color }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right flex-shrink-0">{done}/{total}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verticals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h4 className="font-semibold text-blue-800 mb-1">Academic HR Vertical</h4>
              <p className="text-xs text-blue-600">Faculty lifecycle · HEC compliance · Research & performance</p>
              <div className="mt-3 text-xs text-blue-700 space-y-1">
                <div>• Phase 1: Employee categories & recruitment policy</div>
                <div>• Phase 7: End-to-end recruitment in Odoo</div>
                <div>• Phase 8: Faculty performance evaluation</div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h4 className="font-semibold text-green-800 mb-1">Corporate HR Vertical</h4>
              <p className="text-xs text-green-600">Admin & support staff · Payroll · Operations</p>
              <div className="mt-3 text-xs text-green-700 space-y-1">
                <div>• Phase 3: Attendance & biometric integration</div>
                <div>• Phase 5: Payroll implementation</div>
                <div>• Phase 9: Discipline & exit management</div>
              </div>
            </div>
          </div>

          {/* Key milestones timeline */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Key Milestones</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              {[
                { label: "Phase 0 Complete — Pre-work delivered", date: "April 5, 2026", done: true },
                { label: "Phase 1 — Policy Foundation approved", date: "Target: Week 3", done: false },
                { label: "Phase 2 — Employee data in Odoo", date: "Target: Week 4", done: false },
                { label: "Phase 3 — Biometric integration live", date: "Target: Week 5", done: false },
                { label: "Phase 5 — Payroll parallel run begins", date: "Target: Week 6", done: false },
                { label: "Phase 5 — Payroll go-live", date: "Target: Week 10", done: false },
                { label: "Phase 10 — Full HR dashboards operational", date: "Target: Month 6+", done: false },
              ].map((m, i) => (
                <div key={i} className="flex items-start gap-4 mb-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                    m.done ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    {m.done ? <CheckCircle size={16} className="text-green-600" /> : <Circle size={16} className="text-gray-400" />}
                  </div>
                  <div className="pt-1">
                    <div className={`text-sm font-medium ${m.done ? "text-green-800" : "text-gray-700"}`}>{m.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{m.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HoDReportsView({ defaultScope = "dean", roleKey = "", roleLabel = "" }) {
  /* ═══ Auth State — auto-connect using organogram identity ═══ */
  const [reportingAuth, setReportingAuth] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const [formData, setFormData] = useState({});
  const [expandedDept, setExpandedDept] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [hodReportsList, setHodReportsList] = useState([]);

  const months = [
    { value: "2026-03", label: "March 2026 (Current)" },
    { value: "2026-02", label: "February 2026" },
    { value: "2026-01", label: "January 2026" },
  ];

  /* ═══ Authenticated Fetch ═══ */
  const apiFetch = useCallback(async (path, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (reportingAuth?.token) {
      headers.Authorization = `Bearer ${reportingAuth.token}`;
    }
    const res = await fetch(`${REPORTING_API_BASE}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }, [reportingAuth]);

  /* ═══ Auto-connect on mount using organogram identity ═══ */
  const autoConnect = useCallback(async () => {
    if (!roleKey) { setAuthError("No role identity available"); setAuthLoading(false); return; }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${REPORTING_API_BASE}/api/login-dss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: roleKey, roleLabel }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Connection failed" }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const result = await res.json();
      setReportingAuth(result);
      setAuthError("");
    } catch (err) {
      setAuthError(err.message || "Cannot connect to Reporting Server");
    } finally {
      setAuthLoading(false);
    }
  }, [roleKey, roleLabel]);

  useEffect(() => {
    autoConnect();
  }, [autoConnect]);

  /* ═══ Load HoD reports ═══ */
  useEffect(() => {
    if (!reportingAuth || reportingAuth.user.role !== "hod") return;
    const loadReports = async () => {
      try {
        const [month, year] = selectedMonth.split("-");
        const data = await apiFetch(`/api/hod-reports?month=${month}&year=${year}&departmentId=${reportingAuth.user.departmentId}`);
        setHodReportsList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log("Error loading HoD reports:", err.message);
        setHodReportsList([]);
      }
    };
    loadReports();
  }, [reportingAuth, selectedMonth, apiFetch]);

  /* ═══ Save HoD report ═══ */
  const saveHodReport = useCallback(async (status = "draft") => {
    if (!reportingAuth || reportingAuth.user.role !== "hod") return;
    setSaveLoading(true);
    try {
      const [month, year] = selectedMonth.split("-");
      await apiFetch("/api/hod-reports", {
        method: "PUT",
        body: JSON.stringify({
          month: parseInt(month),
          year: parseInt(year),
          departmentId: reportingAuth.user.departmentId,
          commentary: formData,
          status,
        }),
      });
      setFormData({});
    } catch (err) {
      alert("Error saving report: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  }, [reportingAuth, selectedMonth, formData, apiFetch]);

  /* ═══ Approve HoD report ═══ */
  const approveHodReport = useCallback(async (reportId) => {
    if (!reportingAuth || reportingAuth.user.role !== "dean") return;
    try {
      await apiFetch(`/api/hod-reports/${reportId}/approve`, { method: "POST" });
      setHodReportsList(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      alert("Error approving report: " + err.message);
    }
  }, [reportingAuth, apiFetch]);

  /* ═══ Return HoD report ═══ */
  const returnHodReport = useCallback(async (reportId, comments) => {
    if (!reportingAuth || reportingAuth.user.role !== "dean") return;
    try {
      await apiFetch(`/api/hod-reports/${reportId}/return`, {
        method: "POST",
        body: JSON.stringify({ comments }),
      });
      setHodReportsList(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      alert("Error returning report: " + err.message);
    }
  }, [reportingAuth, apiFetch]);

  /* ═══ CONNECTING / ERROR SCREEN ═══ */
  if (!reportingAuth) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">HoD Reports {roleLabel ? `— ${roleLabel}` : ""}</h2>

          {authLoading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-sm text-blue-700">Connecting to Reporting Server...</p>
            </div>
          )}

          {authError && !authLoading && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 font-medium mb-2">Reporting Server Not Available</p>
              <p className="text-xs text-amber-700 mb-3">Please ensure the MUST backend is running on port 3000.</p>
              <div className="bg-gray-800 rounded p-3 mb-3">
                <code className="text-xs text-green-400 font-mono">cd "Claude for MUST/must-reporting-system"<br/>node server.js</code>
              </div>
              <button onClick={autoConnect}
                className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition">
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">HoD Monthly Reports</h2>
          <p className="text-sm text-gray-600 mt-1">{roleLabel}</p>
        </div>
      </div>

      {/* Month selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="w-48">
            <label className="block text-xs font-medium text-gray-600 mb-1">Reporting Month</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ══ HOD VIEW — Multi-section report form ══ */}
      {reportingAuth.user.role === "hod" && (() => {
        const activeSection = formData._activeSection || 0;
        const currentSection = REPORT_SECTIONS[activeSection];
        const SecIcon = currentSection.icon;
        const deptId = reportingAuth.user.departmentId;
        const existingReport = MOCK_REPORTS[deptId]?.[selectedMonth.split("-").reverse().join("-")] || MOCK_REPORTS[deptId]?.[selectedMonth];

        return (
          <div className="space-y-4">
            {/* Section navigation */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex gap-1 flex-wrap">
                {REPORT_SECTIONS.map((sec, i) => {
                  const Icon = sec.icon;
                  const filledCount = sec.fields.filter(f => formData[f.id] !== undefined && formData[f.id] !== "" && formData[f.id] !== null).length;
                  return (
                    <button key={sec.id} onClick={() => setFormData(prev => ({ ...prev, _activeSection: i }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        activeSection === i ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-600 hover:bg-gray-100"
                      }`}>
                      <Icon size={14} style={{ color: sec.color }} />
                      <span className="hidden lg:inline">{sec.title}</span>
                      {filledCount > 0 && <span className="ml-1 bg-green-100 text-green-700 rounded-full px-1.5 text-[10px]">{filledCount}/{sec.fields.length}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active section form */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <SecIcon size={20} style={{ color: currentSection.color }} />
                <h3 className="font-bold text-gray-900">{currentSection.title}</h3>
                <span className="ml-auto text-xs text-gray-400">Section {activeSection + 1} of {REPORT_SECTIONS.length}</span>
              </div>
              <div className="space-y-4">
                {currentSection.fields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}{field.unit ? ` (${field.unit})` : ""}</label>
                    {field.type === "number" && (
                      <input type="number" value={formData[field.id] ?? existingReport?.data?.[field.id] ?? ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value === "" ? "" : Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    )}
                    {field.type === "text" && (
                      <input type="text" value={formData[field.id] ?? existingReport?.data?.[field.id] ?? ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    )}
                    {field.type === "textarea" && (
                      <textarea value={formData[field.id] ?? existingReport?.data?.[field.id] ?? ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                        rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    )}
                    {field.type === "select" && (
                      <select value={formData[field.id] ?? existingReport?.data?.[field.id] ?? ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                        <option value="">-- Select --</option>
                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
              {/* Navigation & Save */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <button onClick={() => setFormData(prev => ({ ...prev, _activeSection: Math.max(0, activeSection - 1) }))}
                  disabled={activeSection === 0}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30">
                  Previous
                </button>
                <div className="flex gap-2">
                  <button onClick={() => saveHodReport("draft")} disabled={saveLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    <Save size={14} /> Save Draft
                  </button>
                  {activeSection === REPORT_SECTIONS.length - 1 && (
                    <button onClick={() => saveHodReport("submitted")} disabled={saveLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                      <Send size={14} /> Submit to Dean
                    </button>
                  )}
                </div>
                <button onClick={() => setFormData(prev => ({ ...prev, _activeSection: Math.min(REPORT_SECTIONS.length - 1, activeSection + 1) }))}
                  disabled={activeSection === REPORT_SECTIONS.length - 1}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-30">
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ DEAN VIEW — Review HoD reports ══ */}
      {reportingAuth.user.role === "dean" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">HoD Reports for Review</h3>
            {hodReportsList.length === 0 ? (
              <p className="text-sm text-gray-500">No HoD reports submitted yet for this month.</p>
            ) : (
              <div className="space-y-2">
                {hodReportsList.map(report => (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition"
                    onClick={() => setExpandedDept(expandedDept === report.id ? null : report.id)}>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{report.departmentName || "Department"}</p>
                      <p className="text-xs text-gray-500">{report.hodName} · Status: {report.status}</p>
                    </div>
                    {expandedDept === report.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {expandedDept && hodReportsList.find(r => r.id === expandedDept) && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h4 className="font-bold text-gray-900 mb-3">{hodReportsList.find(r => r.id === expandedDept).departmentName} HoD Report</h4>
              <p className="text-sm text-gray-700 mb-4">{hodReportsList.find(r => r.id === expandedDept).commentary || "No commentary provided"}</p>
              <div className="flex gap-2">
                <button onClick={() => approveHodReport(expandedDept)} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                  Approve
                </button>
                <button onClick={() => returnHodReport(expandedDept, "Please revise and resubmit")} className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600">
                  Request Revision
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ORGANOGRAM BUILDER VIEW — Visual hierarchy editor
   ══════════════════════════════════════════════════════════ */

function OrgBuilderView({ orgTree, setOrgTree, onOpenWorkspace }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [addMode, setAddMode] = useState(false);
  const [addForm, setAddForm] = useState({ id: "", label: "", type: "academic", dssEnabled: true, dataScopeLevel: "institutional", configFile: "", isMultiInstance: false, instanceSelector: "", bypassEscalation: false, dottedLineTo: "", reportsTo: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedNodes, setCollapsedNodes] = useState({});
  const [showJson, setShowJson] = useState(false);
  const [notification, setNotification] = useState(null);

  // Deep clone helper
  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  // Show a temporary notification
  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Find a node by ID in the tree
  const findNode = (tree, id) => {
    if (tree.id === id) return tree;
    if (tree.children) {
      for (const child of tree.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Find parent of a node
  const findParent = (tree, id, parent = null) => {
    if (tree.id === id) return parent;
    if (tree.children) {
      for (const child of tree.children) {
        const found = findParent(child, id, tree);
        if (found) return found;
      }
    }
    return null;
  };

  // Count all nodes in the tree
  const countNodes = (tree) => {
    let count = 1;
    if (tree.children) tree.children.forEach(c => { count += countNodes(c); });
    return count;
  };

  // Count DSS-enabled nodes
  const countDssEnabled = (tree) => {
    let count = tree.dssEnabled ? 1 : 0;
    if (tree.children) tree.children.forEach(c => { count += countDssEnabled(c); });
    return count;
  };

  // Get all node IDs (flat)
  const getAllIds = (tree) => {
    let ids = [tree.id];
    if (tree.children) tree.children.forEach(c => { ids = ids.concat(getAllIds(c)); });
    return ids;
  };

  // Check if ID exists
  const idExists = (id) => getAllIds(orgTree).includes(id);

  // Toggle collapse state
  const toggleCollapse = (nodeId) => {
    setCollapsedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Select a node for viewing/editing
  const handleSelectNode = (node) => {
    setSelectedNode(node);
    setEditMode(false);
    setAddMode(false);
    setEditForm({
      label: node.label,
      type: node.type,
      dssEnabled: node.dssEnabled !== false,
      dataScopeLevel: node.dataScopeLevel || "institutional",
      configFile: node.configFile || "",
      isMultiInstance: node.isMultiInstance || false,
      instanceSelector: node.instanceSelector || "",
      bypassEscalation: node.bypassEscalation || false,
      dottedLineTo: node.dottedLineTo || "",
      reportingNote: node.reportingNote || "",
    });
  };

  // Start adding a child to the selected node
  const handleStartAdd = () => {
    setAddMode(true);
    setEditMode(false);
    const parentId = selectedNode ? selectedNode.id : orgTree.id;
    setAddForm({
      id: "",
      label: "",
      type: "academic",
      dssEnabled: true,
      dataScopeLevel: "institutional",
      configFile: "",
      isMultiInstance: false,
      instanceSelector: "",
      bypassEscalation: false,
      dottedLineTo: "",
      reportsTo: parentId,
    });
  };

  // Commit add
  const handleCommitAdd = () => {
    if (!addForm.id || !addForm.label) { notify("ID and Label are required", "error"); return; }
    if (idExists(addForm.id)) { notify("ID already exists in the organogram", "error"); return; }
    const newTree = deepClone(orgTree);
    const parentId = selectedNode ? selectedNode.id : orgTree.id;
    const parent = findNode(newTree, parentId);
    if (!parent) { notify("Parent node not found", "error"); return; }
    if (!parent.children) parent.children = [];
    const newNode = {
      id: addForm.id,
      label: addForm.label,
      type: addForm.type,
      dssEnabled: addForm.dssEnabled,
      dataScopeLevel: addForm.dataScopeLevel,
      reportsTo: parentId,
    };
    if (addForm.configFile) newNode.configFile = addForm.configFile;
    else newNode.configFile = `workspace-${addForm.id}.json`;
    if (addForm.isMultiInstance) { newNode.isMultiInstance = true; newNode.instanceSelector = addForm.instanceSelector; }
    if (addForm.bypassEscalation) newNode.bypassEscalation = true;
    if (addForm.dottedLineTo) newNode.dottedLineTo = addForm.dottedLineTo;
    parent.children.push(newNode);
    setOrgTree(newTree);
    setAddMode(false);
    setSelectedNode(newNode);
    notify(`Added "${addForm.label}" under "${parent.label}"`);
  };

  // Save edits to node
  const handleSaveEdit = () => {
    if (!selectedNode) return;
    const newTree = deepClone(orgTree);
    const node = findNode(newTree, selectedNode.id);
    if (!node) return;
    node.label = editForm.label;
    node.type = editForm.type;
    node.dssEnabled = editForm.dssEnabled;
    node.dataScopeLevel = editForm.dataScopeLevel;
    node.configFile = editForm.configFile || `workspace-${node.id}.json`;
    node.isMultiInstance = editForm.isMultiInstance;
    node.instanceSelector = editForm.instanceSelector;
    node.bypassEscalation = editForm.bypassEscalation;
    node.dottedLineTo = editForm.dottedLineTo;
    node.reportingNote = editForm.reportingNote;
    setOrgTree(newTree);
    setSelectedNode(node);
    setEditMode(false);
    notify(`Updated "${node.label}"`);
  };

  // Delete a node
  const handleDeleteNode = (nodeId) => {
    if (nodeId === orgTree.id) { notify("Cannot delete the root node", "error"); return; }
    const newTree = deepClone(orgTree);
    const parent = findParent(newTree, nodeId);
    if (parent && parent.children) {
      parent.children = parent.children.filter(c => c.id !== nodeId);
    }
    setOrgTree(newTree);
    setSelectedNode(null);
    setEditMode(false);
    notify("Node deleted");
  };

  // Move node up/down among siblings
  const handleMoveNode = (nodeId, direction) => {
    const newTree = deepClone(orgTree);
    const parent = findParent(newTree, nodeId);
    if (!parent || !parent.children) return;
    const idx = parent.children.findIndex(c => c.id === nodeId);
    if (direction === "up" && idx > 0) {
      [parent.children[idx - 1], parent.children[idx]] = [parent.children[idx], parent.children[idx - 1]];
    } else if (direction === "down" && idx < parent.children.length - 1) {
      [parent.children[idx + 1], parent.children[idx]] = [parent.children[idx], parent.children[idx + 1]];
    }
    setOrgTree(newTree);
  };

  // Duplicate a node (shallow, no children)
  const handleDuplicateNode = (nodeId) => {
    const newTree = deepClone(orgTree);
    const parent = findParent(newTree, nodeId);
    const original = findNode(newTree, nodeId);
    if (!parent || !original) return;
    if (!parent.children) parent.children = [];
    const newId = nodeId + "-copy";
    const dup = { ...deepClone(original), id: newId, label: original.label + " (Copy)", children: undefined };
    dup.configFile = `workspace-${newId}.json`;
    parent.children.push(dup);
    setOrgTree(newTree);
    notify(`Duplicated "${original.label}"`);
  };

  // Reset to default
  const handleReset = () => {
    setOrgTree(JSON.parse(JSON.stringify(DEFAULT_ORG)));
    setSelectedNode(null);
    setEditMode(false);
    setAddMode(false);
    notify("Organogram reset to default");
  };

  // Get node type color
  const getTypeColor = (type) => {
    const found = NODE_TYPES.find(t => t.value === type);
    return found ? found.color : "#6b7280";
  };

  // Flatten tree for search
  const flattenTree = (tree, depth = 0) => {
    let result = [{ ...tree, depth }];
    if (tree.children) tree.children.forEach(c => { result = result.concat(flattenTree(c, depth + 1)); });
    return result;
  };

  const allNodes = flattenTree(orgTree);
  const filteredNodes = searchQuery
    ? allNodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.id.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Generate JSON export
  const generateExportJson = () => {
    const exportObj = {
      "$schema": "unidss-organogram-v1",
      version: "1.0.0",
      university: { name: "University Name", shortName: "UNI", country: "Pakistan", regulatoryFramework: ["PSG-2023", "GEP-2023"] },
      hierarchy: orgTree,
      escalationRules: ESCALATION_CHAIN,
      dataScopeLevels: {
        institutional: "Full university view",
        "academic-stream": "All academic offices aggregated",
        "operations-stream": "All administrative offices",
        "research-stream": "All research offices",
        faculty: "Single faculty view",
        department: "Single department view",
      },
    };
    return JSON.stringify(exportObj, null, 2);
  };

  /* ── Recursive tree node renderer ── */
  function TreeNode({ node, depth = 0 }) {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes[node.id];
    const typeColor = getTypeColor(node.type);
    const isSearchMatch = searchQuery && (node.label.toLowerCase().includes(searchQuery.toLowerCase()) || node.id.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group ${
            isSelected ? "ring-2 ring-blue-400 bg-blue-50" : isSearchMatch ? "bg-yellow-50 ring-1 ring-yellow-300" : "hover:bg-gray-50"
          }`}
          style={{ marginLeft: depth * 24 }}
          onClick={() => handleSelectNode(node)}
        >
          {/* Expand/collapse toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); if (hasChildren) toggleCollapse(node.id); }}
            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            {hasChildren ? (isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />) : <span className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: typeColor + "60" }} />}
          </button>

          {/* Type color indicator */}
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: typeColor }} />

          {/* Node label */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium truncate ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                {node.label}
              </span>
              {node.dssEnabled !== false && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium flex-shrink-0">DSS</span>
              )}
              {node.isMultiInstance && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700 font-medium flex-shrink-0">Multi</span>
              )}
              {node.bypassEscalation && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700 font-medium flex-shrink-0">Bypass</span>
              )}
            </div>
            <div className="text-xs text-gray-500 truncate">{node.id} — {node.type}</div>
          </div>

          {/* Quick actions on hover */}
          <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
            {ROLES[node.id] && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenWorkspace(node.id); }}
                className="p-1 rounded text-blue-500 hover:bg-blue-100"
                title="Open Workspace"
              >
                <Eye size={14} />
              </button>
            )}
            {node.id !== orgTree.id && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                className="p-1 rounded text-red-400 hover:bg-red-100"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && !isCollapsed && (
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 border-l-2 border-gray-200" style={{ marginLeft: depth * 24 + 22 }} />
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* LEFT PANEL — Tree + Toolbar */}
      <div className="w-1/2 border-r border-gray-200 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Organogram Builder</h3>
            <div className="flex gap-2">
              <button onClick={handleStartAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition">
                <Plus size={14} /> Add Office
              </button>
              <button onClick={() => setShowJson(!showJson)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition">
                <FileText size={14} /> {showJson ? "Tree View" : "JSON"}
              </button>
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition">
                <ArrowDown size={14} /> Reset
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search offices by name or ID..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>

          {/* Stats bar */}
          <div className="flex gap-4 mt-3 text-xs text-gray-600">
            <span>Total Offices: <span className="font-semibold text-gray-900">{countNodes(orgTree)}</span></span>
            <span>DSS Enabled: <span className="font-semibold text-green-700">{countDssEnabled(orgTree)}</span></span>
            <span>Types: <span className="font-semibold text-gray-900">{new Set(allNodes.map(n => n.type)).size}</span></span>
          </div>
        </div>

        {/* Search results overlay */}
        {searchQuery && filteredNodes.length > 0 && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
            <p className="text-xs text-yellow-800 font-medium">{filteredNodes.length} match{filteredNodes.length !== 1 ? "es" : ""} found</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {filteredNodes.slice(0, 8).map(n => (
                <button
                  key={n.id}
                  onClick={() => { handleSelectNode(n); setSearchQuery(""); }}
                  className="px-2 py-1 bg-white border border-yellow-300 rounded text-xs text-gray-800 hover:bg-yellow-100"
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tree or JSON */}
        <div className="flex-1 overflow-y-auto p-4">
          {showJson ? (
            <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{generateExportJson()}</pre>
            </div>
          ) : (
            <div className="space-y-0.5">
              <TreeNode node={orgTree} depth={0} />
            </div>
          )}
        </div>

        {/* Node type legend */}
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500 font-medium mb-2">Node Types</p>
          <div className="flex flex-wrap gap-2">
            {NODE_TYPES.map(nt => (
              <div key={nt.value} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: nt.color }} />
                <span className="text-xs text-gray-600">{nt.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Properties / Add Form */}
      <div className="w-1/2 bg-white overflow-y-auto">
        {/* Notification banner */}
        {notification && (
          <div className={`mx-6 mt-4 px-4 py-2 rounded-lg text-sm font-medium ${notification.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
            {notification.msg}
          </div>
        )}

        {addMode ? (
          /* ── Add New Office Form ── */
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Add New Office</h3>
              <button onClick={() => setAddMode(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Adding under: <span className="font-semibold text-blue-700">{selectedNode ? selectedNode.label : orgTree.label}</span>
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Office ID *</label>
                  <input type="text" value={addForm.id} onChange={(e) => setAddForm({ ...addForm, id: e.target.value.replace(/\s+/g, "").toLowerCase() })}
                    placeholder="e.g., sports" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <p className="text-xs text-gray-400 mt-1">Unique, lowercase, no spaces</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Display Label *</label>
                  <input type="text" value={addForm.label} onChange={(e) => setAddForm({ ...addForm, label: e.target.value })}
                    placeholder="e.g., Sports & Recreation" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Office Type</label>
                  <select value={addForm.type} onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                    {NODE_TYPES.map(nt => <option key={nt.value} value={nt.value}>{nt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Data Scope Level</label>
                  <select value={addForm.dataScopeLevel} onChange={(e) => setAddForm({ ...addForm, dataScopeLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                    {DATA_SCOPE_OPTIONS.map(ds => <option key={ds.value} value={ds.value}>{ds.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Config File</label>
                <input type="text" value={addForm.configFile} onChange={(e) => setAddForm({ ...addForm, configFile: e.target.value })}
                  placeholder={addForm.id ? `workspace-${addForm.id}.json` : "Auto-generated from ID"} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={addForm.dssEnabled} onChange={(e) => setAddForm({ ...addForm, dssEnabled: e.target.checked })}
                    className="rounded border-gray-300" />
                  <span className="text-gray-700">DSS Enabled</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={addForm.isMultiInstance} onChange={(e) => setAddForm({ ...addForm, isMultiInstance: e.target.checked })}
                    className="rounded border-gray-300" />
                  <span className="text-gray-700">Multi-Instance</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={addForm.bypassEscalation} onChange={(e) => setAddForm({ ...addForm, bypassEscalation: e.target.checked })}
                    className="rounded border-gray-300" />
                  <span className="text-gray-700">Bypass Escalation</span>
                </label>
              </div>

              {addForm.isMultiInstance && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Instance Selector</label>
                  <input type="text" value={addForm.instanceSelector} onChange={(e) => setAddForm({ ...addForm, instanceSelector: e.target.value })}
                    placeholder="e.g., faculty, department" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Dotted-Line To (optional)</label>
                <select value={addForm.dottedLineTo} onChange={(e) => setAddForm({ ...addForm, dottedLineTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                  <option value="">None</option>
                  {allNodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Secondary reporting / coordination line (like IQAE → Provost)</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleCommitAdd} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                  <Plus size={16} /> Add Office
                </button>
                <button onClick={() => setAddMode(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : selectedNode ? (
          /* ── Node Properties Panel ── */
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{editMode ? "Edit Office" : "Office Properties"}</h3>
              <div className="flex gap-2">
                {!editMode && (
                  <>
                    <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition">
                      <Edit3 size={14} /> Edit
                    </button>
                    <button onClick={() => handleStartAdd()} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition">
                      <Plus size={14} /> Add Child
                    </button>
                    <button onClick={() => handleDuplicateNode(selectedNode.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition">
                      <Copy size={14} /> Duplicate
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-6 flex-wrap">
              {(() => {
                const path = [];
                let current = selectedNode.id;
                let safety = 0;
                while (current && safety < 10) {
                  const node = findNode(orgTree, current);
                  if (node) { path.unshift(node); const parent = findParent(orgTree, current); current = parent ? parent.id : null; }
                  else break;
                  safety++;
                }
                return path.map((p, i) => (
                  <span key={p.id} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight size={12} className="text-gray-300" />}
                    <button onClick={() => handleSelectNode(p)} className="hover:text-blue-600 hover:underline">{p.label}</button>
                  </span>
                ));
              })()}
            </div>

            {editMode ? (
              /* Edit form */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Office ID</label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono">{selectedNode.id}</div>
                  <p className="text-xs text-gray-400 mt-1">ID cannot be changed after creation</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Display Label</label>
                  <input type="text" value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Office Type</label>
                    <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                      {NODE_TYPES.map(nt => <option key={nt.value} value={nt.value}>{nt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Data Scope Level</label>
                    <select value={editForm.dataScopeLevel} onChange={(e) => setEditForm({ ...editForm, dataScopeLevel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                      {DATA_SCOPE_OPTIONS.map(ds => <option key={ds.value} value={ds.value}>{ds.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Config File</label>
                  <input type="text" value={editForm.configFile} onChange={(e) => setEditForm({ ...editForm, configFile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editForm.dssEnabled} onChange={(e) => setEditForm({ ...editForm, dssEnabled: e.target.checked })} className="rounded border-gray-300" />
                    <span className="text-gray-700">DSS Enabled</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editForm.isMultiInstance} onChange={(e) => setEditForm({ ...editForm, isMultiInstance: e.target.checked })} className="rounded border-gray-300" />
                    <span className="text-gray-700">Multi-Instance</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editForm.bypassEscalation} onChange={(e) => setEditForm({ ...editForm, bypassEscalation: e.target.checked })} className="rounded border-gray-300" />
                    <span className="text-gray-700">Bypass Escalation</span>
                  </label>
                </div>

                {editForm.isMultiInstance && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Instance Selector</label>
                    <input type="text" value={editForm.instanceSelector} onChange={(e) => setEditForm({ ...editForm, instanceSelector: e.target.value })}
                      placeholder="e.g., faculty, department" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dotted-Line To</label>
                  <select value={editForm.dottedLineTo} onChange={(e) => setEditForm({ ...editForm, dottedLineTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
                    <option value="">None</option>
                    {allNodes.filter(n => n.id !== selectedNode.id).map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Reporting Note</label>
                  <input type="text" value={editForm.reportingNote} onChange={(e) => setEditForm({ ...editForm, reportingNote: e.target.value })}
                    placeholder="e.g., Direct to VC — PSG-2023 functional independence" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleSaveEdit} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                    <Save size={16} /> Save Changes
                  </button>
                  <button onClick={() => setEditMode(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                    Cancel
                  </button>
                  {selectedNode.id !== orgTree.id && (
                    <button onClick={() => handleDeleteNode(selectedNode.id)} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition ml-auto">
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Read-only view */
              <div className="space-y-5">
                {/* Header card */}
                <div className="rounded-xl border-2 p-5" style={{ borderColor: getTypeColor(selectedNode.type) + "40", backgroundColor: getTypeColor(selectedNode.type) + "08" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: getTypeColor(selectedNode.type) }}>
                      {selectedNode.label.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{selectedNode.label}</h4>
                      <p className="text-xs text-gray-500">{selectedNode.type} · {selectedNode.id}</p>
                    </div>
                  </div>
                  {selectedNode.reportingNote && (
                    <p className="text-xs text-gray-600 bg-white rounded-lg px-3 py-2 mt-2">{selectedNode.reportingNote}</p>
                  )}
                </div>

                {/* Properties grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Data Scope Level</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedNode.dataScopeLevel || "institutional"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Config File</p>
                    <p className="text-sm font-mono text-gray-900 truncate">{selectedNode.configFile || "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Reports To</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedNode.reportsTo || "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Dotted Line To</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedNode.dottedLineTo || "None"}</p>
                  </div>
                </div>

                {/* Flags */}
                <div className="flex gap-3 flex-wrap">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedNode.dssEnabled !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                    {selectedNode.dssEnabled !== false ? "DSS Workspace Active" : "DSS Not Enabled"}
                  </span>
                  {selectedNode.isMultiInstance && (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-800">
                      Multi-Instance (selector: {selectedNode.instanceSelector})
                    </span>
                  )}
                  {selectedNode.bypassEscalation && (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-100 text-orange-800">
                      Escalation Bypass Enabled
                    </span>
                  )}
                  {selectedNode.canDrillDown && (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
                      Can Drill Down
                    </span>
                  )}
                </div>

                {/* Aggregates from */}
                {selectedNode.aggregatesFrom && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Aggregates Data From</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.aggregatesFrom.map(agg => (
                        <span key={agg} className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 font-medium">{agg}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Children summary */}
                {selectedNode.children && selectedNode.children.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Direct Reports ({selectedNode.children.length})</p>
                    <div className="space-y-1">
                      {selectedNode.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => handleSelectNode(child)}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition"
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getTypeColor(child.type) }} />
                          <span className="text-sm text-gray-900 font-medium">{child.label}</span>
                          <span className="text-xs text-gray-500 ml-auto">{child.type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {selectedNode.id !== orgTree.id && (
                    <>
                      <button onClick={() => handleMoveNode(selectedNode.id, "up")} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition">
                        <ChevronUp size={14} /> Move Up
                      </button>
                      <button onClick={() => handleMoveNode(selectedNode.id, "down")} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition">
                        <ChevronDown size={14} /> Move Down
                      </button>
                    </>
                  )}
                  {ROLES[selectedNode.id] && (
                    <button onClick={() => onOpenWorkspace(selectedNode.id)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition ml-auto">
                      <Eye size={14} /> Open Workspace
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── No selection placeholder ── */
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-sm">
              <FolderTree size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Select an Office</h3>
              <p className="text-sm text-gray-600 mb-4">
                Click any office in the tree to view its properties, edit its configuration, or add child offices.
              </p>
              <button onClick={handleStartAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition mx-auto">
                <Plus size={16} /> Add New Office
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   INTEGRATION VIEW — API & Data Sources
   ══════════════════════════════════════════════════════════ */

function IntegrationView() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">API & Integration Management</h2>
        <p className="text-gray-600">System-wide data source status, configuration registry, and API health metrics</p>
      </div>

      {/* DATA SOURCES PANEL */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Data Sources</h3>
        <div className="grid grid-cols-2 gap-4">
          {DATA_SOURCES.map((source, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-gray-900">{source.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">Sync: {source.syncMode}</p>
                </div>
                <div className="text-right">
                  {source.status === "healthy" ? (
                    <Wifi size={24} className="text-green-600" />
                  ) : (
                    <WifiOff size={24} className="text-orange-600" />
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className="font-semibold px-2 py-1 rounded"
                    style={{
                      backgroundColor: source.status === "healthy" ? "#ecfdf5" : "#fffbeb",
                      color: source.status === "healthy" ? "#10b981" : "#f59e0b",
                    }}
                  >
                    {source.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Endpoints:</span>
                  <span className="font-semibold">{source.endpoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="font-semibold">{formatTime(source.lastSync)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONFIGURATION REGISTRY */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Configuration Registry</h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Config File</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Data Scope</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(ConfigRegistry.roleConfigs).map(([roleId, configFile]) => (
                  <tr key={roleId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{ROLES[roleId]?.label || roleId}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{configFile}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {roleId === "vc" ? "Institutional" : roleId === "dean" ? "Faculty" : roleId === "hod" ? "Department" : "Institutional"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-50 text-green-700">
                        Loaded
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* API HEALTH */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">API Health Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
            <div className="text-3xl font-bold text-blue-600">2,847</div>
            <p className="text-sm text-gray-600 mt-2">API Calls Today</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
            <div className="text-3xl font-bold text-green-600">142ms</div>
            <p className="text-sm text-gray-600 mt-2">Avg Response Time</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
            <div className="text-3xl font-bold text-green-600">0.12%</div>
            <p className="text-sm text-gray-600 mt-2">Error Rate</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5 text-center">
            <div className="text-3xl font-bold text-orange-600">8</div>
            <p className="text-sm text-gray-600 mt-2">Active Webhooks</p>
          </div>
        </div>
      </div>

      {/* ESCALATION CHAIN */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-3">Escalation Chain Configuration</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-blue-800">Default Grace Period:</span>
            <span className="ml-2 font-semibold text-blue-900">{ESCALATION_CHAIN.defaultGracePeriodHours} hours</span>
          </div>
          <div>
            <span className="text-blue-800">Critical Grace Period:</span>
            <span className="ml-2 font-semibold text-blue-900">{ESCALATION_CHAIN.criticalGracePeriodHours} hours</span>
          </div>
          <div>
            <span className="text-blue-800">Chain:</span>
            <span className="ml-2 font-semibold text-blue-900">{ESCALATION_CHAIN.chain}</span>
          </div>
          <div>
            <span className="text-blue-800">IQAE Bypass:</span>
            <span className="ml-2 font-semibold text-blue-900">{ESCALATION_CHAIN.iqaeBypassProvost ? "Enabled" : "Disabled"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
