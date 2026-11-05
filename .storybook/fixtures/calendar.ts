import {
  humanCountFixture,
  universalCountFixture,
} from "@/app/lib/calendar/dateSystemFixtures";
import { dateToUniversalDay } from "@/app/lib/calendar/dateToUniversalDay";
import type CalendarMonth from "@/app/lib/calendar/CalendarMonth";
import type CalendarEventBase from "@/app/lib/definitions/interfaces/calendar/CalendarEventBase";
import type CampaignEvent from "@/app/lib/definitions/interfaces/calendar/CampaignEvent";
import type DateSystem from "@/app/lib/definitions/interfaces/calendar/DateSystem";
import type WorldHistoryEvent from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEvent";
import type { CampaignEventOwnerOptions } from "@/app/ui/calendar/CampaignEventForm";
import type { WorldHistoryLinkOptions } from "@/app/ui/calendar/WorldHistoryEventForm";

/** Story fixtures; invented prose (CLAUDE.md, 2026-10-15). */
export { humanCountFixture as human, universalCountFixture as universal };

export const systems: readonly DateSystem[] = [
  universalCountFixture,
  humanCountFixture,
];

/** The human count's first month: "Brumaio 0 d.C.". */
export const month: CalendarMonth = {
  universalYear: humanCountFixture.anchorYear,
  monthIndex: 0,
};

/** The universal day of `dayOfMonth` in {@link month}. */
export const day = (dayOfMonth: number): number =>
  dateToUniversalDay({ ...month, day: dayOfMonth });

/** A "today" in the middle of the month. */
export const today = day(10);

export const historyEvents: WorldHistoryEvent[] = [
  {
    id: 1,
    title: "La Caduta del Faro",
    description: "<p>Il faro di Skreebar si spense per un'intera notte.</p>",
    startDay: day(3),
    startHour: 21,
    endDay: day(5),
    endHour: null,
    repeatsYearly: false,
    zones: [{ id: 4, name: "Skreebar" }],
    npcs: [{ id: 1, name: "Aldric Valmonte" }],
    deities: [],
    factions: [{ id: 1, name: "Gilda dei Cartografi" }],
  },
  {
    id: 2,
    title: "Festa delle Lanterne",
    description: null,
    startDay: day(20),
    startHour: null,
    endDay: null,
    endHour: null,
    repeatsYearly: true,
    zones: [],
    npcs: [],
    deities: [{ id: 2, name: "Helios" }],
    factions: [],
  },
];

export const linkOptions: WorldHistoryLinkOptions = {
  zones: [{ label: "Skreebar", value: 4 }],
  npcs: [{ label: "Aldric Valmonte", value: 1 }],
  deities: [{ label: "Helios", value: 2 }],
  factions: [{ label: "Gilda dei Cartografi", value: 1 }],
};

export const campaignEvents: CampaignEvent[] = [
  {
    id: 11,
    title: "Banchetto del console",
    description: "<p>Il gruppo è invitato a palazzo.</p>",
    startDay: day(4),
    startHour: 19,
    endDay: null,
    endHour: null,
    repeatsYearly: false,
    adventure: { id: 5, name: "Il Passo Spezzato" },
    scene: null,
  },
  {
    id: 12,
    title: "Marcia sul valico",
    description: null,
    startDay: day(9),
    startHour: null,
    endDay: day(12),
    endHour: null,
    repeatsYearly: false,
    adventure: null,
    scene: { id: 7, name: "Il ponte di corda" },
  },
  {
    id: 13,
    title: "Mercato d'autunno",
    description: null,
    startDay: day(18),
    startHour: null,
    endDay: null,
    endHour: null,
    repeatsYearly: true,
    adventure: null,
    scene: null,
  },
];

export const campaignHistory: CalendarEventBase[] = historyEvents.map(
  ({
    id,
    title,
    description,
    startDay,
    startHour,
    endDay,
    endHour,
    repeatsYearly,
  }) => ({
    id,
    title,
    description,
    startDay,
    startHour,
    endDay,
    endHour,
    repeatsYearly,
  })
);

export const ownerOptions: CampaignEventOwnerOptions = {
  adventures: [{ id: 5, name: "Il Passo Spezzato" }],
  scenes: [{ id: 7, title: "Il ponte di corda", adventureId: 5 }],
};
