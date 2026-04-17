import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.auditEvent.deleteMany();
  await prisma.notificationForAction.deleteMany();
  await prisma.actionTakenEntry.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.memberQuery.deleteMany();
  await prisma.readReceipt.deleteMany();
  await prisma.syndicateMember.deleteMany();
  await prisma.annexure.deleteMany();
  await prisma.workingPaper.deleteMany();
  await prisma.feederBodyResolution.deleteMany();
  await prisma.agendaItem.deleteMany();
  await prisma.meetingCalendar.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // Create roles
  console.log("Creating roles...");
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: UserRole.AUTHORIZED_PROPOSER,
        description: "Can propose agenda items",
      },
    }),
    prisma.role.create({
      data: {
        name: UserRole.FEEDER_BODY_SECRETARY,
        description: "Manages feeder body resolutions",
      },
    }),
    prisma.role.create({
      data: {
        name: UserRole.REGISTRAR,
        description: "University registrar",
      },
    }),
    prisma.role.create({
      data: {
        name: UserRole.TREASURER_LEGAL,
        description: "Treasurer and legal officer",
      },
    }),
    prisma.role.create({
      data: {
        name: UserRole.VICE_CHANCELLOR,
        description: "Vice chancellor",
      },
    }),
    prisma.role.create({
      data: {
        name: UserRole.SYNDICATE_MEMBER,
        description: "Member of syndicate",
      },
    }),
    prisma.role.create({
      data: {
        name: UserRole.SYSTEM_ADMINISTRATOR,
        description: "System administrator",
      },
    }),
  ]);

  console.log(`Created ${roles.length} roles`);

  // Create seed users
  console.log("Creating users...");
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "proposer@university.edu",
        name: "Alice Proposer",
        role: UserRole.AUTHORIZED_PROPOSER,
      },
    }),
    prisma.user.create({
      data: {
        email: "secretary@university.edu",
        name: "Bob Secretary",
        role: UserRole.FEEDER_BODY_SECRETARY,
      },
    }),
    prisma.user.create({
      data: {
        email: "registrar@university.edu",
        name: "Carol Registrar",
        role: UserRole.REGISTRAR,
      },
    }),
    prisma.user.create({
      data: {
        email: "member@university.edu",
        name: "David Member",
        role: UserRole.SYNDICATE_MEMBER,
      },
    }),
    prisma.user.create({
      data: {
        email: "treasurer@university.edu",
        name: "Eva Treasurer",
        role: UserRole.TREASURER_LEGAL,
      },
    }),
    prisma.user.create({
      data: {
        email: "sysadmin@university.edu",
        name: "Frank Admin",
        role: UserRole.SYSTEM_ADMINISTRATOR,
      },
    }),
    prisma.user.create({
      data: {
        email: "vc@university.edu",
        name: "Grace Vice Chancellor",
        role: UserRole.VICE_CHANCELLOR,
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // Create meeting calendar
  console.log("Creating meeting calendar...");
  const meeting = await prisma.meetingCalendar.create({
    data: {
      meetingNumber: 1,
      meetingDate: new Date("2024-06-15T10:00:00"),
      meetingLocation: "Senate House, Conference Room A",
    },
  });

  console.log(`Created meeting calendar with ID: ${meeting.id}`);

  // Create feeder body resolutions
  console.log("Creating feeder body resolutions...");
  const resolutions = await Promise.all([
    prisma.feederBodyResolution.create({
      data: {
        meetingCalendarId: meeting.id,
        agendaItemId: "", // Will be updated after agenda items
        bodyCode: "SN",
        resolutionNumber: 1,
        resolutionText: "Resolution on academic standards and curriculum review",
      },
    }),
    prisma.feederBodyResolution.create({
      data: {
        meetingCalendarId: meeting.id,
        agendaItemId: "", // Will be updated after agenda items
        bodyCode: "SN",
        resolutionNumber: 2,
        resolutionText: "Resolution on student welfare and campus facilities",
      },
    }),
  ]);

  console.log(`Created ${resolutions.length} feeder body resolutions`);

  // Create syndicate members
  console.log("Creating syndicate members...");
  const members = await Promise.all([
    prisma.syndicateMember.create({
      data: {
        email: "member1@university.edu",
        name: "Dr. John Smith",
        memberNumber: "SM001",
        department: "Computer Science",
        joinDate: new Date("2020-01-01"),
      },
    }),
    prisma.syndicateMember.create({
      data: {
        email: "member2@university.edu",
        name: "Prof. Jane Doe",
        memberNumber: "SM002",
        department: "Mathematics",
        joinDate: new Date("2019-06-15"),
      },
    }),
  ]);

  console.log(`Created ${members.length} syndicate members`);

  console.log("Database seeded successfully!");
}

main()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
