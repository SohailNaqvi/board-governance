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
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: string, permission: PermissionCode): boolean {
  const perms = RolePermissions[role];
  if (!perms) return false;
  return perms.includes(permission);
}
