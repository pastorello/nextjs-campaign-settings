import { describe, expect, it } from "vitest";

import getCSSClasses from "./getCSSClasses";
import ButtonVariant from "./ButtonVariant";
import ButtonSize from "./ButtonSize";
import ButtonState from "./ButtonState";

describe("getCSSClasses", () => {
  it("defaults to the default state (no extra state classes)", () => {
    const { stateClasses } = getCSSClasses(
      ButtonVariant.primary,
      ButtonSize.medium
    );
    expect(stateClasses).toBe("");
  });

  it("maps ButtonState.Active to each variant's selected look", () => {
    const cases: Array<[ButtonVariant, string]> = [
      [ButtonVariant.primary, "bg-violet-700"],
      [ButtonVariant.secondary, "bg-zinc-600 text-white"],
      [ButtonVariant.danger, "bg-rose-700"],
      [ButtonVariant.neutral, "text-sky-600"],
    ];

    for (const [variant, expected] of cases) {
      const { stateClasses } = getCSSClasses(
        variant,
        ButtonSize.medium,
        ButtonState.Active
      );
      expect(stateClasses).toBe(expected);
    }
  });

  it("maps ButtonState.Loading to the wait cursor", () => {
    const { stateClasses } = getCSSClasses(
      ButtonVariant.primary,
      ButtonSize.medium,
      ButtonState.Loading
    );
    expect(stateClasses).toBe("cursor-wait");
  });

  it("adds no state classes for Disabled — the disabled look comes from the disabled: variants", () => {
    const { base, stateClasses } = getCSSClasses(
      ButtonVariant.primary,
      ButtonSize.medium,
      ButtonState.Disabled
    );
    expect(stateClasses).toBe("");
    expect(base).toContain("disabled:bg-stone-400");
    expect(base).toContain("disabled:cursor-not-allowed");
  });

  it("composes base classes from the variant colour and the size style", () => {
    const { base, sizeClasses } = getCSSClasses(
      ButtonVariant.danger,
      ButtonSize.small
    );
    expect(base).toContain("bg-rose-600");
    expect(base).toContain("px-1 py-px text-sm");
    expect(sizeClasses).toBe("h-[32px]");
  });

  it("falls back to primary / medium for unknown variant or size", () => {
    const { base, sizeClasses } = getCSSClasses(
      "bogus" as ButtonVariant,
      "bogus" as ButtonSize
    );
    expect(base).toContain("bg-violet-600");
    expect(sizeClasses).toBe("h-[40px]");
  });
});
