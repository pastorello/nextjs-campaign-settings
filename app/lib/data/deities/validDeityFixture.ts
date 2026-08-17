import Deity from "@/app/lib/definitions/interfaces/deities/Deity";
import firstOptionValue from "@/app/lib/config/firstOptionValue";
import magicColors from "@/app/lib/config/deity/magicColors";
import deityTypes from "@/app/lib/config/deity/deityTypes";
import deityLevels from "@/app/lib/config/deity/deityLevels";
import tarotCards from "@/app/lib/config/deity/tarotCards";
import celestialBodies from "@/app/lib/config/geography/celestialBodies";
import energyElements from "@/app/lib/config/deity/energyElements";
import subclasses from "@/app/lib/config/spells/subclasses";
import traditionTypes from "@/app/lib/config/deity/traditionTypes";
import alignments from "@/app/lib/config/npc/alignments";
import alignmentDomains from "@/app/lib/config/npc/alignmentDomains";
import Holidays from "@/app/lib/definitions/enums/deities/Holidays";
import TarotMeaning from "@/app/lib/definitions/enums/tarot/TarotMeaning";

/**
 * A fully valid Deity payload for createDeity/updateDeity tests — shared so
 * that neither file has to carry the ten option-list imports it takes to
 * satisfy every select field. `id: 0` is the create-time placeholder;
 * updateDeity.test.ts overrides it.
 */
const validDeityFixture: Deity = {
  id: 0,
  name: "Gruumsh",
  deityTitle: "One-Eye",
  deityType: firstOptionValue(deityTypes),
  deityRank: firstOptionValue(deityLevels),
  tarotCard: firstOptionValue(tarotCards),
  celestialBody: firstOptionValue(celestialBodies),
  element: firstOptionValue(energyElements),
  class: firstOptionValue(subclasses),
  holidays: Holidays.Nessuna,
  color: firstOptionValue(magicColors),
  tradition: firstOptionValue(traditionTypes),
  alignment: firstOptionValue(alignments),
  alignmentDomain: firstOptionValue(alignmentDomains),
  meaning: TarotMeaning.Follia,
};

export default validDeityFixture;
