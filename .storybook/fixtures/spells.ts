import type Spell from "@/app/lib/definitions/interfaces/spells/Spell";

/**
 * Story fixtures. The prose is invented for this repo, never rulebook or SRD
 * text (CLAUDE.md, 2026-10-15; `docs/domain/licensing.md` §6).
 */
export const frostBlade: Spell = {
  id: 1,
  name: "Lama di brina",
  level: 2,
  circle: [],
  classes: [],
  castingTime: "1 azione",
  range: "Contatto",
  components: "V, S",
  duration: "1 minuto",
  savingThrow: "",
  ritual: false,
  concentration: true,
  description:
    "<p>Un velo di ghiaccio ricopre l'arma che tocchi. Finché l'incantesimo dura, i colpi lasciano una scia di brina che rallenta chi la attraversa.</p>",
  upcast:
    "<p>Il velo resiste un minuto in più per ogni livello oltre il 2°.</p>",
};

export const lanternOfTheLost: Spell = {
  id: 2,
  name: "Lanterna dei dispersi",
  level: 0,
  circle: [],
  classes: [],
  castingTime: "1 azione bonus",
  range: "9 metri",
  components: "V",
  duration: "1 ora",
  savingThrow: "",
  ritual: true,
  concentration: false,
  description:
    "<p>Una luce fioca indica la direzione dell'ultima persona che ti ha chiamato per nome.</p>",
  upcast: "",
};

export const spells: Spell[] = [frostBlade, lanternOfTheLost];
