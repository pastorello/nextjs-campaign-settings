import { useTranslations } from "next-intl";

import dhAdversaryTypes from "@/app/lib/config/daggerheart/dhAdversaryTypes";
import dhDamageTypes from "@/app/lib/config/daggerheart/dhDamageTypes";
import dhRanges from "@/app/lib/config/daggerheart/dhRanges";
import DhAdversaryType from "@/app/lib/definitions/enums/daggerheart/DhAdversaryType";
import DhAdversary from "@/app/lib/definitions/interfaces/daggerheart/DhAdversary";
import renderRichText from "@/app/lib/utils/data/renderRichText";
import optionLabel from "@/app/ui/daggerheart/optionLabel";
import StatBlockView, {
  StatBlockNumber,
} from "@/app/ui/daggerheart/StatBlockView";
import StatBlockFeatureLine from "@/app/ui/daggerheart/StatBlockFeatureLine";

import formatBonus from "./formatBonus";

/**
 * An adversary's stat block (SPEC-028 §5.3), laid out the way a table
 * reads it: tier and type on the band, the description and motives, the
 * numbers in one row, then the attack, the experiences and the features,
 * Fear features marked.
 */
export default function DhAdversaryStatBlock({
  adversary,
  headingLevel,
}: {
  adversary: DhAdversary;
  headingLevel?: "h2" | "h3" | "h4";
}) {
  const t = useTranslations();
  const type = optionLabel(dhAdversaryTypes, adversary.adversaryType, t);
  const headerLine = [
    t("dhAdversaries.statBlock.header", { tier: adversary.tier, type }),
    adversary.adversaryType === (DhAdversaryType.Horde as string) &&
    adversary.hordeDensity !== null
      ? t("dhAdversaries.statBlock.hordeDensity", {
          count: adversary.hordeDensity,
        })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const thresholds =
    adversary.majorThreshold !== null && adversary.severeThreshold !== null
      ? `${adversary.majorThreshold}/${adversary.severeThreshold}`
      : t("dhAdversaries.statBlock.noThresholds");
  const experiences = adversary.experiences ?? [];
  const features = adversary.features ?? [];

  return (
    <StatBlockView
      name={adversary.name}
      headerLine={headerLine}
      image={adversary.image}
      imageAlt={t("dhAdversaries.statBlock.imageAlt", {
        name: adversary.name,
      })}
      testId="dh-adversary-stat-block"
      {...(headingLevel && { headingLevel })}
    >
      {adversary.description && (
        <div className="italic">{renderRichText(adversary.description)}</div>
      )}
      {adversary.motives && (
        <div>
          <p className="font-semibold">
            {t("dhAdversaries.fields.motives.label")}
          </p>
          {renderRichText(adversary.motives)}
        </div>
      )}
      <dl className="flex flex-wrap gap-x-6 gap-y-2 border-y border-gray-200 py-2">
        <StatBlockNumber
          label={t("daggerheart.fields.difficulty.label")}
          value={adversary.difficulty}
        />
        <StatBlockNumber
          label={t("dhAdversaries.statBlock.thresholds")}
          value={thresholds}
        />
        <StatBlockNumber
          label={t("dhAdversaries.fields.hp.label")}
          value={adversary.hp}
        />
        <StatBlockNumber
          label={t("dhAdversaries.fields.stress.label")}
          value={adversary.stress}
        />
        <StatBlockNumber
          label={t("dhAdversaries.fields.attackModifier.label")}
          value={formatBonus(adversary.attackModifier)}
        />
      </dl>
      <p>
        <span className="font-semibold">
          {t("dhAdversaries.statBlock.attack")}:
        </span>{" "}
        {adversary.attackName} ·{" "}
        {optionLabel(dhRanges, adversary.attackRange, t)} ·{" "}
        {adversary.attackDamage}{" "}
        {optionLabel(dhDamageTypes, adversary.attackType, t)}
      </p>
      {experiences.length > 0 && (
        <p>
          <span className="font-semibold">
            {t("dhAdversaries.statBlock.experiences")}:
          </span>{" "}
          {experiences
            .map(
              (experience) =>
                `${experience.name} ${formatBonus(experience.bonus)}`
            )
            .join(", ")}
        </p>
      )}
      {features.length > 0 && (
        <section className="border-t border-gray-200 pt-2">
          <p className="mb-1 font-semibold uppercase">
            {t("dhAdversaries.statBlock.features")}
          </p>
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature.id}>
                <StatBlockFeatureLine feature={feature} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </StatBlockView>
  );
}
