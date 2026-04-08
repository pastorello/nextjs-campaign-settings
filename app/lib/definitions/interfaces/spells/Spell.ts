import SpellMetaField from "../../enums/spells/SpellMetaField";

interface Spell {
  id: number;
  [SpellMetaField.nome]: string;
  [SpellMetaField.livello]: number;
  [SpellMetaField.circolo]: number[];
  [SpellMetaField.classi]: number[];
  [SpellMetaField.sottoClassi]: number[];
  [SpellMetaField.tempoDiLancio]: string;
  [SpellMetaField.gittata]: string;
  [SpellMetaField.componenti]: string;
  [SpellMetaField.durata]: string;
  [SpellMetaField.tiroSalvezza]: string;
  [SpellMetaField.rituale]: boolean;
  [SpellMetaField.concentrazione]: boolean;
  [SpellMetaField.descrizione]: string;
  [SpellMetaField.intensificato]: string;
}

export default Spell;
