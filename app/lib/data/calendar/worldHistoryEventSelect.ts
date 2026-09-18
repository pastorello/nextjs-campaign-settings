import { Prisma } from "@/generated/prisma/client";

import WorldHistoryEvent from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEvent";

const byName = {
  select: { id: true, name: true },
  orderBy: { name: "asc" },
} as const;

/**
 * What world history reads of an event — its fields and its links, by
 * name — and the order it reads them in: by start day, a day's untimed
 * events first. Shared by the list and the month grid, whose edit form
 * needs the same event.
 */
export const worldHistoryEventSelect = {
  id: true,
  title: true,
  description: true,
  startDay: true,
  startHour: true,
  endDay: true,
  endHour: true,
  repeatsYearly: true,
  zones: {
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  },
  npcs: byName,
  deities: byName,
  factions: byName,
} as const;

export const worldHistoryEventOrder: Prisma.calendarEventOrderByWithRelationInput[] =
  [
    { startDay: "asc" },
    { startHour: { sort: "asc", nulls: "first" } },
    { id: "asc" },
  ];

/** A row read with `worldHistoryEventSelect`, its places named like the rest. */
export function toWorldHistoryEvent({
  zones,
  ...event
}: Omit<WorldHistoryEvent, "zones"> & {
  zones: { id: number; title: string }[];
}): WorldHistoryEvent {
  return {
    ...event,
    zones: zones.map(({ id, title }) => ({ id, name: title })),
  };
}
