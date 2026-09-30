/**
 * What an account may do (SPEC-022). A `dm` edits the setting; a `player`
 * reads what the DM has revealed to their campaign. Stored as a string with a
 * CHECK in `users.role`, like `campaign.system`: a closed vocabulary in code,
 * not a Prisma enum.
 */
export const USER_ROLES = ["dm", "player"] as const;

type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return (USER_ROLES as readonly unknown[]).includes(value);
}

export default UserRole;
