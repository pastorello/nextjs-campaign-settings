"use client";

import { useTranslations } from "next-intl";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhClassMetaField from "@/app/lib/definitions/enums/daggerheart/DhClassMetaField";
import DhClass from "@/app/lib/definitions/interfaces/daggerheart/DhClass";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";
import { dashboardPath } from "@/i18n/dashboardPath";
import { Link } from "@/i18n/navigation";

/**
 * The public class list (SPEC-021 T6): each class with its two domains and
 * description, linking to its page — where its features, subclasses and
 * cards are.
 */
export default function DhClassLibrary(props: {
  items: DhClass[];
  optionBundle: OptionBundle;
}) {
  const t = useTranslations();
  const system = useGameSystem();

  const domainName = (field: DhClassMetaField, value: number | null) =>
    resolveFieldValue(
      pageMetaFields[field],
      value,
      t,
      false,
      props.optionBundle
    );

  return (
    <div className="grid w-full grid-cols-1 gap-4 pt-5 md:grid-cols-2">
      {props.items.map((dhClass) => (
        <article
          key={dhClass.id}
          aria-labelledby={`dh-class-${dhClass.id}`}
          className="rounded-xl border border-gray-200 bg-white p-4 text-gray-900"
        >
          <h2 id={`dh-class-${dhClass.id}`} className="text-xl font-bold">
            <Link
              href={dashboardPath(system, `/classes/${dhClass.id}`)}
              className="underline-offset-2 hover:underline"
            >
              {dhClass.name}
            </Link>
          </h2>
          <p className="text-sm text-gray-700">
            {t("dhClasses.classPage.domains")}:{" "}
            {domainName(DhClassMetaField.domainAId, dhClass.domainAId)} ·{" "}
            {domainName(DhClassMetaField.domainBId, dhClass.domainBId)}
          </p>
          {dhClass.description && (
            <div className="mt-2 text-sm">
              {pageMetaFields.description.getDatum(dhClass.description)}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
