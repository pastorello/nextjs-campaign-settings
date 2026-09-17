import { describe, expect, it, vi } from "vitest";

import en from "@/messages/en.json";
import it_ from "@/messages/it.json";
import type { AbstractIntlMessages } from "next-intl";
import resolveFieldErrors, {
  resolveFirstFieldError,
  type ValuesTranslator,
} from "./resolveFieldErrors";

// A real translator over the real catalogues — `vitest.setup.ts` mocks
// `next-intl` to echo keys, and this is the one place a key and its ICU
// parameters must actually become text, so the real module is loaded.
const { createTranslator } =
  await vi.importActual<typeof import("next-intl")>("next-intl");

const translatorFor = (
  locale: string,
  messages: AbstractIntlMessages
): ValuesTranslator =>
  // Given a plain `AbstractIntlMessages`, next-intl types the key as
  // `never`. The app's hooks are untyped and already fit `ValuesTranslator`
  // (WorldMap passes one); this assertion only restores that shape here.
  createTranslator({ locale, messages }) as unknown as ValuesTranslator;

describe("resolveFieldErrors (TD-124)", () => {
  it("translates a key with its parameters in Italian", () => {
    const resolved = resolveFieldErrors(
      {
        footprint: [{ key: "areaOverlaps", values: { title: "Kang" } }],
        title: [{ key: "tooShort", values: { minimum: 3 } }],
      },
      translatorFor("it", it_)
    );

    expect(resolved).toEqual({
      footprint: ["Si sovrappone a un'area esistente: Kang."],
      title: ["Deve contenere almeno 3 caratteri."],
    });
  });

  it("translates the same keys in English", () => {
    const resolved = resolveFieldErrors(
      { footprint: [{ key: "areaOverlaps", values: { title: "Kang" } }] },
      translatorFor("en", en)
    );

    expect(resolved).toEqual({
      footprint: ["Overlaps an existing area: Kang."],
    });
  });

  it("leaves out fields with no messages", () => {
    const resolved = resolveFieldErrors(
      { a: undefined, b: [], c: [{ key: "invalid" }] },
      (key) => key
    );

    expect(resolved).toEqual({ c: ["common.fieldErrors.invalid"] });
  });

  it("resolves only the first message for a one-line surface", () => {
    const first = resolveFirstFieldError(
      {
        id: undefined,
        lat: [{ key: "pointInsideArea", values: { title: "Kang" } }],
        lng: [{ key: "invalid" }],
      },
      translatorFor("it", it_)
    );

    expect(first).toBe("Questo punto si trova in un'area esistente: Kang.");
  });

  it("returns undefined when there is nothing to show", () => {
    expect(resolveFirstFieldError({}, (key) => key)).toBeUndefined();
  });
});
