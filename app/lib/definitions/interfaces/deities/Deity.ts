import Holidays from "@/app/lib/definitions/enums/deities/Holidays";
import TarotMeaning from "@/app/lib/definitions/enums/tarot/TarotMeaning";
import DeityRank from "@/app/lib/definitions/enums/deities/DeityRank";

import DeityMetaField from "../../enums/deities/DeityMetaField";

interface Deity {
  id: number;
  [DeityMetaField.name]: string;
  [DeityMetaField.deityTitle]: string;
  [DeityMetaField.deityType]: number;
  [DeityMetaField.deityRank]: DeityRank;
  [DeityMetaField.tarotCard]: number;
  [DeityMetaField.celestialBody]: number;
  [DeityMetaField.element]: number;
  [DeityMetaField.deityClass]: number;
  [DeityMetaField.holidays]: Holidays;
  [DeityMetaField.color]: number;
  [DeityMetaField.tradition]: number;
  [DeityMetaField.alignment]: number;
  [DeityMetaField.alignmentDomain]: number;
  [DeityMetaField.meaning]: TarotMeaning;
}

export default Deity;
