/**
 * One of an environment's ordered features (SPEC-028 §6). `kind` is a
 * `DhFeatureKind`; `questions` are optional prompt questions.
 */
interface DhEnvironmentFeature {
  id: number;
  environmentId: number;
  position: number;
  kind: string;
  name: string;
  /** Formatted text (SPEC-019). */
  text: string;
  /** Formatted text, or none. */
  questions: string | null;
}

export default DhEnvironmentFeature;
