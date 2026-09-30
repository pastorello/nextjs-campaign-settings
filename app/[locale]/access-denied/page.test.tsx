import { describe, expect, it, vi } from "vitest";

const forbidden = vi.fn(() => {
  throw new Error("NEXT_HTTP_ERROR_FALLBACK;403");
});
vi.mock("next/navigation", () => ({ forbidden: () => forbidden() }));

import AccessDenied from "./page";

describe("AccessDenied (SPEC-022 T1)", () => {
  it("answers with forbidden(), so nothing but the 403 page renders", () => {
    expect(() => AccessDenied()).toThrow("403");
    expect(forbidden).toHaveBeenCalled();
  });
});
