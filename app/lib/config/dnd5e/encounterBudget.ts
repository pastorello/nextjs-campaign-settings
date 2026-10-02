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

/** The XP a character adds to each grade's budget, at one party level. */
export interface XpBudget {
  low: number;
  moderate: number;
  high: number;
}

/** The levels the budget table covers; a target level outside is clamped. */
export const BUDGET_LEVEL_MIN = 1;
export const BUDGET_LEVEL_MAX = 20;

/**
 * The XP budget per character, levels 1–20 (`5e-encounters.md` §2), index
 * 0 for level 1. The Italian SRD names the grades Facile, Media, Difficile.
 */
export const XP_BUDGET_PER_CHARACTER: readonly XpBudget[] = [
  { low: 50, moderate: 75, high: 100 },
  { low: 100, moderate: 150, high: 200 },
  { low: 150, moderate: 225, high: 400 },
  { low: 250, moderate: 375, high: 500 },
  { low: 500, moderate: 750, high: 1_100 },
  { low: 600, moderate: 1_000, high: 1_400 },
  { low: 750, moderate: 1_300, high: 1_700 },
  { low: 1_000, moderate: 1_700, high: 2_100 },
  { low: 1_300, moderate: 2_000, high: 2_600 },
  { low: 1_600, moderate: 2_300, high: 3_100 },
  { low: 1_900, moderate: 2_900, high: 4_100 },
  { low: 2_200, moderate: 3_700, high: 4_700 },
  { low: 2_600, moderate: 4_200, high: 5_400 },
  { low: 2_900, moderate: 4_900, high: 6_200 },
  { low: 3_300, moderate: 5_400, high: 7_800 },
  { low: 3_800, moderate: 6_100, high: 9_800 },
  { low: 4_500, moderate: 7_200, high: 11_700 },
  { low: 5_000, moderate: 8_700, high: 14_200 },
  { low: 5_500, moderate: 10_700, high: 17_200 },
  { low: 6_400, moderate: 13_200, high: 22_000 },
];
