import type Deity from "@/app/lib/definitions/interfaces/deities/Deity";
import type DerivedPlacement from "@/app/lib/definitions/interfaces/maps/DerivedPlacement";
import DeityRank from "@/app/lib/definitions/enums/deities/DeityRank";
import Holidays from "@/app/lib/definitions/enums/deities/Holidays";
import TarotMeaning from "@/app/lib/definitions/enums/tarot/TarotMeaning";

import { portrait } from "./images";

/** Story fixtures; invented prose (CLAUDE.md, 2026-10-15). */
export const helios: Deity = {
  id: 1,
  name: "Helios",
  deityTitle: "Il Sole",
  deityType: 1,
  deityRank: DeityRank.Divinità,
  tarotCard: 1,
  celestialBody: 1,
  element: 1,
  class: 1,
  holidays: "" as Holidays,
  color: 1,
  tradition: 1,
  alignment: 1,
  alignmentDomain: 1,
  meaning: "" as TarotMeaning,
  image: portrait,
};

export const selene: Deity = {
  ...helios,
  id: 2,
  name: "Selene",
  deityTitle: "La Veglia",
  tarotCard: 2,
  color: 2,
  image: null,
};

export const deities: Deity[] = [helios, selene];

export const heliosPlacement: DerivedPlacement = {
  place: "Paradiso",
  plane: "Cieli",
  zoneId: 3,
  poiId: null,
};

export const deityPlacements: Record<number, DerivedPlacement> = {
  1: heliosPlacement,
};
