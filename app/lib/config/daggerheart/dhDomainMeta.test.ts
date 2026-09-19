import { describe, expect, it } from "vitest";

import DhDomainColour from "@/app/lib/definitions/enums/daggerheart/DhDomainColour";
import PageType from "@/app/lib/definitions/types/PageType";
import pagesConfig from "../pagesConfig";
import { describePageMetaInvariants } from "../pageMetaInvariants.testkit";
import dhDomainCardMeta from "./dhDomainCardMeta";
import dhDomainColours, { dhDomainColourOf } from "./dhDomainColours";
import dhDomainMeta from "./dhDomainMeta";
import dhOriginMeta from "./dhOriginMeta";

describePageMetaInvariants("dhDomainMeta", dhDomainMeta);
describePageMetaInvariants("dhDomainCardMeta", dhDomainCardMeta);
describePageMetaInvariants("dhOriginMeta", { origin: dhOriginMeta });

describe("Daggerheart pages (SPEC-021 T2/T3)", () => {
  it("exist under daggerheart only", () => {
    expect(pagesConfig[PageType.DhDomain].system).toBe("daggerheart");
    expect(pagesConfig[PageType.DhDomainCard].system).toBe("daggerheart");
  });

  it("give a domain its emblem through the shared image field", () => {
    expect(pagesConfig[PageType.DhDomain].fields).toContain("imageId");
  });

  it("default the origin to homebrew", () => {
    expect(dhOriginMeta.defaultValue).toBe("homebrew");
  });
});

describe("the domain colour palette (SPEC-021 T2)", () => {
  it("has one entry per colour key, and only those", () => {
    expect(dhDomainColours.map((entry) => entry.value).sort()).toEqual(
      Object.values(DhDomainColour).sort()
    );
  });

  // The contrast itself was measured when the shades were picked (see the
  // table in `dhDomainColours.ts`); this pins the shape that measurement
  // relied on — white text on a 700 or 800 step — so a lighter shade cannot
  // slip in unmeasured.
  it.each(dhDomainColours)(
    "$value draws white text on a dark band",
    ({ bandClass, borderClass }) => {
      expect(bandClass).toMatch(/^bg-[a-z]+-(700|800) text-white$/);
      expect(borderClass).toMatch(/^border-[a-z]+-(700|800)$/);
    }
  );

  it("accepts a palette key and refuses free colour", () => {
    expect(dhDomainMeta.colour.validator.safeParse("teal").success).toBe(true);
    expect(dhDomainMeta.colour.validator.safeParse("#008080").success).toBe(
      false
    );
  });

  it("falls back to a palette entry for a key no longer in it", () => {
    expect(dhDomainColourOf("chartreuse")).toBe(dhDomainColours[0]);
    expect(dhDomainColourOf("sky").value).toBe(DhDomainColour.Sky);
  });
});

describe("dhDomainCardMeta (SPEC-021 T3)", () => {
  it("allows levels 1 to 10 and nothing else", () => {
    const { validator } = dhDomainCardMeta.cardLevel;
    expect(validator.safeParse(1).success).toBe(true);
    expect(validator.safeParse(10).success).toBe(true);
    expect(validator.safeParse(0).success).toBe(false);
    expect(validator.safeParse(11).success).toBe(false);
  });

  it("allows a recall cost of zero but not below", () => {
    const { validator } = dhDomainCardMeta.recallCost;
    expect(validator.safeParse(0).success).toBe(true);
    expect(validator.safeParse("3").success).toBe(true);
    expect(validator.safeParse(-1).success).toBe(false);
  });

  it("requires feature text with words in it", () => {
    const { validator } = dhDomainCardMeta.featureText;
    expect(validator.safeParse("<p>Words.</p>").success).toBe(true);
    expect(validator.safeParse("<p></p>").success).toBe(false);
    expect(validator.safeParse("").success).toBe(false);
  });

  it("takes its domain options from the domain table", () => {
    expect(dhDomainCardMeta.domainId.optionTable).toBe("dhDomain");
  });
});
