import { useTranslations } from "next-intl";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhClassMetaField from "@/app/lib/definitions/enums/daggerheart/DhClassMetaField";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import DhClassPage from "@/app/lib/definitions/interfaces/daggerheart/DhClassPage";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";
import { dashboardPath } from "@/i18n/dashboardPath";
import { Link } from "@/i18n/navigation";
import { lusitana } from "@/app/ui/fonts";
import DhDomainCardsByLevel from "../dhDomainCards/DhDomainCardsByLevel";
import DhSubclassOnClassPage from "./DhSubclassOnClassPage";

/** A titled section of the class page, named by its `h2`. */
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className={`${lusitana.className} text-xl`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * A class's page (SPEC-021 §5.4, T6): the class and its fields, its features
 * in order, its Hope feature at its fixed cost of 3 Hope, its subclasses with
 * their features by tier, then every card of its two domains grouped by
 * level as card views.
 *
 * Not async: the route reads the data and mounts the record-link targets
 * above it (SPEC-019 T5), so every formatted text here renders its links.
 */
export default function DhClassPageView({
  page,
  system,
}: {
  page: DhClassPage;
  system: GameSystem;
}) {
  const t = useTranslations();
  const { dhClass, domains, subclasses, cards } = page;

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className={`${lusitana.className} text-2xl`}>{dhClass.name}</h1>
        <p className="text-sm text-gray-700">
          {t("daggerheart.fields.origin.label")}:{" "}
          {resolveFieldValue(
            pageMetaFields[DhClassMetaField.origin],
            dhClass.origin,
            t
          )}
        </p>
        {dhClass.description && (
          <div>{pageMetaFields.description.getDatum(dhClass.description)}</div>
        )}
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="font-medium text-gray-600">
            {t("dhClasses.classPage.domains")}
          </dt>
          <dd>
            <ul className="flex flex-wrap gap-x-4">
              {domains.map((domain) => (
                <li key={domain.id}>
                  <Link
                    href={dashboardPath(system, `/domains/${domain.id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    {domain.name}
                  </Link>
                </li>
              ))}
            </ul>
          </dd>
          <dt className="font-medium text-gray-600">
            {t("dhClasses.fields.startingEvasion.label")}
          </dt>
          <dd>{dhClass.startingEvasion}</dd>
          <dt className="font-medium text-gray-600">
            {t("dhClasses.fields.startingHp.label")}
          </dt>
          <dd>{dhClass.startingHp}</dd>
          {dhClass.classItems && (
            <>
              <dt className="font-medium text-gray-600">
                {t("dhClasses.fields.classItems.label")}
              </dt>
              <dd>
                {pageMetaFields[DhClassMetaField.classItems].getDatum(
                  dhClass.classItems
                )}
              </dd>
            </>
          )}
        </dl>
      </header>

      <Section id="class-features" title={t("dhClasses.features.title")}>
        <ul className="flex flex-col gap-3">
          {dhClass.features.map((feature) => (
            <li key={feature.id}>
              <h3 className="font-semibold">{feature.name}</h3>
              <div className="text-sm">{renderRichText(feature.text)}</div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="hope-feature" title={t("dhClasses.hopeFeature.legend")}>
        <div>
          <h3 className="font-semibold">{dhClass.hopeFeatureName}</h3>
          <p className="text-sm text-gray-700">
            {t("dhClasses.hopeFeature.cost")}
          </p>
          <div className="text-sm">
            {pageMetaFields[DhClassMetaField.hopeFeatureText].getDatum(
              dhClass.hopeFeatureText
            )}
          </div>
        </div>
      </Section>

      <Section id="subclasses" title={t("dhSubclasses.page.title")}>
        {subclasses.length === 0 ? (
          <p className="text-gray-600">
            {t("dhClasses.classPage.noSubclasses")}
          </p>
        ) : (
          subclasses.map((subclass) => (
            <DhSubclassOnClassPage key={subclass.id} subclass={subclass} />
          ))
        )}
      </Section>

      <Section id="domain-cards" title={t("dhClasses.classPage.domainCards")}>
        <DhDomainCardsByLevel cards={cards} levelHeading="h3" />
      </Section>
    </div>
  );
}
