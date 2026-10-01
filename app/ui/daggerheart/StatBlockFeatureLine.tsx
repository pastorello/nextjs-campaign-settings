import { useTranslations } from "next-intl";

import dhFeatureKinds from "@/app/lib/config/daggerheart/dhFeatureKinds";
import renderRichText from "@/app/lib/utils/data/renderRichText";

import optionLabel from "./optionLabel";

/**
 * One stat block feature as a table reads it (SPEC-028 §5.3): its name, its
 * kind, a Fear marker on an adversary's Fear feature, then its text and
 * any prompt questions. Shared by the stat blocks and the inline lists.
 */
export default function StatBlockFeatureLine({
  feature,
}: {
  feature: {
    name: string;
    kind: string;
    fear?: boolean;
    text: string;
    questions?: string | null;
  };
}) {
  const t = useTranslations();
  const kindLabel = optionLabel(dhFeatureKinds, feature.kind, t);

  return (
    <div>
      <p>
        <span className="font-semibold">{feature.name}</span>
        {" – "}
        <span className="italic">{kindLabel}</span>
        {feature.fear && (
          <span className="ml-2 rounded bg-purple-800 px-1.5 py-0.5 text-xs font-semibold text-white">
            {t("dhAdversaries.statBlock.fear")}
          </span>
        )}
      </p>
      <div>{renderRichText(feature.text)}</div>
      {feature.questions && (
        <div className="mt-1 text-gray-700 italic">
          {renderRichText(feature.questions)}
        </div>
      )}
    </div>
  );
}
