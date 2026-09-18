import { z } from "zod";

import campaignEventOwnerMeta from "@/app/lib/config/calendarEvent/campaignEventOwnerMeta";
import calendarEventShape from "./calendarEventShape";
import checkCalendarEventDates from "./checkCalendarEventDates";

/**
 * A world history link sent with a campaign event: refused unless absent
 * or empty (SPEC-014 §5.4 — only world history links places, NPCs, deities
 * and factions). Declared rather than left to Zod's default stripping, so
 * a caller that sends links is told, on the field it sent, instead of the
 * links vanishing silently.
 */
const noLinks = z
  .array(z.unknown())
  .max(0, { message: "campaignEventNoLinks" })
  .optional();

/**
 * A campaign event's payload (SPEC-014 §5.4, T6): the shared event fields
 * and date rules, plus the adventure and scene it names. That those belong
 * to the campaign, and the scene to the adventure, is checked afterwards
 * by `resolveCampaignEventOwner` — a schema cannot read the database.
 */
const campaignEventSchema = z
  .object({
    ...calendarEventShape,
    adventureId: campaignEventOwnerMeta.adventureId.validator,
    sceneId: campaignEventOwnerMeta.sceneId.validator,
    zoneIds: noLinks,
    npcIds: noLinks,
    deityIds: noLinks,
    factionIds: noLinks,
  })
  .superRefine(checkCalendarEventDates);

export default campaignEventSchema;
