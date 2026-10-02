import { describe, expect, it } from "vitest";

import followChallengeRating from "./followChallengeRating";

describe("followChallengeRating (SPEC-031 §5.A.3)", () => {
  it("fills a blank XP from the CR", () => {
    expect(followChallengeRating("", "", "2")).toBe("450");
  });

  it("follows the CR while the XP is still the previous CR's", () => {
    expect(followChallengeRating("450", "2", "3")).toBe("700");
    expect(followChallengeRating(" 450 ", "2", "1/4")).toBe("50");
  });

  it("keeps an XP the DM typed", () => {
    expect(followChallengeRating("300", "2", "3")).toBe("300");
    expect(followChallengeRating("300", "", "3")).toBe("300");
  });

  it("clears an untouched XP when the CR is removed or set to 0", () => {
    expect(followChallengeRating("450", "2", "")).toBe("");
    expect(followChallengeRating("450", "2", "0")).toBe("");
  });

  it("leaves a typed XP on a CR 0 row alone", () => {
    expect(followChallengeRating("10", "0", "1/8")).toBe("10");
  });
});
