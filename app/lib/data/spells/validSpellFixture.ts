import Spell from "@/app/lib/definitions/interfaces/spells/Spell";
import firstOptionValue from "@/app/lib/config/firstOptionValue";
import levels from "@/app/lib/config/spells/levels";
import subclasses from "@/app/lib/config/spells/subclasses";
import classes from "@/app/lib/config/spells/classes";

/**
 * A fully valid Spell payload for createSpell/updateSpell tests (TD-122).
 * `id: 0` is the create-time placeholder; updateSpell.test.ts overrides it.
 */
const validSpellFixture: Spell = {
  id: 0,
  name: "Aiuto",
  description: "Bolsters allies' resolve.",
  level: firstOptionValue(levels),
  circle: [firstOptionValue(subclasses)],
  classes: [firstOptionValue(classes)],
  castingTime: "1Azione",
  range: "30",
  components: "V,S,M",
  duration: "8 ore",
  savingThrow: "",
  ritual: false,
  concentration: false,
  upcast: "",
};

export default validSpellFixture;
