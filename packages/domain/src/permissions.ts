/**
 * Centralized permission catalog for the University DSS.
 *
 * Each permission is a string code that can be assigned to roles.
 * Route handlers and UI components check these codes to gate access.
 */

export const Permissions = {
  // Board Governance permissions
  BOARD_PROPOSE_ITEM: "BOARD_PROPOSE_ITEM",
  BOARD_MANAGE_MEETINGS: "BOARD_MANAGE_MEETINGS",
  BOARD_TRIAGE_ITEMS: "BOARD_TRIAGE_ITEMS",
  BOARD_AUTHOR_PAPERS: "BOARD_AUTHOR_PAPERS",
  BOARD_CIRCULATE_PAPERS: "BOARD_CIRCULATE_PAPERS",
  BOARD_VIEW_PORTAL: "BOARD_VIEW_PORTAL",
  BOARD_VC_COCKPIT: "BOARD_VC_COCKPIT",

  // ASRB permissions
  ASRB_SUBMIT_CASE: "ASRB_SUBMIT_CASE",
  ASRB_MANAGE_RULES: "ASRB_MANAGE_RULES",
  ASRB_VIEW_CASES: "ASRB_VIEW_CASES",
  ASRB_VET_CASES: "ASRB_VET_CASES",
  ASRB_CHAIR_MEETING: "ASRB_CHAIR_MEETING",
  ASRB_VET_CASE: "ASRB_VET_CASE",
  ASRB_APPROVE_AGENDA: "ASRB_APPROVE_AGENDA",
  ASRB_RECORD_DECISION: "ASRB_RECORD_DECISION",
  ASRB_VIEW_MEMBER_PORTAL: "ASRB_VIEW_MEMBER_PORTAL",
  ASRB_ACK_NOTIFICATION: "ASRB_ACK_NOTIFICATION",

  // System permissions
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
} as const;

export type PermissionCode = typeof Permissions[keyof typeof Permissions];

/**
 * Default permission assignments per role.
 * The System Administrator role includes ASRB_MANAGE_RULES.
 */
export const RolePermissions: Record<string, PermissionCode[]> = {
  AUTHORIZED_PROPOSER: [
    Permissions.BOARD_PROPOSE_ITEM,
  ],
  FEEDER_BODY_SECRETARY: [
    Permissions.BOARD_PROPOSE_ITEM,
    Permissions.ASRB_SUBMIT_CASE,
  ],
  REGISTRAR: [
    Permissions.BOARD_MANAGE_MEETINGS,
    Permissions.BOARD_TRIAGE_ITEMS,
    Permissions.BOARD_AUTHOR_PAPERS,
    Permissions.BOARD_CIRCULATE_PAPERS,
    Permissions.ASRB_VIEW_CASES,
    Permissions.ASRB_VET_CASES,
  ],
  TREASURER_LEGAL: [
    Permissions.BOARD_VIEW_PORTAL,
    Permissions.ASRB_VIEW_CASES,
  ],
  VICE_CHANCELLOR: [
    Permissions.BOARD_VC_COCKPIT,
    Permissions.BOARD_VIEW_PORTAL,
    Permissions.ASRB_VIEW_CASES,
    Permissions.ASRB_CHAIR_MEETING,
  ],
  SYNDICATE_MEMBER: [
    Permissions.BOARD_VIEW_PORTAL,
  ],
  SYSTEM_ADMINISTRATOR: [
    Permissions.SYSTEM_ADMIN,
    Permissions.ASRB_MANAGE_RULES,
    Permissions.ASRB_VIEW_CASES,
  ],
  // ASRB roles (Section 6)
  ASRB_CHAIR: [
    Permissions.ASRB_CHAIR_MEETING,
    Permissions.ASRB_VIEW_CASES,
    Permissions.ASRB_APPROVE_AGENDA,
    Permissions.ASRB_RECORD_DECISION,
    Permissions.ASRB_VIEW_MEMBER_PORTAL,
  ],
  ASRB_SECRETARY: [
    Permissions.ASRB_VIEW_CASES,
    Permissions.ASRB_VET_CASE,
    Permissions.ASRB_APPROVE_AGENDA,
    Permissions.ASRB_RECORD_DECISION,
    Permissions.ASRB_VIEW_MEMBER_PORTAL,
    Permissions.ASRB_ACK_NOTIFICATION,
  ],
  ASRB_INTERNAL_MEMBER: [
    Permissions.ASRB_VIEW_CASES,
    Permissions.ASRB_VIEW_MEMBER_PORTAL,
    Permissions.ASRB_ACK_NOTIFICATION,
  ],
  ASRB_EXTERNAL_MEMBER: [
    Permissions.ASRB_VIEW_CASES,
    Permissions.ASRB_VIEW_MEMBER_PORTAL,
    Permissions.ASRB_ACK_NOTIFICATION,
  ],
  ASRB_COMPLIANCE_OFFICER: [
    Permissions.ASRB_VIEW_CASES,
    Permissions.ASRB_MANAGE_RULES,
    Permissions.ASRB_VET_CASE,
  ],
  ASRB_VETTING_OFFICER: [
    Permissions.ASRB_VIEW_CASES,
    Permissions.ASRB_VET_CASE,
    Permissions.ASRB_VET_CASES,
  ],
  ASRB_NOTIFICATION_RECIPIENT: [
    Permissions.ASRB_VIEW_CASES,
    Permissions.ASRB_ACK_NOTIFICATION,
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: string, permission: PermissionCode): boolean {
  const perms = RolePermissions[role];
  if (!perms) return false;
  return perms.includes(permission);
}
