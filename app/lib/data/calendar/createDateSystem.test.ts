import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import { humanCountInputFixture } from "@/app/lib/calendar/dateSystemFixtures";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dateSystem: { create } },
}));

import createDateSystem from "./createDateSystem";

describe("createDateSystem (SPEC-014 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(
      createDateSystem(humanCountInputFixture)
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a system that is neither universal nor the default", async () => {
    create.mockResolvedValue({});

    const result = await createDateSystem(humanCountInputFixture);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: { ...humanCountInputFixture, isUniversal: false, isDefault: false },
    });
    expect(revalidatePath).toHaveBeenCalledWith(
      "/[locale]/dashboard/[system]/world/calendar",
      "page"
    );
  });

  it("never writes a smuggled isDefault or isUniversal", async () => {
    create.mockResolvedValue({});

    await createDateSystem({
      ...humanCountInputFixture,
      isDefault: true,
      isUniversal: true,
    } as never);

    expect(create).toHaveBeenCalledWith({
      data: { ...humanCountInputFixture, isUniversal: false, isDefault: false },
    });
  });

  it("refuses eleven month names with a field error", async () => {
    const result = await createDateSystem({
      ...humanCountInputFixture,
      monthNames: humanCountInputFixture.monthNames.slice(0, 11),
    });

    expect(result).toEqual({
      ok: false,
      errors: { monthNames: [{ key: "monthNamesCount" }] },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses eight weekday names with a field error", async () => {
    const result = await createDateSystem({
      ...humanCountInputFixture,
      weekdayNames: [...humanCountInputFixture.weekdayNames, "Ottavo"],
    });

    expect(result).toEqual({
      ok: false,
      errors: { weekdayNames: [{ key: "weekdayNamesCount" }] },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a blank name and a missing anchor event, field by field", async () => {
    const result = await createDateSystem({
      ...humanCountInputFixture,
      name: " ",
      anchorEvent: "",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["anchorEvent", "name"]);
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses an anchor year before the dawn of time", async () => {
    const result = await createDateSystem({
      ...humanCountInputFixture,
      anchorYear: -1,
    });

    expect(result).toEqual({
      ok: false,
      errors: { anchorYear: [{ key: "tooSmall", values: { minimum: 0 } }] },
    });
  });
});
