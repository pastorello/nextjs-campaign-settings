import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import validSpellFixture from "./validSpellFixture";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { spells: { update } },
}));

import updateSpell from "./updateSpell";

const validFormData = { ...validSpellFixture, id: 42 };

describe("updateSpell (TD-122)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateSpell(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the spell on valid input", async () => {
    update.mockResolvedValue({});

    const result = await updateSpell(validFormData);

    const { id, ...rest } = validFormData;
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ where: { id }, data: rest });
  });

  it("rejects a non-positive id without writing", async () => {
    const result = await updateSpell({ ...validFormData, id: 0 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects an out-of-range subclass without writing", async () => {
    const result = await updateSpell({ ...validFormData, circle: [99999] });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("writes only the declared fields the payload carries", async () => {
    update.mockResolvedValue({});

    await updateSpell({
      id: 42,
      name: "Renamed",
      zoneId: 7,
    } as unknown as typeof validFormData);

    expect(update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { name: "Renamed" },
    });
  });
});
