import { useTranslations } from "next-intl";

import pageMetaFields from "@/app/lib/config/pageMetaFields";
import DhAncestryMetaField from "@/app/lib/definitions/enums/daggerheart/DhAncestryMetaField";
import DhAncestry from "@/app/lib/definitions/interfaces/daggerheart/DhAncestry";
import HeritageCardView from "../daggerheart/HeritageCardView";

/** An ancestry as a card (SPEC-027 §5.3): its two features in order. */
export default function DhAncestryCardView({
  ancestry,
  headingLevel,
}: {
  ancestry: DhAncestry;
  headingLevel?: "h2" | "h3" | "h4";
}) {
  const t = useTranslations("dhAncestries.card");
  const renderFeatureText =
    pageMetaFields[DhAncestryMetaField.featureAText].getDatum;

  return (
    <HeritageCardView
      name={ancestry.name}
      image={ancestry.image}
      imageAlt={t("imageAlt", { name: ancestry.name })}
      testId="dh-ancestry-card-view"
      {...(headingLevel && { headingLevel })}
      features={[
        {
          name: ancestry.ancestryFeatureAName,
          text: renderFeatureText(ancestry.ancestryFeatureAText),
        },
        {
          name: ancestry.ancestryFeatureBName,
          text: renderFeatureText(ancestry.ancestryFeatureBText),
        },
      ]}
    />
  );
}
