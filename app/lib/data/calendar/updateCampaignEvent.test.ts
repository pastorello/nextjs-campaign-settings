import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import NotFoundError from "@/app/lib/errors/NotFoundError";
import CampaignEventInput from "@/app/lib/definitions/interfaces/calendar/CampaignEventInput";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update, eventFindUnique, adventureFindUnique, sceneFindUnique } =
  vi.hoisted(() => ({
    update:
      vi.fn<
        (args: {
          where: { id: number };
          data: Record<string, unknown>;
        }) => Promise<unknown>
      >(),
    eventFindUnique: vi.fn(),
    adventureFindUnique: vi.fn(),
    sceneFindUnique: vi.fn(),
  }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    calendarEvent: { update, findUnique: eventFindUnique },
    adventure: { findUnique: adventureFindUnique },
    scene: { findUnique: sceneFindUnique },
  },
}));

import updateCampaignEvent from "./updateCampaignEvent";

const valid: CampaignEventInput = {
  title: "The tower falls",
  description: "Rubble everywhere.",
  startDay: 100,
  startHour: null,
  endDay: 102,
  endHour: null,
  repeatsYearly: true,
  adventureId: 10,
  sceneId: null,
};

describe("updateCampaignEvent (SPEC-014 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    eventFindUnique.mockResolvedValue({ campaignId: 1 });
    adventureFindUnique.mockResolvedValue({ campaignId: 1 });
    update.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without reading or writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateCampaignEvent(5, valid)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(eventFindUnique).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("replaces every field, checking the adventure against the event's own campaign", async () => {
    const result = await updateCampaignEvent(5, valid);

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: {
        title: "The tower falls",
        description: "Rubble everywhere.",
        startDay: 100,
        startHour: null,
        endDay: 102,
        endHour: null,
        repeatsYearly: true,
        adventureId: 10,
        sceneId: null,
      },
    });
  });

  it("refuses an adventure of another campaign than the event's", async () => {
    adventureFindUnique.mockResolvedValue({ campaignId: 2 });

    const result = await updateCampaignEvent(5, valid);

    expect(result).toEqual({
      ok: false,
      errors: { adventureId: [{ key: "adventureNotInCampaign" }] },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses a scene of another adventure", async () => {
    sceneFindUnique.mockResolvedValue({
      adventureId: 11,
      adventure: { campaignId: 1 },
    });

    const result = await updateCampaignEvent(5, { ...valid, sceneId: 101 });

    expect(result).toEqual({
      ok: false,
      errors: { sceneId: [{ key: "sceneNotInAdventure" }] },
    });
  });

  it("refuses a yearly event spanning over a year", async () => {
    const result = await updateCampaignEvent(5, { ...valid, endDay: 500 });

    expect(result).toEqual({
      ok: false,
      errors: { endDay: [{ key: "repeatSpansOverAYear" }] },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("is not found for a world history event, which it never edits", async () => {
    eventFindUnique.mockResolvedValue({ campaignId: null });

    await expect(updateCampaignEvent(5, valid)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("is not found for a missing event or a malformed id", async () => {
    eventFindUnique.mockResolvedValue(null);

    await expect(updateCampaignEvent(5, valid)).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(updateCampaignEvent(-1, valid)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
