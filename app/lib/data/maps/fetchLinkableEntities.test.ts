import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

// Direct references, not `vi.mocked(prisma.x.y)` — see createPoi.test.ts.
const { npcFindMany, deitiesFindMany } = vi.hoisted(() => ({
  npcFindMany: vi.fn(),
  deitiesFindMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    npc: { findMany: npcFindMany },
    deities: { findMany: deitiesFindMany },
  },
}));

import fetchLinkableEntities from "./fetchLinkableEntities";

describe("fetchLinkableEntities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("throws UnauthorizedError and never reads without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(fetchLinkableEntities("npc")).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(npcFindMany).not.toHaveBeenCalled();
  });

  it("queries npc for type npc", async () => {
    npcFindMany.mockResolvedValue([{ id: 1, name: "Ariosto" }]);

    const result = await fetchLinkableEntities("npc");

    expect(result).toEqual([{ id: 1, name: "Ariosto" }]);
    expect(deitiesFindMany).not.toHaveBeenCalled();
  });

  it("queries deities for type deity", async () => {
    deitiesFindMany.mockResolvedValue([{ id: 3, name: "Aerivel" }]);

    const result = await fetchLinkableEntities("deity");

    expect(result).toEqual([{ id: 3, name: "Aerivel" }]);
    expect(npcFindMany).not.toHaveBeenCalled();
  });
});
