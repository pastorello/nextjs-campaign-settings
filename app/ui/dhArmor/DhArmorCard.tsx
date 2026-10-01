import { useTranslations } from "next-intl";

import DhArmor from "@/app/lib/definitions/interfaces/daggerheart/DhArmor";
import EquipmentFeature from "@/app/ui/daggerheart/EquipmentFeature";
import StatBlockView, {
  StatBlockNumber,
} from "@/app/ui/daggerheart/StatBlockView";

/**
 * An armor as a card (SPEC-029 §5): the tier on the band, its base
 * thresholds and armor score, and its feature.
 */
export default function DhArmorCard({
  armor,
  headingLevel,
}: {
  armor: DhArmor;
  headingLevel?: "h2" | "h3" | "h4";
}) {
  const t = useTranslations();

  return (
    <StatBlockView
      name={armor.name}
      headerLine={t("dhArmor.card.header", { tier: armor.tier })}
      image={armor.image}
      imageAlt={t("dhArmor.card.imageAlt", { name: armor.name })}
      testId="dh-armor-card"
      {...(headingLevel && { headingLevel })}
    >
      <dl className="flex flex-wrap gap-x-6 gap-y-2">
        <StatBlockNumber
          label={t("dhArmor.card.thresholds")}
          value={`${armor.armorMajor}/${armor.armorSevere}`}
        />
        <StatBlockNumber
          label={t("dhArmor.fields.armorScore.label")}
          value={armor.armorScore}
        />
      </dl>
      <EquipmentFeature
        name={armor.armorFeatureName}
        text={armor.armorFeatureText}
      />
    </StatBlockView>
  );
}
