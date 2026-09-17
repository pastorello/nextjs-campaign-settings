import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import validDeityFixture from "./validDeityFixture";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { deities: { update } },
}));

import updateDeity from "./updateDeity";

const validFormData = { ...validDeityFixture, id: 42 };

describe("updateDeity (TD-80)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateDeity(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the deity on valid input", async () => {
    update.mockResolvedValue({});

    const result = await updateDeity(validFormData);

    const { id, ...rest } = validFormData;
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id },
      data: rest,
    });
  });

  it("rejects a non-positive id without writing", async () => {
    const result = await updateDeity({ ...validFormData, id: -1 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a payload with an out-of-range option value, without writing", async () => {
    const result = await updateDeity({ ...validFormData, deityType: 99999 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  // TD-122: an undeclared key must be stripped, not written — `zoneId` here
  // would set a location while bypassing `assignLocation`'s rules (TD-93).
  it("does not write a key the metadata does not declare", async () => {
    update.mockResolvedValue({});

    await updateDeity({
      ...validFormData,
      zoneId: 7,
      poiId: 3,
    } as typeof validFormData);

    const { id, ...rest } = validFormData;
    expect(update).toHaveBeenCalledWith({ where: { id }, data: rest });
  });

  it("uses the coerced id in the where clause", async () => {
    update.mockResolvedValue({});

    await updateDeity({ ...validFormData, id: "42" as unknown as number });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } })
    );
  });

  it("writes only the fields the payload carries", async () => {
    update.mockResolvedValue({});

    await updateDeity({ id: 42, name: "Renamed" } as typeof validFormData);

    expect(update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { name: "Renamed" },
    });
  });
});
