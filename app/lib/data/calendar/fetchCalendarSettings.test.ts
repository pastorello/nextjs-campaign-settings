import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const findUnique = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { calendarSettings: { findUnique } },
}));

describe("fetchCalendarSettings (SPEC-014 T4)", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("reads the singleton row", async () => {
    findUnique.mockResolvedValue({ moonNewMoonDay: 42 });

    const { default: fetchCalendarSettings } =
      await import("./fetchCalendarSettings");

    expect(await fetchCalendarSettings()).toEqual({ moonNewMoonDay: 42 });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
  });

  it("reads a missing row as nothing set", async () => {
    findUnique.mockResolvedValue(null);

    const { default: fetchCalendarSettings } =
      await import("./fetchCalendarSettings");

    expect(await fetchCalendarSettings()).toEqual({ moonNewMoonDay: null });
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findUnique.mockRejectedValue(new Error("relation does not exist"));

    const { default: fetchCalendarSettings } =
      await import("./fetchCalendarSettings");

    await expect(fetchCalendarSettings()).rejects.toThrow(DatabaseError);
  });
});
