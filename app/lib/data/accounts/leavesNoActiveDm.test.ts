import { describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/prisma/client";
import leavesNoActiveDm from "./leavesNoActiveDm";

function tx(
  account: { role: string; active: boolean } | null,
  otherActiveDms: number
) {
  const count = vi.fn().mockResolvedValue(otherActiveDms);
  const client = {
    users: { findUnique: vi.fn().mockResolvedValue(account), count },
  };
  return { client: client as unknown as Prisma.TransactionClient, count };
}

describe("leavesNoActiveDm (SPEC-022 §5)", () => {
  it("is true for the only active DM", async () => {
    const { client } = tx({ role: "dm", active: true }, 0);

    await expect(leavesNoActiveDm(client, "a")).resolves.toBe(true);
  });

  it("is false while another active DM remains", async () => {
    const { client, count } = tx({ role: "dm", active: true }, 1);

    await expect(leavesNoActiveDm(client, "a")).resolves.toBe(false);
    expect(count).toHaveBeenCalledWith({
      where: { role: "dm", active: true, id: { not: "a" } },
    });
  });

  it.each([
    ["a player", { role: "player", active: true }],
    ["a disabled DM", { role: "dm", active: false }],
    ["a missing account", null],
  ])("is false for %s, which takes no active DM away", async (_, account) => {
    const { client, count } = tx(account, 0);

    await expect(leavesNoActiveDm(client, "a")).resolves.toBe(false);
    expect(count).not.toHaveBeenCalled();
  });
});
