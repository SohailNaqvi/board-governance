import { PrismaClient, GovernanceBodyType, DecisionCategory, DecisionStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedDecision {
  decisionRef: string;
  title: string;
  summary: string;
  sourceBodyType: GovernanceBodyType;
  sourceMeeting: string;
  decidedAt: Date;
  category: DecisionCategory;
  status: DecisionStatus;
  proposer: string;
  caseRef?: string;
}

const decisions: SeedDecision[] = [
  // Board of Governors - 5 decisions
  {
    decisionRef: "DEC-2025-001",
    title: "Strategic Plan 2025-2030 Approval",
    summary: "Approved the university strategic plan for 2025-2030 with emphasis on research excellence and student outcomes.",
    sourceBodyType: "BOARD_OF_GOVERNORS",
    sourceMeeting: "BoG-2025-Jan",
    decidedAt: new Date("2025-01-15"),
    category: "STRATEGIC",
    status: "APPROVED",
    proposer: "Vice Chancellor",
  },
  {
    decisionRef: "DEC-2025-002",
    title: "Annual Budget Approval FY 2025-26",
    summary: "Approved the annual operating budget of PKR 2.5 billion with 15% allocation to research infrastructure.",
    sourceBodyType: "BOARD_OF_GOVERNORS",
    sourceMeeting: "BoG-2025-Feb",
    decidedAt: new Date("2025-02-20"),
    category: "FINANCIAL",
    status: "APPROVED",
    proposer: "Treasurer",
  },
  {
    decisionRef: "DEC-2025-003",
    title: "Vice Chancellor Performance Evaluation",
    summary: "Completed VC evaluation with rating 'Excellent' and contract renewal authorized for 3 years.",
    sourceBodyType: "BOARD_OF_GOVERNORS",
    sourceMeeting: "BoG-2025-Mar",
    decidedAt: new Date("2025-03-10"),
    category: "HR",
    status: "APPROVED",
    proposer: "Board Chair",
  },
  {
    decisionRef: "DEC-2025-004",
    title: "External Auditor Appointment",
    summary: "Appointed KPMG as external auditor for 3-year term effective July 2025.",
    sourceBodyType: "BOARD_OF_GOVERNORS",
    sourceMeeting: "BoG-2025-Apr",
    decidedAt: new Date("2025-04-05"),
    category: "COMPLIANCE",
    status: "APPROVED",
    proposer: "Finance Committee",
  },
  {
    decisionRef: "DEC-2025-005",
    title: "Endowment Fund Investment Policy",
    summary: "Adopted new investment policy with 60% equities, 30% fixed income, 10% alternatives; minimum 5% annual disbursement.",
    sourceBodyType: "BOARD_OF_GOVERNORS",
    sourceMeeting: "BoG-2025-May",
    decidedAt: new Date("2025-05-12"),
    category: "FINANCIAL",
    status: "CONDITIONALLY_APPROVED",
    proposer: "Investment Committee",
    caseRef: "CASE-2025-456",
  },

  // Syndicate - 6 decisions
  {
    decisionRef: "DEC-2025-006",
    title: "Faculty Promotion: Dr. Fatima Ahmed",
    summary: "Promoted Dr. Fatima Ahmed from Associate Professor to Professor in Computer Science with effective date July 2025.",
    sourceBodyType: "SYNDICATE",
    sourceMeeting: "SYN-2025-Jan",
    decidedAt: new Date("2025-01-22"),
    category: "HR",
    status: "APPROVED",
    proposer: "Promotions Committee",
  },
  {
    decisionRef: "DEC-2025-007",
    title: "Staff Leave Policy Revision",
    summary: "Updated leave policy: annual leave increased to 25 days, paternity leave extended to 15 days, 5 days bereavement leave added.",
    sourceBodyType: "SYNDICATE",
    sourceMeeting: "SYN-2025-Feb",
    decidedAt: new Date("2025-02-18"),
    category: "HR",
    status: "APPROVED",
    proposer: "HR Committee",
  },
  {
    decisionRef: "DEC-2025-008",
    title: "Fee Structure Revision 2025-26",
    summary: "Fee increase approved: undergrad 8%, postgrad 10%, PhD 5%. Separate scholarship support of PKR 50M allocated.",
    sourceBodyType: "SYNDICATE",
    sourceMeeting: "SYN-2025-Mar",
    decidedAt: new Date("2025-03-15"),
    category: "FINANCIAL",
    status: "CONDITIONALLY_APPROVED",
    proposer: "Finance Committee",
    caseRef: "CASE-2025-457",
  },
  {
    decisionRef: "DEC-2025-009",
    title: "MOU with Beijing Normal University",
    summary: "Approved MOU for student and faculty exchange program; 10 undergrad and 5 postgrad placements annually.",
    sourceBodyType: "SYNDICATE",
    sourceMeeting: "SYN-2025-Apr",
    decidedAt: new Date("2025-04-08"),
    category: "ACADEMIC",
    status: "APPROVED",
    proposer: "International Office",
  },
  {
    decisionRef: "DEC-2025-010",
    title: "Research Ethics Committee TOR",
    summary: "Established REC with revised Terms of Reference; monthly meetings, 11-member committee with external representation.",
    sourceBodyType: "SYNDICATE",
    sourceMeeting: "SYN-2025-May",
    decidedAt: new Date("2025-05-20"),
    category: "RESEARCH",
    status: "APPROVED",
    proposer: "Research Office",
  },
  {
    decisionRef: "DEC-2025-011",
    title: "Student Disciplinary Policy Update",
    summary: "Revised disciplinary code with graduated sanctions, appeal process, and restorative justice options.",
    sourceBodyType: "SYNDICATE",
    sourceMeeting: "SYN-2025-Jun",
    decidedAt: new Date("2025-06-10"),
    category: "STUDENT_AFFAIRS",
    status: "DEFERRED",
    proposer: "Student Affairs",
  },

  // Academic Council - 6 decisions
  {
    decisionRef: "DEC-2025-012",
    title: "BS Data Science Programme Approval",
    summary: "Approved new 4-year BS in Data Science with 120 credit hours, starting intake Spring 2026; 40 seats.",
    sourceBodyType: "ACADEMIC_COUNCIL",
    sourceMeeting: "AC-2025-Jan",
    decidedAt: new Date("2025-01-20"),
    category: "ACADEMIC",
    status: "APPROVED",
    proposer: "School of Sciences",
  },
  {
    decisionRef: "DEC-2025-013",
    title: "Curriculum Revision: MBA",
    summary: "MBA curriculum updated with 12 new electives in fintech and sustainability; capstone project mandatory.",
    sourceBodyType: "ACADEMIC_COUNCIL",
    sourceMeeting: "AC-2025-Feb",
    decidedAt: new Date("2025-02-14"),
    category: "ACADEMIC",
    status: "APPROVED",
    proposer: "School of Business",
  },
  {
    decisionRef: "DEC-2025-014",
    title: "Examination Regulation Amendment",
    summary: "Increased continuous assessment weightage from 30% to 40%; introduced open-book exam option for selected courses.",
    sourceBodyType: "ACADEMIC_COUNCIL",
    sourceMeeting: "AC-2025-Mar",
    decidedAt: new Date("2025-03-12"),
    category: "ACADEMIC",
    status: "APPROVED",
    proposer: "Examination Board",
  },
  {
    decisionRef: "DEC-2025-015",
    title: "Credit Transfer Policy",
    summary: "Approved credit transfer from LUMS and FAST; max 60 credits transferable; GPA threshold 3.0.",
    sourceBodyType: "ACADEMIC_COUNCIL",
    sourceMeeting: "AC-2025-Apr",
    decidedAt: new Date("2025-04-16"),
    category: "ACADEMIC",
    status: "REJECTED",
    proposer: "Registrar",
  },
  {
    decisionRef: "DEC-2025-016",
    title: "QEC Report 2024 Approval",
    summary: "Approved Quality Enhancement Cell annual report; 15 programmes achieve Level 4, 8 programmes Level 3.",
    sourceBodyType: "ACADEMIC_COUNCIL",
    sourceMeeting: "AC-2025-May",
    decidedAt: new Date("2025-05-18"),
    category: "COMPLIANCE",
    status: "APPROVED",
    proposer: "QEC Director",
  },
  {
    decisionRef: "DEC-2025-017",
    title: "Research Ethics Policy",
    summary: "Implemented new research ethics guidelines; mandatory training for all researchers; animal research oversight enhanced.",
    sourceBodyType: "ACADEMIC_COUNCIL",
    sourceMeeting: "AC-2025-Jun",
    decidedAt: new Date("2025-06-08"),
    category: "RESEARCH",
    status: "APPROVED",
    proposer: "Research Integrity Officer",
  },

  // ASRB - 8 decisions
  {
    decisionRef: "DEC-2025-018",
    title: "PhD Synopsis Approval: Ali Hassan",
    summary: "Approved PhD synopsis in Structural Engineering; title 'Seismic Analysis of Composite Materials'; 36-month candidature.",
    sourceBodyType: "ASRB",
    sourceMeeting: "ASRB-2025-Jan",
    decidedAt: new Date("2025-01-10"),
    category: "RESEARCH",
    status: "APPROVED",
    proposer: "ASRB Chair",
  },
  {
    decisionRef: "DEC-2025-019",
    title: "Examiner Appointment: Prof. Sarah Mitchell",
    summary: "Appointed Prof. Sarah Mitchell (University of Manchester) as external examiner for Renewable Energy PhD programme.",
    sourceBodyType: "ASRB",
    sourceMeeting: "ASRB-2025-Jan",
    decidedAt: new Date("2025-01-24"),
    category: "RESEARCH",
    status: "APPROVED",
    proposer: "Department of Energy",
  },
  {
    decisionRef: "DEC-2025-020",
    title: "Supervisor Change: Aisha Malik",
    summary: "Approved change of principal supervisor for Aisha Malik (Chemistry) from Dr. Khan to Dr. Parvez due to relocation.",
    sourceBodyType: "ASRB",
    sourceMeeting: "ASRB-2025-Feb",
    decidedAt: new Date("2025-02-07"),
    category: "RESEARCH",
    status: "APPROVED",
    proposer: "Chemistry Department",
  },
  {
    decisionRef: "DEC-2025-021",
    title: "Thesis Result: Muhammad Iqbal",
    summary: "Approved thesis in Physics with minor revisions; result 'Minor Revision Required'; revision deadline 3 months.",
    sourceBodyType: "ASRB",
    sourceMeeting: "ASRB-2025-Feb",
    decidedAt: new Date("2025-02-21"),
    category: "RESEARCH",
    status: "APPROVED",
    proposer: "Physics Department",
  },
  {
    decisionRef: "DEC-2025-022",
    title: "Candidature Extension: Zainab Sheikh",
    summary: "Granted 12-month extension to Zainab Sheikh (Mathematics) due to illness; new completion date Dec 2025.",
    sourceBodyType: "ASRB",
    sourceMeeting: "ASRB-2025-Mar",
    decidedAt: new Date("2025-03-05"),
    category: "RESEARCH",
    status: "APPROVED",
    proposer: "Mathematics Department",
  },
  {
    decisionRef: "DEC-2025-023",
    title: "Comprehensive Exam Result: Omar Farooq",
    summary: "Approved comprehensive exam result for Omar Farooq (Biochemistry); passed with distinction; eligible for topic selection.",
    sourceBodyType: "ASRB",
    sourceMeeting: "ASRB-2025-Mar",
    decidedAt: new Date("2025-03-18"),
    category: "RESEARCH",
    status: "APPROVED",
    proposer: "Biochemistry Department",
  },
  {
    decisionRef: "DEC-2025-024",
    title: "GEC Constitution Revision",
    summary: "Revised Graduate Education Committee with expanded student representation (2 to 4 members) and external advisor added.",
    sourceBodyType: "ASRB",
    sourceMeeting: "ASRB-2025-Apr",
    decidedAt: new Date("2025-04-09"),
    category: "OPERATIONS",
    status: "RATIFIED",
    proposer: "ASRB Chair",
  },
  {
    decisionRef: "DEC-2025-025",
    title: "PhD Topic Change: Hana Waseem",
    summary: "Approved topic change for Hana Waseem from 'Urban Design' to 'Sustainable Urban Development'; supervisor unchanged.",
    sourceBodyType: "ASRB",
    sourceMeeting: "ASRB-2025-May",
    decidedAt: new Date("2025-05-15"),
    category: "RESEARCH",
    status: "RATIFIED",
    proposer: "Architecture Department",
  },
  {
    decisionRef: "DEC-2025-026",
    title: "PhD Termination: Hassan Khan",
    summary: "Approved termination of Hassan Khan's PhD (Geology) effective immediately; student pursuing Master's instead.",
    sourceBodyType: "ASRB",
    sourceMeeting: "ASRB-2025-May",
    decidedAt: new Date("2025-05-29"),
    category: "RESEARCH",
    status: "RESCINDED",
    proposer: "Geology Department",
  },
];

async function main() {
  console.log("Starting seed of decisions...");

  for (const decision of decisions) {
    await prisma.governanceDecision.upsert({
      where: { decisionRef: decision.decisionRef },
      update: {},
      create: {
        ...decision,
      },
    });
    console.log(`Seeded decision: ${decision.decisionRef}`);
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
