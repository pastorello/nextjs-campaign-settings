import { useTranslations } from "next-intl";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhSubclassMetaField from "@/app/lib/definitions/enums/daggerheart/DhSubclassMetaField";
import DhSubclass from "@/app/lib/definitions/interfaces/daggerheart/DhSubclass";
import DhSubclassFeature from "@/app/lib/definitions/interfaces/daggerheart/DhSubclassFeature";
import groupFeaturesByTier from "@/app/lib/utils/daggerheart/groupFeaturesByTier";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import resolveFieldValue from "@/app/lib/utils/data/resolveFieldValue";
import subclassAnchor from "@/app/lib/utils/daggerheart/subclassAnchor";

/**
 * One subclass on its class's page (SPEC-021 §5.4, T6): its name, spellcast
 * trait and description, then its features grouped foundation /
 * specialization / mastery by `groupFeaturesByTier` — the grouping its inline
 * editor uses. A tier with no features is left out here; the editor shows it
 * so a feature can be added to it.
 *
 * Headings: the subclass `h3` (under the page's "Subclasses" `h2`), tiers
 * `h4`, feature names `h5`.
 */
export default function DhSubclassOnClassPage({
  subclass,
}: {
  subclass: DhSubclass & { features: DhSubclassFeature[] };
}) {
  const t = useTranslations();
  const headingId = subclassAnchor(subclass.id);
  const tiers = groupFeaturesByTier(subclass.features).filter(
    ([, features]) => features.length > 0
  );

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-gray-200 bg-white p-4"
    >
      <h3 id={headingId} className="scroll-mt-4 text-lg font-bold">
        {subclass.name}
      </h3>
      <p className="text-sm text-gray-700">
        {t("dhSubclasses.fields.spellcastTrait.label")}:{" "}
        {resolveFieldValue(
          pageMetaFields[DhSubclassMetaField.spellcastTrait],
          subclass.spellcastTrait,
          t
        )}
      </p>
      {subclass.description && (
        <div className="mt-2">
          {pageMetaFields.description.getDatum(subclass.description)}
        </div>
      )}
      {tiers.map(([tier, features]) => (
        <div key={tier} className="mt-4">
          <h4 className="font-semibold text-gray-800">
            {t(`dhSubclasses.tiers.${tier}`)}
          </h4>
          <ul className="mt-1 flex flex-col gap-2">
            {features.map((feature) => (
              <li key={feature.id}>
                <h5 className="font-medium">{feature.name}</h5>
                <div className="text-sm">{renderRichText(feature.text)}</div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
