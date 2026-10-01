/** A modifier as a stat block prints it: `+2`, `0`, `-1`. */
export default function formatBonus(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}
