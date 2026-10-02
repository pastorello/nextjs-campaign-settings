import type { ChallengeRating } from "@/app/lib/config/dnd5e/challengeRatings";

/*
 * 5e's encounter maths (SPEC-031 §7), as data, restated from
 * `docs/domain/5e-encounters.md`, which was read from the SRD 5.2.1 text.
 * SRD material, CC-BY-4.0; the attribution statement is in `NOTICE.md`.
 * The numbers are the game's, not authored — as `dhBattlePoints.ts` holds
 * Daggerheart's.
 */

/**
 * The XP a creature is worth for its challenge rating (`5e-encounters.md`
 * §1). CR 0 is `null`: the SRD gives "0 or 10" and leaves it to each
 * creature's statistics, so a CR 0 row's XP is typed, never filled.
 */
export const XP_BY_CHALLENGE_RATING: Record<ChallengeRating, number | null> = {
  "0": null,
  "1/8": 25,
  "1/4": 50,
  "1/2": 100,
  "1": 200,
  "2": 450,
  "3": 700,
  "4": 1_100,
  "5": 1_800,
  "6": 2_300,
  "7": 2_900,
  "8": 3_900,
  "9": 5_000,
  "10": 5_900,
  "11": 7_200,
  "12": 8_400,
  "13": 10_000,
  "14": 11_500,
  "15": 13_000,
  "16": 15_000,
  "17": 18_000,
  "18": 20_000,
  "19": 22_000,
  "20": 25_000,
  "21": 33_000,
  "22": 41_000,
  "23": 50_000,
  "24": 62_000,
  "25": 75_000,
  "26": 90_000,
  "27": 105_000,
  "28": 120_000,
  "29": 135_000,
  "30": 155_000,
};
