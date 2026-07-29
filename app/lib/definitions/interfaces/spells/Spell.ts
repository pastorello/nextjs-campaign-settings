import SpellMetaField from "../../enums/spells/SpellMetaField";

interface Spell {
  id: number;
  [SpellMetaField.name]: string;
  [SpellMetaField.level]: number;
  [SpellMetaField.circle]: number[];
  [SpellMetaField.classes]: number[];
  [SpellMetaField.castingTime]: string;
  [SpellMetaField.range]: string;
  [SpellMetaField.components]: string;
  [SpellMetaField.duration]: string;
  [SpellMetaField.savingThrow]: string;
  [SpellMetaField.ritual]: boolean;
  [SpellMetaField.concentration]: boolean;
  [SpellMetaField.description]: string;
  [SpellMetaField.upcast]: string;
}

export default Spell;
