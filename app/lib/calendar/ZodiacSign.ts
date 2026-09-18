/**
 * The thirteen astronomical signs, Ophiuchus included (SPEC-014 §5.3), in
 * the traditional order with Ophiuchus between Scorpio and Sagittarius.
 * Identifiers, not display strings: names are UI copy and come from the
 * message catalogues.
 */
export const ZODIAC_SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "ophiuchus",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export default ZodiacSign;
