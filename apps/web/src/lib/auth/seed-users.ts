export enum UserRole {
  AUTHORIZED_PROPOSER = "AUTHORIZED_PROPOSER",
  FEEDER_BODY_SECRETARY = "FEEDER_BODY_SECRETARY",
  REGISTRAR = "REGISTRAR",
  TREASURER_LEGAL = "TREASURER_LEGAL",
  VICE_CHANCELLOR = "VICE_CHANCELLOR",
  SYNDICATE_MEMBER = "SYNDICATE_MEMBER",
  SYSTEM_ADMINISTRATOR = "SYSTEM_ADMINISTRATOR",
}

export interface SeedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const seedUsers: SeedUser[] = [
  {
    id: "user-001",
    email: "proposer@university.edu",
    name: "Alice Proposer",
    role: UserRole.AUTHORIZED_PROPOSER,
  },
  {
    id: "user-002",
    email: "secretary@university.edu",
    name: "Bob Secretary",
    role: UserRole.FEEDER_BODY_SECRETARY,
  },
  {
    id: "user-003",
    email: "registrar@university.edu",
    name: "Carol Registrar",
    role: UserRole.REGISTRAR,
  },
  {
    id: "user-004",
    email: "member@university.edu",
    name: "David Member",
    role: UserRole.SYNDICATE_MEMBER,
  },
  {
    id: "user-005",
    email: "treasurer@university.edu",
    name: "Eva Treasurer",
    role: UserRole.TREASURER_LEGAL,
  },
  {
    id: "user-006",
    email: "sysadmin@university.edu",
    name: "Frank Admin",
    role: UserRole.SYSTEM_ADMINISTRATOR,
  },
  {
    id: "user-007",
    email: "vc@university.edu",
    name: "Grace Vice Chancellor",
    role: UserRole.VICE_CHANCELLOR,
  },
];

export function findSeedUserByEmail(email: string): SeedUser | undefined {
  return seedUsers.find((user) => user.email === email);
}

export function getAllSeedUsers(): SeedUser[] {
  return [...seedUsers];
}
