import clsx from "clsx";
import { useTranslations } from "next-intl";

import { dhDomainColourOf } from "@/app/lib/config/daggerheart/dhDomainColours";
import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhDomainMetaField from "@/app/lib/definitions/enums/daggerheart/DhDomainMetaField";
import DhDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomain";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";
import { lusitana } from "@/app/ui/fonts";
import RecordDisplayImage from "../components/RecordDisplayImage";

/**
 * The top of a domain's page (SPEC-021 §5.2): its name as the page heading
 * on a band of its colour, its emblem, origin and formatted description.
 */
export default function DhDomainHeader({ domain }: { domain: DhDomain }) {
  const t = useTranslations();
  const colour = dhDomainColourOf(domain.colour);

  return (
    <header
      className={clsx(
        "overflow-hidden rounded-xl border-4 bg-white text-gray-900",
        colour.borderClass
      )}
    >
      <div className={clsx("px-4 py-3", colour.bandClass)}>
        <h1 className={`${lusitana.className} text-2xl`}>{domain.name}</h1>
        <p className="text-sm">
          {t("daggerheart.fields.origin.label")}:{" "}
          {resolveFieldValue(
            pageMetaFields[DhDomainMetaField.origin],
            domain.origin,
            t
          )}
        </p>
      </div>
      <div className="flex flex-col gap-4 p-4 md:flex-row">
        {domain.image && (
          <RecordDisplayImage
            image={domain.image}
            name={t("dhDomains.emblemAlt", { domain: domain.name })}
          />
        )}
        <div className="text-base">
          {pageMetaFields.description.getDatum(domain.description ?? "")}
        </div>
      </div>
    </header>
  );
}
