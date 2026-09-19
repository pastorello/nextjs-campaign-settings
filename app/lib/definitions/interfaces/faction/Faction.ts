interface Faction {
  id: number;
  name: string;
  description: string;
  /** A `recordImage` id, or `null` for none (SPEC-020 T3). */
  imageId?: number | null;
}

export default Faction;
