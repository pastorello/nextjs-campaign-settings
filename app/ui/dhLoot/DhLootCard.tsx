import { useTranslations } from "next-intl";

import dhLootKinds from "@/app/lib/config/daggerheart/dhLootKinds";
import dhRarities from "@/app/lib/config/daggerheart/dhRarities";
import DhLoot from "@/app/lib/definitions/interfaces/daggerheart/DhLoot";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import optionLabel from "@/app/ui/daggerheart/optionLabel";
import StatBlockView from "@/app/ui/daggerheart/StatBlockView";

/**
 * A piece of loot as a card (SPEC-029 §5): kind and rarity on the band,
 * the roll value it answers to on the DM's table when it has one, then
 * its effect.
 */
export default function DhLootCard({
  loot,
  headingLevel,
}: {
  loot: DhLoot;
  headingLevel?: "h2" | "h3" | "h4";
}) {
  const t = useTranslations();

  return (
    <StatBlockView
      name={loot.name}
      headerLine={t("dhLoot.card.header", {
        kind: optionLabel(dhLootKinds, loot.lootKind, t),
        rarity: optionLabel(dhRarities, loot.lootRarity, t),
      })}
      image={loot.image}
      imageAlt={t("dhLoot.card.imageAlt", { name: loot.name })}
      testId="dh-loot-card"
      {...(headingLevel && { headingLevel })}
    >
      {loot.rollValue !== null && (
        <p className="font-semibold">
          {t("dhLoot.card.rollValue", { value: loot.rollValue })}
        </p>
      )}
      <div>{renderRichText(loot.effectText)}</div>
    </StatBlockView>
  );
}
