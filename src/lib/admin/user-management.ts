/** Roles shown in the admin user-management UI (client-safe). */
export const USER_PANEL_ROLES = ["super_admin", "admin", "editor", "viewer"] as const;

export type UserPanelRole = (typeof USER_PANEL_ROLES)[number];

export const USER_PANEL_ROLE_LABELS: Record<UserPanelRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: UserPanelRole;
  joinedAt: string;
  lastLoginAt: string | null;
  isActive: boolean;
}

export function isUserPanelRole(value: unknown): value is UserPanelRole {
  return typeof value === "string" && (USER_PANEL_ROLES as readonly string[]).includes(value);
}

/** Map panel role → profiles.roles.name */
export function panelRoleToDbRole(role: UserPanelRole): "admin" | "manager" | "support" {
  switch (role) {
    case "super_admin":
    case "admin":
      return "admin";
    case "editor":
      return "manager";
    case "viewer":
      return "support";
  }
}
