import type NpcItem from "@/app/lib/definitions/interfaces/npc/NpcItem";
import type DerivedPlacement from "@/app/lib/definitions/interfaces/maps/DerivedPlacement";
import type OptionBundle from "@/app/lib/definitions/types/OptionBundle";

import { portrait } from "./images";

/** Story fixtures; invented prose (CLAUDE.md, 2026-10-15). */
export const aldric: NpcItem = {
  id: 1,
  name: "Aldric Valmonte",
  description:
    "<p>Un cartografo che ha perso più mappe di quante ne abbia disegnate.</p>",
  title: "Il Cartografo",
  alignment: 1,
  alignmentDomain: 1,
  position: "Capo della gilda",
  faction: 1,
  appearance: "Un uomo alto, con le dita macchiate d'inchiostro",
  personality: "Paziente, ironico, diffidente con gli estranei",
  motivations: "Ritrovare la mappa del Passo Spezzato",
  secrets: "",
  image: portrait,
};

export const mira: NpcItem = {
  ...aldric,
  id: 2,
  name: "Mira Tessalon",
  title: "",
  position: "Locandiera",
  faction: null,
  appearance: "Bassa, sempre con un grembiule di lana",
  image: null,
};

export const npcs: NpcItem[] = [aldric, mira];

export const npcPlacements: Record<number, DerivedPlacement> = {
  1: { place: "Taverna del Corvo", plane: null, zoneId: 5, poiId: 9 },
};

export const factionOptions: OptionBundle = {
  faction: [{ label: "Gilda dei Cartografi", value: 1 }],
};
