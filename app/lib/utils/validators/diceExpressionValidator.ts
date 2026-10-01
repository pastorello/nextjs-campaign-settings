import { z } from "zod";

import type FieldErrorKey from "@/app/lib/definitions/types/FieldErrorKey";

/** The dice Daggerheart rolls (SPEC-028 §9 decision 5). */
export const DH_DICE = [4, 6, 8, 10, 12, 20] as const;

/**
 * `NdS`, `dS`, either with `+k` or `-k`, or a flat number — spaces ignored,
 * `D` read as `d`. `N` ≥ 1 when written; `S` is checked against `DH_DICE`
 * after the match, so the pattern stays readable.
 */
const DICE_PATTERN = /^(?:(\d*)d(\d+)(?:([+-])(\d+))?|(\d+))$/;

/** Whether `raw` is a damage expression this app stores. */
export function isDiceExpression(raw: string): boolean {
  const match = DICE_PATTERN.exec(raw);
  if (!match) return false;
  const [, count, sides] = match;
  if (sides === undefined) return true;
  if (count !== undefined && count !== "" && Number(count) < 1) return false;
  return (DH_DICE as readonly number[]).includes(Number(sides));
}

/**
 * A damage expression (SPEC-028 §5): `2d8+3`, `d12`, `6`. Normalised
 * before it is checked and stored — spaces dropped, lower case — so
 * `2D8 + 3` is kept as `2d8+3`. Anything else is refused with
 * `diceExpression`, whose message lists the accepted forms.
 */
export default function diceExpressionValidator() {
  return z
    .string()
    .transform((raw) => raw.replace(/\s+/g, "").toLowerCase())
    .refine(isDiceExpression, {
      message: "diceExpression" satisfies FieldErrorKey,
    });
}
