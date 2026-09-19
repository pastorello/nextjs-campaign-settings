import type DhSubclassFeature from "./DhSubclassFeature";

/**
 * A Daggerheart subclass (SPEC-021 §5.5, `dhSubclass`). `spellcastTrait` is
 * `"none"` in the form and the metadata layer, and `null` in the column —
 * see `toStoredSpellcastTrait`.
 */
interface DhSubclass {
  id: number;
  classId: number | null;
  name: string;
  description: string | null;
  spellcastTrait: string;
  origin: string;
  /** Read beside the scalar fields for the inline editor; never written. */
  features?: DhSubclassFeature[];
}

export default DhSubclass;
