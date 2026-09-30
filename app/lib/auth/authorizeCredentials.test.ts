import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, compare } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  compare: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { users: { findUnique } },
}));
vi.mock("bcrypt", () => ({ default: { compare } }));
vi.mock("@/app/lib/notifications/logServerIssue", () => ({
  default: vi.fn(),
}));

import authorizeCredentials from "./authorizeCredentials";

const row = {
  id: "u1",
  name: "Mira",
  email: "mira@example.test",
  password: "hash",
  role: "player",
  active: true,
};
const credentials = { email: "mira@example.test", password: "secret1" };

describe("authorizeCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue(row);
    compare.mockResolvedValue(true);
  });

  it("returns the row for a matching password on an active account", async () => {
    await expect(authorizeCredentials(credentials)).resolves.toBe(row);
  });

  it("refuses a wrong password", async () => {
    compare.mockResolvedValue(false);

    await expect(authorizeCredentials(credentials)).resolves.toBeNull();
  });

  // SPEC-022 T1: a disabled account, or a DM sign-up awaiting activation.
  it("refuses an inactive account even with the right password", async () => {
    findUnique.mockResolvedValue({ ...row, active: false });

    await expect(authorizeCredentials(credentials)).resolves.toBeNull();
  });

  it("refuses an unknown email", async () => {
    findUnique.mockResolvedValue(null);

    await expect(authorizeCredentials(credentials)).resolves.toBeNull();
    expect(compare).not.toHaveBeenCalled();
  });

  it("refuses malformed credentials without querying", async () => {
    await expect(
      authorizeCredentials({ email: "not-an-email", password: "x" })
    ).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});
