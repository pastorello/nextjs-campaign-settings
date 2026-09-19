import { useId } from "react";
import { useTranslations } from "next-intl";

import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import DhDomainCardDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCardDomain";
import DhDomainCardView from "./DhDomainCardView";

/**
 * Cards grouped by level, each group a titled grid of card views — a
 * domain's page (SPEC-021 §5.2), and both of a class's domains on its page
 * (T6). `cards` arrive sorted by level; each carries its domain.
 *
 * `levelHeading` fits the groups into the page's outline: `h2` under a
 * domain's `h1`, `h3` under the class page's "domain cards" `h2`. Card names
 * sit one level below it.
 */
export default function DhDomainCardsByLevel({
  cards,
  levelHeading = "h2",
}: {
  cards: (DhDomainCard & { domain: DhDomainCardDomain })[];
  levelHeading?: "h2" | "h3";
}) {
  const t = useTranslations("dhDomainCards");
  // Unique per instance, should a page show more than one set of groups.
  const idPrefix = useId();

  if (cards.length === 0) {
    return <p className="text-gray-600">{t("page.emptyMessage")}</p>;
  }

  const LevelHeading = levelHeading;
  const cardHeading = levelHeading === "h2" ? "h3" : "h4";
  const levels = [...new Set(cards.map((card) => card.cardLevel))].sort(
    (a, b) => a - b
  );

  return (
    <div className="flex flex-col gap-6">
      {levels.map((level) => (
        <section key={level} aria-labelledby={`${idPrefix}-level-${level}`}>
          <LevelHeading
            id={`${idPrefix}-level-${level}`}
            className="mb-3 text-lg font-semibold"
          >
            {t("card.level", { level })}
          </LevelHeading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards
              .filter((card) => card.cardLevel === level)
              .map((card) => (
                <DhDomainCardView
                  key={card.id}
                  card={card}
                  domain={card.domain}
                  headingLevel={cardHeading}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
