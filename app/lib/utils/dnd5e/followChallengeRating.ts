import type { ChallengeRating } from "@/app/lib/config/dnd5e/challengeRatings";
import { XP_BY_CHALLENGE_RATING } from "@/app/lib/config/dnd5e/encounterBudget";

/** The XP a CR suggests, as the form's text: blank for none, or for CR 0. */
function suggestedXp(rating: ChallengeRating | ""): string {
  if (rating === "") return "";
  const xp = XP_BY_CHALLENGE_RATING[rating];
  return xp === null ? "" : String(xp);
}

/**
 * The creature form's XP after the CR changes from `previous` to `next`
 * (SPEC-031 §5.A.3): the XP follows the CR while it is blank or still the
 * previous CR's value, and a typed XP — a weakened villain — is kept.
 * Works on the form's text, so "typed" means "differs from the
 * suggestion", whatever the DM typed it as.
 */
export default function followChallengeRating(
  xpEach: string,
  previous: ChallengeRating | "",
  next: ChallengeRating | ""
): string {
  const typed = xpEach.trim();
  const untouched = typed === "" || typed === suggestedXp(previous);
  return untouched ? suggestedXp(next) : xpEach;
}
