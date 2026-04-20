import pg from "pg";
import crypto from "crypto";
const { Client } = pg;

function cuid() {
  return "c" + crypto.randomBytes(12).toString("hex").slice(0, 24);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected to database for Slice 3 prerequisites seeding");

  // --- Seed 2 ASRBMeetings (idempotent via ON CONFLICT) ---
  const meetings = [
    {
      id: cuid(),
      meetingNumber: 1,
      scheduledAt: "2026-05-15T10:00:00Z",
      status: "SCHEDULED",
      cycleCode: "2026-Q2",
    },
    {
      id: cuid(),
      meetingNumber: 2,
      scheduledAt: "2026-06-20T10:00:00Z",
      status: "SCHEDULED",
      cycleCode: "2026-Q2",
    },
  ];

  for (const m of meetings) {
    await client.query(
      `INSERT INTO "ASRBMeeting" (id, "meetingNumber", "scheduledAt", status, "cycleCode", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT ("meetingNumber") DO NOTHING`,
      [m.id, m.meetingNumber, m.scheduledAt, m.status, m.cycleCode]
    );
  }
  console.log("Seeded 2 ASRB meetings");

  // --- Seed 6 ASRBMembers (idempotent via checking existence) ---
  const members = [
    { fullName: "Prof. Ahmad Kamal", designation: "Vice Chancellor", roleType: "CHAIR" },
    { fullName: "Dr. Nadia Hussain", designation: "Director QEC", roleType: "INTERNAL" },
    { fullName: "Dr. Tariq Mehmood", designation: "Dean of Research", roleType: "INTERNAL" },
    { fullName: "Prof. Sarah Williams", designation: "HEC Nominee", roleType: "EXTERNAL" },
    { fullName: "Dr. James Chen", designation: "Subject Expert", roleType: "EXTERNAL" },
    { fullName: "Mr. Bilal Aslam", designation: "Board Secretary", roleType: "SECRETARY" },
  ];

  for (const m of members) {
    // Idempotent: skip if member with same name and roleType exists
    const existing = await client.query(
      `SELECT id FROM "ASRBMember" WHERE "fullName" = $1 AND "roleType" = $2`,
      [m.fullName, m.roleType]
    );
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO "ASRBMember" (id, "fullName", designation, "roleType", active, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
        [cuid(), m.fullName, m.designation, m.roleType]
      );
    }
  }
  console.log("Seeded 6 ASRB members");

  // --- Seed one user per new ASRB role (idempotent via ON CONFLICT on email) ---
  const asrbUsers = [
    ["asrb.chair@university.edu", "Prof. Ahmad Kamal", "ASRB_CHAIR"],
    ["asrb.secretary@university.edu", "Mr. Bilal Aslam", "ASRB_SECRETARY"],
    ["asrb.internal@university.edu", "Dr. Nadia Hussain", "ASRB_INTERNAL_MEMBER"],
    ["asrb.external@university.edu", "Prof. Sarah Williams", "ASRB_EXTERNAL_MEMBER"],
    ["asrb.compliance@university.edu", "Dr. Faisal Qureshi", "ASRB_COMPLIANCE_OFFICER"],
    ["asrb.vetting@university.edu", "Dr. Amina Rauf", "ASRB_VETTING_OFFICER"],
    ["asrb.notify@university.edu", "Mr. Rashid Iqbal", "ASRB_NOTIFICATION_RECIPIENT"],
  ];

  for (const [email, name, role] of asrbUsers) {
    await client.query(
      `INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [cuid(), email, name, role]
    );
  }
  console.log("Seeded 7 ASRB-role users");

  console.log("\nSlice 3 prerequisites seeding done!");
  await client.end();
}

main().catch((err) => {
  console.error("Error seeding:", err);
  process.exit(1);
});
