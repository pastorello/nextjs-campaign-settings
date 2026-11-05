// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { getLocale, getTranslations, setStoryLocale } from "./nextIntlServer";

// `vitest.setup.ts` replaces next-intl with a key-echoing stub for component
// tests; this mock is built on the real `createTranslator`.
vi.unmock("next-intl");

describe("Storybook's next-intl/server", () => {
  afterEach(() => setStoryLocale("it"));

  it("translates from the shipped catalogues, Italian by default", async () => {
    const t = await getTranslations("common.brand");
    expect(t("name")).toBe("Campaign Settings");
    const form = await getTranslations("spells.form");
    expect(form("createTitle")).toBe("Crea nuovo incantesimo");
  });

  it("follows the locale the toolbar picked", async () => {
    setStoryLocale("en");
    expect(await getLocale()).toBe("en");
    const form = await getTranslations("spells.form");
    expect(form("createTitle")).not.toBe("Crea nuovo incantesimo");
  });

  it("takes an explicit locale and a namespace as an object", async () => {
    const t = await getTranslations({ locale: "en", namespace: "spells.form" });
    const italian = await getTranslations({
      locale: "it",
      namespace: "spells.form",
    });
    expect(t("createTitle")).not.toBe(italian("createTitle"));
  });

  it("translates a full key without a namespace", async () => {
    const t = await getTranslations();
    expect(t("spells.form.createTitle")).toBe("Crea nuovo incantesimo");
  });
});
