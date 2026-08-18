import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";

/**
 * An adventure within a campaign's ladder, or standalone when `campaignId`
 * is null (SPEC-013 §6). Every target is nullable — an unset budget target
 * renders as "—", never 0. `currencyTarget` is stored in silver, per the
 * spec's counting rule; `currencyUnit` ("silver" | "gold") is a display-only
 * choice, not one of T3's three closed vocabularies, so it stays a plain
 * `string | null` here rather than a dedicated enum.
 */
interface Adventure {
  id: number;
  campaignId: number | null;
  position: number;
  targetLevel: number;
  title: string;
  synopsis: string | null;
  timeline: string | null;
  status: AdventureStatus;
  xpTarget: number | null;
  currencyTarget: number | null;
  currencyUnit: string | null;
  permanentItemTarget: number | null;
  consumableTarget: number | null;
}

export default Adventure;
