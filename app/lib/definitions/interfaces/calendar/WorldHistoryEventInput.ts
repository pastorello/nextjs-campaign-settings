/**
 * What the world history form sends to `createWorldHistoryEvent` /
 * `updateWorldHistoryEvent` (SPEC-014 §5.4). Days are universal days
 * (ADR-0015); an absent end is `null` (a one-day event); the links are row
 * ids. The actions still validate every field — this types the caller, it
 * does not vouch for the values.
 */
interface WorldHistoryEventInput {
  title: string;
  description: string | null;
  startDay: number | null;
  startHour: number | null;
  endDay: number | null;
  endHour: number | null;
  repeatsYearly: boolean;
  zoneIds: number[];
  npcIds: number[];
  deityIds: number[];
  factionIds: number[];
}

export default WorldHistoryEventInput;
