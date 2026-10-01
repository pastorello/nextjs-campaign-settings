/**
 * A Daggerheart level's tier (`daggerheart.md` §3): level 1 is tier 1,
 * 2–4 tier 2, 5–7 tier 3, 8–10 tier 4. A level outside 1–10 is clamped:
 * an adventure's target level is free text in 5e's terms (SPEC-013), so a
 * Daggerheart one may hold any number.
 */
export default function tierOfLevel(level: number): 1 | 2 | 3 | 4 {
  if (level <= 1) return 1;
  if (level <= 4) return 2;
  if (level <= 7) return 3;
  return 4;
}
