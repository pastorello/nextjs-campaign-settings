import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import { universalCountFixture } from "@/app/lib/calendar/dateSystemFixtures";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { updateMany } = vi.hoisted(() => ({ updateMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dateSystem: { updateMany } },
}));

import updateUniversalDateSystem from "./updateUniversalDateSystem";

const payload = {
  name: "dall'alba dei tempi",
  afterLabel: universalCountFixture.afterLabel,
  afterAbbrev: universalCountFixture.afterAbbrev,
  monthNames: universalCountFixture.monthNames,
  weekdayNames: universalCountFixture.weekdayNames,
};

describe("updateUniversalDateSystem (SPEC-014 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateUniversalDateSystem(payload)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("renames the universal row, addressed by its flag", async () => {
    updateMany.mockResolvedValue({ count: 1 });

    const result = await updateUniversalDateSystem(payload);

    expect(result).toEqual({ ok: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: { isUniversal: true },
      data: payload,
    });
  });

  // SPEC-014 §5.2: the DM names the universal count "but cannot re-anchor it".
  it("never writes an anchor year or a before label smuggled into the payload", async () => {
    updateMany.mockResolvedValue({ count: 1 });

    await updateUniversalDateSystem({
      ...payload,
      anchorYear: 100,
      beforeLabel: "prima",
    } as never);

    expect(updateMany).toHaveBeenCalledWith({
      where: { isUniversal: true },
      data: payload,
    });
  });

  it("refuses six weekday names with a field error", async () => {
    const result = await updateUniversalDateSystem({
      ...payload,
      weekdayNames: payload.weekdayNames.slice(0, 6),
    });

    expect(result).toEqual({
      ok: false,
      errors: { weekdayNames: [{ key: "weekdayNamesCount" }] },
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("refuses a blank name", async () => {
    const result = await updateUniversalDateSystem({ ...payload, name: "" });

    expect(result).toEqual({
      ok: false,
      errors: { name: [{ key: "tooShort", values: { minimum: 1 } }] },
    });
  });
});
