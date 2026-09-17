import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import validSpellFixture from "./validSpellFixture";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { spells: { create } },
}));

import createSpell from "./createSpell";

// The fixture minus its placeholder `id`, which a create never writes.
const expectedData: Partial<typeof validSpellFixture> = {
  ...validSpellFixture,
};
delete expectedData.id;

describe("createSpell (TD-122)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createSpell(validSpellFixture)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the spell on valid input, without the placeholder id", async () => {
    create.mockResolvedValue({});

    const result = await createSpell(validSpellFixture);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({ data: expectedData });
  });

  it("rejects an out-of-range level without writing", async () => {
    const result = await createSpell({ ...validSpellFixture, level: 99999 });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects an empty casting time without writing", async () => {
    const result = await createSpell({ ...validSpellFixture, castingTime: "" });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("does not write a key the metadata does not declare", async () => {
    create.mockResolvedValue({});

    await createSpell({
      ...validSpellFixture,
      zoneId: 7,
    } as typeof validSpellFixture);

    expect(create).toHaveBeenCalledWith({ data: expectedData });
  });
});
