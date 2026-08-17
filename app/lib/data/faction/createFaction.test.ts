import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import Faction from "@/app/lib/definitions/interfaces/faction/Faction";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { faction: { create } },
}));

import createFaction from "./createFaction";

const validFormData: Faction = {
  id: 0,
  name: "The Silver Hand",
  description: "A knightly order sworn to root out corruption.",
};

describe("createFaction (TD-80)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createFaction(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the faction on valid input", async () => {
    create.mockResolvedValue({});

    const result = await createFaction(validFormData);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        name: validFormData.name,
        description: validFormData.description,
      },
    });
  });

  it("rejects a payload missing its name, without writing", async () => {
    const result = await createFaction({
      id: validFormData.id,
      description: validFormData.description,
    } as Faction);

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });
});
