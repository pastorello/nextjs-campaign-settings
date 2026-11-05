import type MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";

import { portrait } from "./images";

/** Story fixtures; invented prose (CLAUDE.md, 2026-10-15). */
export const sunblade: MagicItem = {
  id: 1,
  name: "Lama dell'alba",
  rarity: 1,
  type: 1,
  attuned: true,
  consumable: false,
  description:
    "<p>Una lama sottile che trattiene il calore del primo mattino. Al buio emana una luce tenue.</p>",
  image: portrait,
};

export const emberVial: MagicItem = {
  id: 2,
  name: "Fiala di brace",
  rarity: 2,
  type: 2,
  attuned: false,
  consumable: true,
  description: "<p>Un sorso di calore che scalda chi lo beve per un'ora.</p>",
  image: null,
};

export const magicItems: MagicItem[] = [sunblade, emberVial];
