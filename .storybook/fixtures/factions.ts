import type Faction from "@/app/lib/definitions/interfaces/faction/Faction";
import type { RosterMember } from "@/app/lib/data/faction/fetchFactionRosters";

import { portrait } from "./images";

/** Story fixtures; invented prose (CLAUDE.md, 2026-10-15). */
export const mapmakers: Faction = {
  id: 1,
  name: "Gilda dei Cartografi",
  description:
    "<p>Una rete di disegnatori che vende rotte, e a volte le inventa.</p>",
  image: portrait,
};

export const lampLighters: Faction = {
  id: 2,
  name: "Accenditori di lanterne",
  description: "<p>Tengono accese le strade del porto dopo il tramonto.</p>",
  image: null,
};

export const factions: Faction[] = [mapmakers, lampLighters];

export const mapmakersRoster: RosterMember[] = [
  { id: 1, name: "Aldric Valmonte" },
  { id: 2, name: "Mira Tessalon" },
];

export const rosters = new Map<number, RosterMember[]>([[1, mapmakersRoster]]);
