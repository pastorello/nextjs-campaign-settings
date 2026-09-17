import { describe, expect, it } from "vitest";

import en from "@/messages/en.json";
import it_ from "@/messages/it.json";
import { FIELD_ERROR_KEYS } from "./FieldErrorKey";

const placeholders = (message: string) =>
  [...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe("FIELD_ERROR_KEYS (TD-124)", () => {
  it.each([
    ["it", it_.common.fieldErrors],
    ["en", en.common.fieldErrors],
  ] as const)(
    "matches common.fieldErrors in %s exactly — no key without copy, no copy without a key",
    (_locale, catalogue) => {
      expect(Object.keys(catalogue).sort()).toEqual(
        [...FIELD_ERROR_KEYS].sort()
      );
    }
  );

  it("interpolates the same parameters in both locales", () => {
    const itMessages: Record<string, string> = it_.common.fieldErrors;
    const enMessages: Record<string, string> = en.common.fieldErrors;

    for (const key of FIELD_ERROR_KEYS) {
      expect(placeholders(itMessages[key] ?? ""), key).toEqual(
        placeholders(enMessages[key] ?? "")
      );
    }
  });
});
