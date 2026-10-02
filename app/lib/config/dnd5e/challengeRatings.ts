import SelectOption from "@/app/lib/definitions/types/SelectOption";

/**
 * A 5e creature's challenge ratings, lowest first (SPEC-031 §5.A.3;
 * `5e-encounters.md` §1): 0, the three fractions, then 1 to 30. Stored as
 * the text the DM reads, so "1/8" is `"1/8"`. The `challengeRating` CHECK
 * in the migration is the same list, and `spec031EncounterSchema.test.ts`
 * keeps the two from drifting.
 */
// Spelled out, not generated, so `ChallengeRating` is the 34 literals and
// not `string`.
export const CHALLENGE_RATINGS = [
  "0",
  "1/8",
  "1/4",
  "1/2",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
] as const;

export type ChallengeRating = (typeof CHALLENGE_RATINGS)[number];

export function isChallengeRating(value: unknown): value is ChallengeRating {
  return (CHALLENGE_RATINGS as readonly unknown[]).includes(value);
}

/** The ratings as select options; a fraction's key spells "/" as "_". */
const challengeRatings: SelectOption<string>[] = CHALLENGE_RATINGS.map(
  (rating) => ({
    value: rating,
    labelKey: `dnd5e.challengeRatings.cr${rating.replace("/", "_")}`,
  })
);

export default challengeRatings;
