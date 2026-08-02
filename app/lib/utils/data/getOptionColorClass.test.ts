import { describe, expect, it } from "vitest";

import getOptionColorClass from "./getOptionColorClass";
import MagicColor from "@/app/lib/definitions/enums/deities/MagicColor";
import { MagicColorObject } from "@/app/lib/config/deity/magicColors";

const options: MagicColorObject[] = [
  {
    value: 1,
    labelKey: "deities.colors.rosso",
    type: MagicColor.Rosso,
    colorClass: "bg-red-500",
  },
  {
    value: 2,
    labelKey: "deities.colors.blu",
    type: MagicColor.Blu,
    colorClass: "bg-blue-500",
  },
];

describe("getOptionColorClass", () => {
  it("returns the colorClass for a matching value", () => {
    expect(getOptionColorClass(options, 1)).toBe("bg-red-500");
  });

  it("returns an empty string when no option matches", () => {
    expect(getOptionColorClass(options, 999)).toBe("");
  });

  it("returns an empty string for an empty options list", () => {
    expect(getOptionColorClass([], 1)).toBe("");
  });
});
