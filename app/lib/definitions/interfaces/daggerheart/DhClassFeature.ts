/** One of a class's ordered features (SPEC-021 §6, `dhClassFeature`). */
interface DhClassFeature {
  id: number;
  classId: number;
  position: number;
  name: string;
  /** Formatted text (SPEC-019). */
  text: string;
}

export default DhClassFeature;
