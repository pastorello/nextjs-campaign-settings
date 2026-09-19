import { useId } from "react";
import { useTranslations } from "next-intl";

import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import DhDomainCardDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCardDomain";
import DhDomainCardView from "./DhDomainCardView";

/**
 * Cards grouped by level, each group a titled grid of card views — a
 * domain's page (SPEC-021 §5.2), and the class page's two domains later
 * (T6). `cards` arrive sorted by level; each carries its domain.
 */
export default function DhDomainCardsByLevel({
  cards,
}: {
  cards: (DhDomainCard & { domain: DhDomainCardDomain })[];
}) {
  const t = useTranslations("dhDomainCards");
  // Unique per instance: the class page (T6) shows two domains' groups.
  const idPrefix = useId();

  if (cards.length === 0) {
    return <p className="text-gray-600">{t("page.emptyMessage")}</p>;
  }

  const levels = [...new Set(cards.map((card) => card.cardLevel))].sort(
    (a, b) => a - b
  );

  return (
    <div className="flex flex-col gap-6">
      {levels.map((level) => (
        <section key={level} aria-labelledby={`${idPrefix}-level-${level}`}>
          <h2
            id={`${idPrefix}-level-${level}`}
            className="mb-3 text-lg font-semibold"
          >
            {t("card.level", { level })}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards
              .filter((card) => card.cardLevel === level)
              .map((card) => (
                <DhDomainCardView
                  key={card.id}
                  card={card}
                  domain={card.domain}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
