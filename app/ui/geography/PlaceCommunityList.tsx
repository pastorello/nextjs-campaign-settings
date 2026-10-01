"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import fetchCommunitiesAtPlace from "@/app/lib/data/dhCommunities/fetchCommunitiesAtPlace";
import isPageInSystem from "@/app/lib/config/isPageInSystem";
import type DhCommunityLink from "@/app/lib/definitions/interfaces/daggerheart/DhCommunityLink";
import PageType from "@/app/lib/definitions/types/PageType";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import { Link } from "@/i18n/navigation";

/**
 * The communities rooted in a place (SPEC-027 §5.6), in its popover. Only
 * under a system with communities (Daggerheart): the world is shared, the
 * catalogue is not. Renders nothing when the place has none.
 */
export default function PlaceCommunityList({ zoneId }: { zoneId: number }) {
  const t = useTranslations("dhCommunities");
  const system = useGameSystem();
  const enabled = isPageInSystem(PageType.DhCommunity, system);
  const [communities, setCommunities] = useState<DhCommunityLink[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await fetchCommunitiesAtPlace(zoneId);
        if (!cancelled) setCommunities(rows);
      } catch (error) {
        console.error("Failed to read a place's communities:", error);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, zoneId]);

  if (!enabled || communities.length === 0) return null;

  return (
    <section className="mb-3" aria-label={t("world.title")}>
      <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">
        {t("world.title")}
      </h3>
      <ul className="flex flex-wrap gap-x-2 text-sm">
        {communities.map((community) => (
          <li key={community.id}>
            <Link
              href={dashboardPath(
                system,
                `/communities?query=${encodeURIComponent(community.name)}&view=cards`
              )}
              className="text-blue-700 underline"
            >
              {community.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
