"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import type {
  SearchAllDomainsResult,
  SearchDomain,
  SearchDomainGroup,
} from "@/app/lib/data/search/searchAllDomains";

/**
 * One entry per domain, in the spec's fixed render order (SPEC-011 §5.3):
 * Spells, Magic Items, NPCs, Deities, Factions, Places. `listPath` is the
 * domain's own list page subpath (relative to the dashboard root — joined
 * with `dashboardPath(system, ...)` at render time, ADR-0013 rule 5),
 * reused for both the "see all" link and each result's own link — every
 * domain but Places links to `${listPath}?query=<name>`, the convention
 * SPEC-006 established for faction/NPC cross-links (`FactionCard`/`NpcCard`)
 * in the absence of per-entity detail routes. Places link to
 * `/geography?place=<id>` instead (§5.5) — that param isn't read yet
 * (SPEC-011 T4, built in a parallel PR), so the link is correct but doesn't
 * fully resolve until T4 lands too.
 */
const DOMAIN_ORDER: {
  domain: SearchDomain;
  headingNamespace: string;
  headingKey: string;
  listPath: `/${string}` | null;
}[] = [
  {
    domain: "spells",
    headingNamespace: "common.cards",
    headingKey: "spells",
    listPath: "/spells",
  },
  {
    domain: "magicItems",
    headingNamespace: "common.cards",
    headingKey: "magicItems",
    listPath: "/magicitems",
  },
  {
    domain: "npc",
    headingNamespace: "common.cards",
    headingKey: "npc",
    listPath: "/npc",
  },
  {
    domain: "deities",
    headingNamespace: "common.cards",
    headingKey: "deities",
    listPath: "/deities",
  },
  {
    domain: "factions",
    headingNamespace: "common.nav",
    headingKey: "factions",
    listPath: "/factions",
  },
  {
    // No list page to cap against (§5.4) — a Places group is never capped
    // in practice at this DM's current tree size, but the cap/UI still
    // apply uniformly rather than special-casing this one group.
    domain: "places",
    headingNamespace: "search.page.groups",
    headingKey: "places",
    listPath: null,
  },
];

function resultHref(
  system: GameSystem,
  listPath: `/${string}` | null,
  item: { id: number; name: string }
): string {
  if (listPath === null) {
    // Only "places" (§5.4) has no list page to link back to.
    return dashboardPath(system, `/geography?place=${item.id}`);
  }
  return dashboardPath(
    system,
    `${listPath}?query=${encodeURIComponent(item.name)}`
  );
}

function DomainGroup({
  group,
  heading,
  listPath,
  term,
}: {
  group: SearchDomainGroup;
  heading: string;
  listPath: `/${string}` | null;
  term: string;
}) {
  const t = useTranslations("search.page");
  const system = useGameSystem();

  if (group.total === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-semibold">
        {heading} ({group.total})
      </h2>
      <ul className="list-disc pl-5">
        {group.items.map((item) => (
          <li key={item.id}>
            <Link
              href={resultHref(system, listPath, item)}
              className="text-blue-600 hover:underline"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
      {listPath && group.total > group.items.length && (
        <Link
          href={dashboardPath(
            system,
            `${listPath}?query=${encodeURIComponent(term)}`
          )}
          className="mt-1 inline-block text-sm text-blue-600 hover:underline"
        >
          {t("seeAll", { count: group.total, domain: heading })}
        </Link>
      )}
    </section>
  );
}

export default function CrossEntitySearchResults({
  term,
  results,
}: {
  term: string;
  results: SearchAllDomainsResult;
}) {
  const t = useTranslations("search.page");
  const tCards = useTranslations("common.cards");
  const tNav = useTranslations("common.nav");
  const tGroups = useTranslations("search.page.groups");

  const headingFor = (namespace: string, key: string) => {
    switch (namespace) {
      case "common.cards":
        return tCards(key);
      case "common.nav":
        return tNav(key);
      default:
        return tGroups(key);
    }
  };

  if (!term) {
    return <p className="text-gray-500">{t("prompt")}</p>;
  }

  const hasAnyMatch = DOMAIN_ORDER.some(
    ({ domain }) => results[domain].total > 0
  );

  if (!hasAnyMatch) {
    return <p className="text-gray-500">{t("noMatches", { term })}</p>;
  }

  return (
    <div>
      {DOMAIN_ORDER.map(
        ({ domain, headingNamespace, headingKey, listPath }) => (
          <DomainGroup
            key={domain}
            group={results[domain]}
            heading={headingFor(headingNamespace, headingKey)}
            listPath={listPath}
            term={term}
          />
        )
      )}
    </div>
  );
}
