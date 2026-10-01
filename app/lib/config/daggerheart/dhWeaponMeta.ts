import { z } from "zod";

import firstOptionValue from "../firstOptionValue";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";
import PageMeta from "@/app/lib/definitions/interfaces/meta/PageMeta";
import DhDamageType from "@/app/lib/definitions/enums/daggerheart/DhDamageType";
import DhRange from "@/app/lib/definitions/enums/daggerheart/DhRange";
import DhSpellcastTrait from "@/app/lib/definitions/enums/daggerheart/DhSpellcastTrait";
import DhWeaponMetaField from "@/app/lib/definitions/enums/daggerheart/DhWeaponMetaField";
import DhWeaponSlot from "@/app/lib/definitions/enums/daggerheart/DhWeaponSlot";
import optionValueValidator from "@/app/lib/utils/validators/optionValueValidator";

import dhBurdens from "./dhBurdens";
import dhDamageDice from "./dhDamageDice";
import dhDamageTypes from "./dhDamageTypes";
import {
  optionalFeatureName,
  optionalFeatureText,
} from "./dhOptionalFeatureFields";
import dhRanges from "./dhRanges";
import dhTraits from "./dhTraits";
import dhWeaponSlots from "./dhWeaponSlots";

/**
 * A Daggerheart weapon (SPEC-029 §5). `name`, `imageId`, `origin` and
 * `tier` are shared declarations in `pageMetaFields`. The damage is a die
 * and a flat bonus: the number of dice is the wielder's Proficiency.
 */
const dhWeaponMeta = {
  [DhWeaponMetaField.slot]: {
    metaField: DhWeaponMetaField.slot,
    labelKey: "dhWeapons.fields.slot.label",
    defaultValue: firstOptionValue(dhWeaponSlots),
    fieldType: FieldType.string,
    options: dhWeaponSlots,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhWeaponSlot),
  },
  [DhWeaponMetaField.trait]: {
    metaField: DhWeaponMetaField.trait,
    labelKey: "dhWeapons.fields.trait.label",
    defaultValue: firstOptionValue(dhTraits),
    fieldType: FieldType.string,
    options: dhTraits,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhSpellcastTrait),
  },
  [DhWeaponMetaField.range]: {
    metaField: DhWeaponMetaField.range,
    labelKey: "dhWeapons.fields.range.label",
    defaultValue: firstOptionValue(dhRanges),
    fieldType: FieldType.string,
    options: dhRanges,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhRange),
  },
  [DhWeaponMetaField.damageDie]: {
    metaField: DhWeaponMetaField.damageDie,
    labelKey: "dhWeapons.fields.damageDie.label",
    defaultValue: firstOptionValue(dhDamageDice),
    fieldType: FieldType.integer,
    options: dhDamageDice,
    controlType: ControlType.Select,
    validator: optionValueValidator(dhDamageDice),
  },
  [DhWeaponMetaField.damageBonus]: {
    metaField: DhWeaponMetaField.damageBonus,
    labelKey: "dhWeapons.fields.damageBonus.label",
    defaultValue: 0,
    fieldType: FieldType.integer,
    controlType: ControlType.Text,
    validator: z.coerce.number().int().min(0),
    getDatum: (datum: number) => datum,
  },
  [DhWeaponMetaField.damageType]: {
    metaField: DhWeaponMetaField.damageType,
    labelKey: "dhWeapons.fields.damageType.label",
    defaultValue: firstOptionValue(dhDamageTypes),
    fieldType: FieldType.string,
    options: dhDamageTypes,
    controlType: ControlType.Select,
    validator: z.nativeEnum(DhDamageType),
  },
  [DhWeaponMetaField.burden]: {
    metaField: DhWeaponMetaField.burden,
    labelKey: "dhWeapons.fields.burden.label",
    defaultValue: firstOptionValue(dhBurdens),
    fieldType: FieldType.integer,
    options: dhBurdens,
    controlType: ControlType.Select,
    validator: optionValueValidator(dhBurdens),
  },
  [DhWeaponMetaField.featureName]: optionalFeatureName(
    "dhEquipment.fields.featureName.label",
    DhWeaponMetaField.featureName
  ),
  [DhWeaponMetaField.featureText]: optionalFeatureText(
    "dhEquipment.fields.featureText.label",
    DhWeaponMetaField.featureText
  ),
} satisfies Record<string, PageMeta>;

export default dhWeaponMeta;
