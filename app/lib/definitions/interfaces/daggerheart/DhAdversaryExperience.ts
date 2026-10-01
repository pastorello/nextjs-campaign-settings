/** One of an adversary's ordered experiences (SPEC-028 §6). */
interface DhAdversaryExperience {
  id: number;
  adversaryId: number;
  position: number;
  name: string;
  bonus: number;
}

export default DhAdversaryExperience;
