import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let params: Record<string, string> = {};
vi.mock("next/navigation", () => ({ useParams: () => params }));

import useGameSystem from "./useGameSystem";

describe("useGameSystem", () => {
  it("returns the system from the route params", () => {
    params = { locale: "en", system: "dnd5e" };
    const { result } = renderHook(() => useGameSystem());
    expect(result.current).toBe("dnd5e");
  });

  it.each([{}, { system: "foo" }])(
    "throws outside a valid [system] segment (%o)",
    (value) => {
      params = value;
      expect(() => renderHook(() => useGameSystem())).toThrow(/\[system\]/);
    }
  );
});
