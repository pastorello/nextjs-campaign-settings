import { describe, expect, it } from "vitest";

import { MOON_PHASES } from "@/app/lib/calendar/MoonPhase";
import { ZODIAC_SIGNS } from "@/app/lib/calendar/ZodiacSign";
import en from "@/messages/en.json";
import it_ from "@/messages/it.json";

/*
 * The month grid draws each moon phase and zodiac sign as a glyph, hidden
 * from screen readers, beside its words from `calendar.moonPhases.*` /
 * `calendar.zodiacSigns.*` (SPEC-014 T9). The key is built at runtime, so
 * no compiler catches a phase or sign without words: this does.
 */
describe("the month grid's glyph labels (SPEC-014 T9)", () => {
  for (const [locale, messages] of [
    ["it", it_],
    ["en", en],
  ] as const) {
    it(`names every moon phase and zodiac sign in ${locale}`, () => {
      const phases: Record<string, string> = messages.calendar.moonPhases;
      const signs: Record<string, string> = messages.calendar.zodiacSigns;

      for (const phase of MOON_PHASES) expect(phases[phase]).toBeTruthy();
      for (const sign of ZODIAC_SIGNS) expect(signs[sign]).toBeTruthy();
    });
  }
});
