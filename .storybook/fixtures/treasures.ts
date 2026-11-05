import type Treasure from "@/app/lib/definitions/interfaces/treasure/Treasure";

import { portrait } from "./images";

/** Story fixtures; invented prose (CLAUDE.md, 2026-10-15). */
export const saltCrown: Treasure = {
  id: 1,
  name: "Corona di sale",
  description: "<p>Un diadema di cristalli di sale, pesante e freddo.</p>",
  category: 1,
  value: 1,
  image: portrait,
};

export const brassCompass: Treasure = {
  id: 2,
  name: "Bussola d'ottone",
  description: null,
  category: 2,
  value: null,
  image: null,
};

export const treasures: Treasure[] = [saltCrown, brassCompass];
