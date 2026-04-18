// Direct seed script using pg (no Prisma client needed)
import pg from "pg";
import crypto from "crypto";
const { Client } = pg;

// Generate cuid-like IDs (Prisma uses cuid by default)
function cuid() {
  return 'c' + crypto.randomBytes(12).toString('hex').slice(0, 24);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected to database");

  // Clear existing data in order
  const tables = [
    "AuditEvent", "NotificationForAction", "ActionTakenEntry", "Decision",
    "MemberQuery", "ReadReceipt", "SyndicateMember", "Annexure",
    "WorkingPaper", "FeederBodyResolution", "AgendaItem", "MeetingCalendar",
    "User", "Role"
  ];
  for (const t of tables) {
    await client.query(`DELETE FROM "${t}"`);
  }
  console.log("Cleared existing data");

  // Create roles
  const roles = [
    ["AUTHORIZED_PROPOSER", "Can propose agenda items"],
    ["FEEDER_BODY_SECRETARY", "Manages feeder body resolutions"],
    ["REGISTRAR", "University registrar"],
    ["TREASURER_LEGAL", "Treasurer and legal officer"],
    ["VICE_CHANCELLOR", "Vice chancellor"],
    ["SYNDICATE_MEMBER", "Member of syndicate"],
    ["SYSTEM_ADMINISTRATOR", "System administrator"],
  ];
  for (const [name, desc] of roles) {
    await client.query(
      `INSERT INTO "Role" (id, name, description, "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW())`,
      [cuid(), name, desc]
    );
  }
  console.log(`Created ${roles.length} roles`);

  // Create users
  const users = [
    ["proposer@university.edu", "Alice Proposer", "AUTHORIZED_PROPOSER"],
    ["secretary@university.edu", "Bob Secretary", "FEEDER_BODY_SECRETARY"],
    ["registrar@university.edu", "Carol Registrar", "REGISTRAR"],
    ["member@university.edu", "David Member", "SYNDICATE_MEMBER"],
    ["treasurer@university.edu", "Eva Treasurer", "TREASURER_LEGAL"],
    ["sysadmin@university.edu", "Frank Admin", "SYSTEM_ADMINISTRATOR"],
    ["vc@university.edu", "Grace Vice Chancellor", "VICE_CHANCELLOR"],
  ];
  for (const [email, name, role] of users) {
    await client.query(
      `INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [cuid(), email, name, role]
    );
  }
  console.log(`Created ${users.length} users`);

  // Create meeting calendar
  const meetingId = cuid();
  await client.query(
    `INSERT INTO "MeetingCalendar" (id, "meetingNumber", "meetingDate", "meetingLocation", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())`,
    [meetingId, 1, new Date("2024-06-15T10:00:00"), "Senate House, Conference Room A"]
  );
  console.log("Created meeting calendar");

  // Create agenda items first (needed for feeder body resolutions)
  const agendaItem1Id = cuid();
  const agendaItem2Id = cuid();
  await client.query(
    `INSERT INTO "AgendaItem" (id, "meetingCalendarId", "itemNumber", title, description, status, "proposedBy", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [agendaItem1Id, meetingId, 1, "Academic Standards Review", "Review of academic standards and curriculum", "DRAFT", "proposer@university.edu"]
  );
  await client.query(
    `INSERT INTO "AgendaItem" (id, "meetingCalendarId", "itemNumber", title, description, status, "proposedBy", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [agendaItem2Id, meetingId, 2, "Student Welfare Report", "Report on student welfare and campus facilities", "DRAFT", "proposer@university.edu"]
  );
  console.log("Created 2 agenda items");

  // Create feeder body resolutions
  for (let i = 1; i <= 2; i++) {
    await client.query(
      `INSERT INTO "FeederBodyResolution" (id, "meetingCalendarId", "agendaItemId", "bodyCode", "resolutionNumber", "resolutionText", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        cuid(), meetingId, i === 1 ? agendaItem1Id : agendaItem2Id,
        "SN", i,
        i === 1 ? "Resolution on academic standards and curriculum review" : "Resolution on student welfare and campus facilities"
      ]
    );
  }
  console.log("Created 2 feeder body resolutions");

  // Create syndicate members
  const members = [
    ["member1@university.edu", "Dr. John Smith", "SM001", "Computer Science", "2020-01-01"],
    ["member2@university.edu", "Prof. Jane Doe", "SM002", "Mathematics", "2019-06-15"],
  ];
  for (const [email, name, num, dept, joinDate] of members) {
    await client.query(
      `INSERT INTO "SyndicateMember" (id, email, name, "memberNumber", department, "joinDate", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [cuid(), email, name, num, dept, new Date(joinDate)]
    );
  }
  console.log("Created 2 syndicate members");

  console.log("Database seeded successfully!");
  await client.end();
}

main().catch((err) => {
  console.error("Error seeding:", err);
  process.exit(1);
});
