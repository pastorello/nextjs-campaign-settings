"use client";

import { MapIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import useGameSystem from "@/app/lib/hooks/useGameSystem";

/**
 * The shortcut from a character's card to the place it lives at (SPEC-026,
 * the DM's answer of 2026-09-30): the geography page opened on that place,
 * through the same `?place=` deep link search and scenes use.
 *
 * A separate icon link beside the location, not the location itself: on the
 * cards the location is already `AssignLocationButton`'s trigger, and one
 * control cannot be both a button and a link. For a character at a
 * landmark, `zoneId` is the landmark's zone — the map the landmark is on.
 */
export default function PlaceMapLink({
  zoneId,
  placeLabel,
}: {
  zoneId: number;
  placeLabel: string;
}) {
  const t = useTranslations();
  const system = useGameSystem();
  const label = t("common.location.openOnMap", { place: placeLabel });

  return (
    <Link
      href={dashboardPath(system, `/geography?place=${zoneId}`)}
      aria-label={label}
      title={label}
      className="inline-flex shrink-0 items-center text-blue-300 hover:text-blue-200"
    >
      <MapIcon className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}
