"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { dashboardPath } from "@/i18n/dashboardPath";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import recordHref, {
  RECORD_LIST_PATH,
} from "@/app/lib/utils/search/recordHref";
import type {
  SearchAllDomainsResult,
  SearchDomain,
  SearchDomainGroup,
} from "@/app/lib/data/search/searchAllDomains";

/**
 * One entry per domain, in the spec's fixed render order (SPEC-011 §5.3):
 * Spells, Magic Items, NPCs, Deities, Factions, Places. Where each result and
 * each "see all" link lead is `recordHref`/`RECORD_LIST_PATH`, shared with
 * formatted-text record links (SPEC-019).
 */
const DOMAIN_ORDER: {
  domain: SearchDomain;
  headingNamespace: string;
  headingKey: string;
}[] = [
  {
    domain: "spells",
    headingNamespace: "common.cards",
    headingKey: "spells",
  },
  {
    domain: "magicItems",
    headingNamespace: "common.cards",
    headingKey: "magicItems",
  },
  {
    domain: "npc",
    headingNamespace: "common.cards",
    headingKey: "npc",
  },
  {
    domain: "deities",
    headingNamespace: "common.cards",
    headingKey: "deities",
  },
  {
    domain: "factions",
    headingNamespace: "common.nav",
    headingKey: "factions",
  },
  {
    // No list page to cap against (§5.4) — a Places group is never capped
    // in practice at this DM's current tree size, but the cap/UI still
    // apply uniformly rather than special-casing this one group.
    domain: "places",
    headingNamespace: "search.page.groups",
    headingKey: "places",
  },
];

function DomainGroup({
  domain,
  group,
  heading,
  term,
}: {
  domain: SearchDomain;
  group: SearchDomainGroup;
  heading: string;
  term: string;
}) {
  const t = useTranslations("search.page");
  const system = useGameSystem();
  const listPath = RECORD_LIST_PATH[domain];

  if (group.total === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-semibold">
        {heading} (<span role="status">{group.total}</span>)
      </h2>
      <ul className="list-disc pl-5">
        {group.items.map((item) => (
          <li key={item.id}>
            <Link
              href={recordHref(system, domain, item)}
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
      {DOMAIN_ORDER.map(({ domain, headingNamespace, headingKey }) => (
        <DomainGroup
          key={domain}
          domain={domain}
          group={results[domain]}
          heading={headingFor(headingNamespace, headingKey)}
          term={term}
        />
      ))}
    </div>
  );
}
