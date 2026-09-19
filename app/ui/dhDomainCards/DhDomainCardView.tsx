import { useId } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import { dhDomainColourOf } from "@/app/lib/config/daggerheart/dhDomainColours";
import DhDomainCardMetaField from "@/app/lib/definitions/enums/daggerheart/DhDomainCardMetaField";
import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import DhDomainCardDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCardDomain";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";
import RecordThumbnail from "../components/RecordThumbnail";

interface DhDomainCardViewProps {
  card: DhDomainCard;
  domain: DhDomainCardDomain;
  /** The card name's heading level, to fit the page it sits on. */
  headingLevel?: "h2" | "h3" | "h4";
}

/**
 * A domain card laid out as a card (SPEC-021 §5.3): a band in the domain's
 * colour carrying its emblem and name, then the card's name, level, recall
 * cost, type and formatted feature text. On screen only — no print layout
 * (SPEC-021 §3).
 *
 * An `article` named by its heading, so a screen reader can list and jump
 * between cards. The domain's colour is never the only thing naming it: the
 * band spells the domain's name out, and the palette guarantees its text
 * contrast (`dhDomainColours.ts`).
 *
 * Not async and with no client state, so the client card library and the
 * server-rendered domain page can both render it.
 */
export default function DhDomainCardView({
  card,
  domain,
  headingLevel = "h3",
}: DhDomainCardViewProps) {
  const t = useTranslations();
  const headingId = useId();
  const colour = dhDomainColourOf(domain.colour);
  const Heading = headingLevel;

  return (
    <article
      aria-labelledby={headingId}
      data-testid="dh-domain-card-view"
      className={clsx(
        "flex min-h-72 w-full flex-col overflow-hidden rounded-xl border-4 bg-white text-gray-900 shadow-md",
        colour.borderClass
      )}
    >
      <div
        className={clsx("flex items-center gap-3 px-3 py-2", colour.bandClass)}
      >
        <RecordThumbnail
          image={domain.image}
          name={t("dhDomainCards.card.emblemAlt", { domain: domain.name })}
        />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-wide">
          {domain.name}
        </p>
        <p className="shrink-0 text-sm font-semibold">
          {t("dhDomainCards.card.level", { level: card.cardLevel })}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Heading id={headingId} className="text-lg font-bold">
          {card.name}
        </Heading>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-1">
            <dt className="font-medium text-gray-600">
              {t("dhDomainCards.fields.cardType.label")}:
            </dt>
            <dd>
              {resolveFieldValue(
                pageMetaFields[DhDomainCardMetaField.cardType],
                card.cardType,
                t
              )}
            </dd>
          </div>
          <div className="flex gap-1">
            <dt className="font-medium text-gray-600">
              {t("dhDomainCards.fields.recallCost.label")}:
            </dt>
            <dd>{card.recallCost}</dd>
          </div>
        </dl>
        <div className="border-t border-gray-200 pt-2 text-sm">
          {pageMetaFields[DhDomainCardMetaField.featureText].getDatum(
            card.featureText
          )}
        </div>
      </div>
    </article>
  );
}
