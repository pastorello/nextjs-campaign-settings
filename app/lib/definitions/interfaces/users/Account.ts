import type UserRole from "../../UserRole";

/** An account as the DM's accounts page shows it (SPEC-022 T3). */
interface Account {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export default Account;
