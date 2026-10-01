import { useTranslations } from "next-intl";

import dhBurdens from "@/app/lib/config/daggerheart/dhBurdens";
import dhDamageTypes from "@/app/lib/config/daggerheart/dhDamageTypes";
import dhRanges from "@/app/lib/config/daggerheart/dhRanges";
import dhTraits from "@/app/lib/config/daggerheart/dhTraits";
import dhWeaponSlots from "@/app/lib/config/daggerheart/dhWeaponSlots";
import DhWeapon from "@/app/lib/definitions/interfaces/daggerheart/DhWeapon";
import optionLabel from "@/app/ui/daggerheart/optionLabel";
import EquipmentFeature from "@/app/ui/daggerheart/EquipmentFeature";
import StatBlockView, {
  StatBlockNumber,
} from "@/app/ui/daggerheart/StatBlockView";

/**
 * A weapon as a card (SPEC-029 §5): tier and slot on the band, then trait,
 * range, damage and burden, and its feature. The damage is the die and the
 * bonus (`d8+2`): the dice count is the wielder's Proficiency.
 */
export default function DhWeaponCard({
  weapon,
  headingLevel,
}: {
  weapon: DhWeapon;
  headingLevel?: "h2" | "h3" | "h4";
}) {
  const t = useTranslations();
  const damage = `d${weapon.damageDie}${weapon.damageBonus > 0 ? `+${weapon.damageBonus}` : ""}`;

  return (
    <StatBlockView
      name={weapon.name}
      headerLine={t("dhWeapons.card.header", {
        tier: weapon.tier,
        slot: optionLabel(dhWeaponSlots, weapon.weaponSlot, t),
      })}
      image={weapon.image}
      imageAlt={t("dhWeapons.card.imageAlt", { name: weapon.name })}
      testId="dh-weapon-card"
      {...(headingLevel && { headingLevel })}
    >
      <dl className="flex flex-wrap gap-x-6 gap-y-2">
        <StatBlockNumber
          label={t("dhWeapons.fields.trait.label")}
          value={optionLabel(dhTraits, weapon.weaponTrait, t)}
        />
        <StatBlockNumber
          label={t("dhWeapons.fields.range.label")}
          value={optionLabel(dhRanges, weapon.weaponRange, t)}
        />
        <StatBlockNumber
          label={t("dhWeapons.card.damage")}
          value={`${damage} ${optionLabel(dhDamageTypes, weapon.weaponDamageType, t)}`}
        />
        <StatBlockNumber
          label={t("dhWeapons.fields.burden.label")}
          value={optionLabel(dhBurdens, weapon.burden, t)}
        />
      </dl>
      <EquipmentFeature
        name={weapon.weaponFeatureName}
        text={weapon.weaponFeatureText}
      />
    </StatBlockView>
  );
}
