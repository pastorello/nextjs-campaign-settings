import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import NotFoundError from "@/app/lib/errors/NotFoundError";
import WorldHistoryEventInput from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEventInput";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update, findUnique, zoneFindMany } = vi.hoisted(() => ({
  update: vi.fn(),
  findUnique: vi.fn(),
  zoneFindMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    calendarEvent: { update, findUnique },
    zone: { findMany: zoneFindMany },
  },
}));

import updateWorldHistoryEvent from "./updateWorldHistoryEvent";

const valid: WorldHistoryEventInput = {
  title: "Festa della Luna",
  description: null,
  startDay: 400,
  startHour: null,
  endDay: null,
  endHour: null,
  repeatsYearly: true,
  zoneIds: [2],
  npcIds: [],
  deityIds: [],
  factionIds: [],
};

describe("updateWorldHistoryEvent (SPEC-014 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    findUnique.mockResolvedValue({ campaignId: null });
    zoneFindMany.mockResolvedValue([{ id: 2 }]);
    update.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateWorldHistoryEvent(5, valid)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("replaces every field and sets the links, so removed ones are dropped", async () => {
    const result = await updateWorldHistoryEvent(5, valid);

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: {
        title: "Festa della Luna",
        description: null,
        startDay: 400,
        startHour: null,
        endDay: null,
        endHour: null,
        repeatsYearly: true,
        campaignId: null,
        zones: { set: [{ id: 2 }] },
        npcs: { set: [] },
        deities: { set: [] },
        factions: { set: [] },
      },
    });
  });

  it("refuses a campaign event as not found", async () => {
    findUnique.mockResolvedValue({ campaignId: 3 });

    await expect(updateWorldHistoryEvent(5, valid)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses an event that does not exist", async () => {
    findUnique.mockResolvedValue(null);

    await expect(updateWorldHistoryEvent(5, valid)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("refuses a malformed id without reading the database", async () => {
    await expect(updateWorldHistoryEvent(-1, valid)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input before looking the event up", async () => {
    const result = await updateWorldHistoryEvent(5, {
      ...valid,
      endDay: 100,
    });

    expect(result).toEqual({
      ok: false,
      errors: { endDay: [{ key: "endBeforeStart" }] },
    });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("refuses a missing place link", async () => {
    zoneFindMany.mockResolvedValue([]);

    const result = await updateWorldHistoryEvent(5, valid);

    expect(result).toEqual({
      ok: false,
      errors: { zoneIds: [{ key: "zoneNotFound" }] },
    });
    expect(update).not.toHaveBeenCalled();
  });
});
