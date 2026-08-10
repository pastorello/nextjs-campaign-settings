import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import { Prisma } from "@/generated/prisma/client";
import NpcItem from "@/app/lib/definitions/interfaces/npc/NpcItem";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { npc: { create } },
}));

import createNpc from "./createNpc";

const validFormData: NpcItem = {
  id: 0,
  name: "Elminster",
  description: "",
  title: "",
  alignment: 1,
  alignmentDomain: 1,
  position: "",
  faction: 23,
  appearance: "",
  personality: "",
  motivations: "",
  secrets: "",
};

describe("createNpc (SPEC-006 T8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createNpc(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the NPC on valid input", async () => {
    create.mockResolvedValue({});

    const result = await createNpc(validFormData);

    expect(result.ok).toBe(true);
    expect(create).toHaveBeenCalled();
  });

  it("returns a faction field error, not a 500, for a stale faction id", async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint failed",
        { code: "P2003", clientVersion: "test" }
      )
    );

    const result = await createNpc(validFormData);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.faction).toBeDefined();
  });

  it("wraps any other database failure in a DatabaseError", async () => {
    create.mockRejectedValue(new Error("connection lost"));

    await expect(createNpc(validFormData)).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
