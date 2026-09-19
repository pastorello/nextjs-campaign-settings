import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DhClass from "@/app/lib/definitions/interfaces/daggerheart/DhClass";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { findUnique, update } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhClass: { findUnique, update } },
}));

import updateDhClass from "./updateDhClass";

// An update carries only what changed plus the id (EntityForm).
const edit = (fields: Partial<DhClass>) => ({ id: 3, ...fields }) as DhClass;

describe("updateDhClass (SPEC-021 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    findUnique.mockResolvedValue({ domainAId: 1, domainBId: 2 });
    update.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateDhClass(edit({ name: "X" }))).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("writes only the edited fields", async () => {
    const result = await updateDhClass(edit({ startingHp: 7 }));

    expect(result).toEqual({ ok: true });
    expect(findUnique).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { startingHp: 7 },
    });
  });

  it("refuses a domain changed to the other one as stored", async () => {
    const result = await updateDhClass(edit({ domainBId: 1 }));

    expect(result).toEqual({
      ok: false,
      errors: { domainBId: [{ key: "domainsMustDiffer" }] },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("accepts swapping both domains at once", async () => {
    const result = await updateDhClass(edit({ domainAId: 2, domainBId: 1 }));

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalled();
  });

  it("refuses invalid input with field errors", async () => {
    const result = await updateDhClass(edit({ startingEvasion: -3 }));

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
