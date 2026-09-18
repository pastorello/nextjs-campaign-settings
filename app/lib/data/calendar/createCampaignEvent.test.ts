import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import NotFoundError from "@/app/lib/errors/NotFoundError";
import CampaignEventInput from "@/app/lib/definitions/interfaces/calendar/CampaignEventInput";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

const { create, campaignFindUnique, adventureFindUnique, sceneFindUnique } =
  vi.hoisted(() => ({
    create:
      vi.fn<(args: { data: Record<string, unknown> }) => Promise<unknown>>(),
    campaignFindUnique: vi.fn(),
    adventureFindUnique: vi.fn(),
    sceneFindUnique: vi.fn(),
  }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    calendarEvent: { create },
    campaign: { findUnique: campaignFindUnique },
    adventure: { findUnique: adventureFindUnique },
    scene: { findUnique: sceneFindUnique },
  },
}));

import createCampaignEvent from "./createCampaignEvent";

const CAMPAIGN = 1;

const valid: CampaignEventInput = {
  title: "The cult raises the tower",
  description: null,
  startDay: 5770 * 365 + 10,
  startHour: 22,
  endDay: null,
  endHour: null,
  repeatsYearly: false,
  adventureId: null,
  sceneId: null,
};

/** Adventure 10 and its scene 100 are campaign 1's; 20 and 200 campaign 2's. */
function seedOwners() {
  adventureFindUnique.mockImplementation(
    ({ where }: { where: { id: number } }) =>
      Promise.resolve(
        { 10: { campaignId: 1 }, 20: { campaignId: 2 } }[where.id] ?? null
      )
  );
  sceneFindUnique.mockImplementation(({ where }: { where: { id: number } }) =>
    Promise.resolve(
      {
        100: { adventureId: 10, adventure: { campaignId: 1 } },
        101: { adventureId: 11, adventure: { campaignId: 1 } },
        200: { adventureId: 20, adventure: { campaignId: 2 } },
      }[where.id] ?? null
    )
  );
}

describe("createCampaignEvent (SPEC-014 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    campaignFindUnique.mockResolvedValue({ id: CAMPAIGN });
    seedOwners();
    create.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without reading or writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createCampaignEvent(CAMPAIGN, valid)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(campaignFindUnique).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the event on the campaign", async () => {
    const result = await createCampaignEvent(CAMPAIGN, valid);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        title: "The cult raises the tower",
        description: null,
        startDay: 5770 * 365 + 10,
        startHour: 22,
        endDay: null,
        endHour: null,
        repeatsYearly: false,
        campaignId: CAMPAIGN,
        adventureId: null,
        sceneId: null,
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith(
      "/[locale]/dashboard/[system]/campaign/calendar",
      "page"
    );
  });

  it("refuses invalid fields with field errors, without writing", async () => {
    const result = await createCampaignEvent(CAMPAIGN, {
      ...valid,
      title: " ",
      endDay: valid.startDay! - 1,
    });

    expect(result).toEqual({
      ok: false,
      errors: {
        title: [{ key: "tooShort", values: { minimum: 1 } }],
        endDay: [{ key: "endBeforeStart" }],
      },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses world history links: a campaign event has none", async () => {
    const result = await createCampaignEvent(CAMPAIGN, {
      ...valid,
      zoneIds: [3],
      npcIds: [],
    } as CampaignEventInput);

    expect(result).toEqual({
      ok: false,
      errors: { zoneIds: [{ key: "campaignEventNoLinks" }] },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("is not found for a campaign that does not exist", async () => {
    campaignFindUnique.mockResolvedValue(null);

    await expect(createCampaignEvent(99, valid)).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(createCampaignEvent(0, valid)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("keeps an adventure and a scene of that adventure", async () => {
    await createCampaignEvent(CAMPAIGN, {
      ...valid,
      adventureId: 10,
      sceneId: 100,
    });

    expect(create.mock.calls[0]?.[0].data).toMatchObject({
      adventureId: 10,
      sceneId: 100,
    });
  });

  it("sets the adventure from the scene when only the scene is named", async () => {
    await createCampaignEvent(CAMPAIGN, { ...valid, sceneId: 101 });

    expect(create.mock.calls[0]?.[0].data).toMatchObject({
      adventureId: 11,
      sceneId: 101,
    });
  });

  it("refuses another campaign's adventure", async () => {
    const result = await createCampaignEvent(CAMPAIGN, {
      ...valid,
      adventureId: 20,
    });

    expect(result).toEqual({
      ok: false,
      errors: { adventureId: [{ key: "adventureNotInCampaign" }] },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses an adventure that does not exist", async () => {
    const result = await createCampaignEvent(CAMPAIGN, {
      ...valid,
      adventureId: 999,
    });

    expect(result).toEqual({
      ok: false,
      errors: { adventureId: [{ key: "adventureNotInCampaign" }] },
    });
  });

  it("refuses a scene of another adventure than the one named", async () => {
    const result = await createCampaignEvent(CAMPAIGN, {
      ...valid,
      adventureId: 10,
      sceneId: 101,
    });

    expect(result).toEqual({
      ok: false,
      errors: { sceneId: [{ key: "sceneNotInAdventure" }] },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses, with no adventure named, a scene of another campaign", async () => {
    const result = await createCampaignEvent(CAMPAIGN, {
      ...valid,
      sceneId: 200,
    });

    expect(result).toEqual({
      ok: false,
      errors: { sceneId: [{ key: "sceneNotInCampaign" }] },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a scene that does not exist", async () => {
    const result = await createCampaignEvent(CAMPAIGN, {
      ...valid,
      sceneId: 999,
    });

    expect(result).toEqual({
      ok: false,
      errors: { sceneId: [{ key: "sceneNotInCampaign" }] },
    });
  });
});
