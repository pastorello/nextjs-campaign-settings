import { describe, expect, it, vi } from "vitest";

import enMessages from "@/messages/en.json";
import itMessages from "@/messages/it.json";

/**
 * `WorldMap`'s own tests mock `next-intl` (`vitest.setup.ts`) so its
 * `positionPlaceSublabel` assertions only see the message key, never the
 * rendered text — that mock is what let TD-79 add a `blocked` parameter to
 * `geography.unpositionedCount` without touching any of those call sites.
 * This file exists to test the one thing that mock hides: that the ICU
 * message itself (two `plural` blocks back to back) is valid and renders
 * the right text in both catalogues and both parameters' edge cases.
 */
describe("geography.unpositionedCount (TD-79)", () => {
  it.each([
    { locale: "en", messages: enMessages, zero: "Every place is positioned" },
    {
      locale: "it",
      messages: itMessages,
      zero: "Tutti i luoghi sono posizionati",
    },
  ])(
    "renders unchanged when nothing is blocked ($locale)",
    async ({ locale, messages, zero }) => {
      const { createTranslator } =
        await vi.importActual<typeof import("next-intl")>("next-intl");
      const t = createTranslator({ locale, messages });

      expect(t("geography.unpositionedCount", { count: 0, blocked: 0 })).toBe(
        zero
      );
      expect(
        t("geography.unpositionedCount", { count: 3, blocked: 0 })
      ).not.toMatch(/blocked|bloccat/i);
    }
  );

  it("appends a singular blocked clause in English", async () => {
    const { createTranslator } =
      await vi.importActual<typeof import("next-intl")>("next-intl");
    const t = createTranslator({ locale: "en", messages: enMessages });

    expect(t("geography.unpositionedCount", { count: 3, blocked: 1 })).toBe(
      "3 places not yet positioned (1 blocked on a parent's map)"
    );
  });

  it("appends a plural blocked clause in English", async () => {
    const { createTranslator } =
      await vi.importActual<typeof import("next-intl")>("next-intl");
    const t = createTranslator({ locale: "en", messages: enMessages });

    expect(t("geography.unpositionedCount", { count: 3, blocked: 2 })).toBe(
      "3 places not yet positioned (2 blocked on a parent's map)"
    );
  });

  it("appends the blocked clause in Italian too", async () => {
    const { createTranslator } =
      await vi.importActual<typeof import("next-intl")>("next-intl");
    const t = createTranslator({ locale: "it", messages: itMessages });

    expect(t("geography.unpositionedCount", { count: 3, blocked: 1 })).toBe(
      "3 luoghi non ancora posizionati (1 bloccato dalla mappa di un genitore)"
    );
  });
});
