import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import WorldHistoryEventInput from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEventInput";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const { create, zoneFindMany, npcFindMany, deitiesFindMany, factionFindMany } =
  vi.hoisted(() => ({
    create:
      vi.fn<(args: { data: Record<string, unknown> }) => Promise<unknown>>(),
    zoneFindMany: vi.fn(),
    npcFindMany: vi.fn(),
    deitiesFindMany: vi.fn(),
    factionFindMany: vi.fn(),
  }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    calendarEvent: { create },
    zone: { findMany: zoneFindMany },
    npc: { findMany: npcFindMany },
    deities: { findMany: deitiesFindMany },
    faction: { findMany: factionFindMany },
  },
}));

import createWorldHistoryEvent from "./createWorldHistoryEvent";

const valid: WorldHistoryEventInput = {
  title: "Il Cataclisma",
  description: "Il cielo cadde.",
  startDay: 5770 * 365,
  startHour: 14,
  endDay: 5770 * 365 + 2,
  endHour: null,
  repeatsYearly: false,
  zoneIds: [3, 3],
  npcIds: [7],
  deityIds: [],
  factionIds: [],
};

/** Every lookup finds exactly the ids it is asked for. */
const echo = ({ where }: { where: { id: { in: number[] } } }) =>
  Promise.resolve(where.id.in.map((id) => ({ id })));

describe("createWorldHistoryEvent (SPEC-014 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    [zoneFindMany, npcFindMany, deitiesFindMany, factionFindMany].forEach(
      (findMany) => findMany.mockImplementation(echo)
    );
    create.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without reading or writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createWorldHistoryEvent(valid)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(zoneFindMany).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a campaign-less event, connecting each link once", async () => {
    const result = await createWorldHistoryEvent(valid);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        title: "Il Cataclisma",
        description: "Il cielo cadde.",
        startDay: 5770 * 365,
        startHour: 14,
        endDay: 5770 * 365 + 2,
        endHour: null,
        repeatsYearly: false,
        campaignId: null,
        zones: { connect: [{ id: 3 }] },
        npcs: { connect: [{ id: 7 }] },
        deities: { connect: [] },
        factions: { connect: [] },
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith(
      "/[locale]/dashboard/[system]/world/history",
      "page"
    );
  });

  it("writes a blank description as null", async () => {
    await createWorldHistoryEvent({ ...valid, description: null });

    expect(create.mock.calls[0]?.[0].data.description).toBeNull();
  });

  it("refuses an end before the start with a field error, without writing", async () => {
    const result = await createWorldHistoryEvent({
      ...valid,
      endDay: valid.startDay! - 1,
    });

    expect(result).toEqual({
      ok: false,
      errors: { endDay: [{ key: "endBeforeStart" }] },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a yearly event spanning more than a year", async () => {
    const result = await createWorldHistoryEvent({
      ...valid,
      repeatsYearly: true,
      endDay: valid.startDay! + 400,
    });

    expect(result).toEqual({
      ok: false,
      errors: { endDay: [{ key: "repeatSpansOverAYear" }] },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a date before the dawn of time", async () => {
    const result = await createWorldHistoryEvent({
      ...valid,
      startDay: -5,
      endDay: null,
    });

    expect(result).toEqual({
      ok: false,
      errors: { startDay: [{ key: "beforeDawnOfTime" }] },
    });
  });

  it("refuses link ids that name no row, on the list that holds them", async () => {
    npcFindMany.mockResolvedValue([]);
    factionFindMany.mockResolvedValue([{ id: 1 }]);

    const result = await createWorldHistoryEvent({
      ...valid,
      factionIds: [1, 2],
    });

    expect(result).toEqual({
      ok: false,
      errors: {
        npcIds: [{ key: "npcNotFound" }],
        factionIds: [{ key: "factionNotFound" }],
      },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("does not query a link table it has no ids for", async () => {
    await createWorldHistoryEvent(valid);

    expect(deitiesFindMany).not.toHaveBeenCalled();
    expect(zoneFindMany).toHaveBeenCalledWith({
      where: { id: { in: [3] } },
      select: { id: true },
    });
  });
});
