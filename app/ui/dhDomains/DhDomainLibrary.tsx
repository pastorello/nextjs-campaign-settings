"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";

import { dhDomainColourOf } from "@/app/lib/config/daggerheart/dhDomainColours";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomain";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import { Link } from "@/i18n/navigation";
import RecordThumbnail from "../components/RecordThumbnail";

/**
 * The public domain list (SPEC-021 T2): each domain in its colour, with its
 * emblem and description, linking to its page — where its cards are.
 */
export default function DhDomainLibrary(props: { items: DhDomain[] }) {
  const t = useTranslations("dhDomains");
  const system = useGameSystem();

  return (
    <div className="grid w-full grid-cols-1 gap-4 pt-5 md:grid-cols-2">
      {props.items.map((domain) => {
        const colour = dhDomainColourOf(domain.colour);
        return (
          <article
            key={domain.id}
            aria-labelledby={`dh-domain-${domain.id}`}
            className={clsx(
              "overflow-hidden rounded-xl border-4 bg-white text-gray-900",
              colour.borderClass
            )}
          >
            <div
              className={clsx(
                "flex items-center gap-3 px-3 py-2",
                colour.bandClass
              )}
            >
              <RecordThumbnail
                image={domain.image}
                name={t("emblemAlt", { domain: domain.name })}
                size="md"
              />
              <h2 id={`dh-domain-${domain.id}`} className="text-xl font-bold">
                <Link
                  href={dashboardPath(system, `/domains/${domain.id}`)}
                  className="underline-offset-2 hover:underline"
                >
                  {domain.name}
                </Link>
              </h2>
            </div>
            <div className="p-4 text-sm">
              {pageMetaFields.description.getDatum(domain.description ?? "")}
            </div>
          </article>
        );
      })}
    </div>
  );
}
