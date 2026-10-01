/**
 * One of an adversary's ordered features (SPEC-028 §6). `kind` is a
 * `DhFeatureKind`; `fear` marks a Fear feature.
 */
interface DhAdversaryFeature {
  id: number;
  adversaryId: number;
  position: number;
  kind: string;
  fear: boolean;
  name: string;
  /** Formatted text (SPEC-019). */
  text: string;
}

export default DhAdversaryFeature;
