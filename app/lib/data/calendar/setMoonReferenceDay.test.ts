import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { upsert } = vi.hoisted(() => ({ upsert: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { calendarSettings: { upsert } },
}));

import setMoonReferenceDay from "./setMoonReferenceDay";

describe("setMoonReferenceDay (SPEC-014 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      setMoonReferenceDay({ moonNewMoonDay: 10 })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("sets the reference day on the singleton", async () => {
    upsert.mockResolvedValue({});

    expect(await setMoonReferenceDay({ moonNewMoonDay: 2_106_055 })).toEqual({
      ok: true,
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { id: 1 },
      create: { id: 1, moonNewMoonDay: 2_106_055 },
      update: { moonNewMoonDay: 2_106_055 },
    });
  });

  it("clears it with null, so no phase is shown", async () => {
    upsert.mockResolvedValue({});

    expect(await setMoonReferenceDay({ moonNewMoonDay: null })).toEqual({
      ok: true,
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { moonNewMoonDay: null } })
    );
  });

  it("refuses a day before the dawn of time with the date input's own key", async () => {
    expect(await setMoonReferenceDay({ moonNewMoonDay: -1 })).toEqual({
      ok: false,
      errors: { moonNewMoonDay: [{ key: "beforeDawnOfTime" }] },
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("refuses a missing value rather than clearing by accident", async () => {
    const result = await setMoonReferenceDay({} as never);

    expect(result.ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });
});
