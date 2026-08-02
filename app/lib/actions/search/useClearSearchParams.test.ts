import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useClearSearchParams } from "./useClearSearchParams";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard/spells",
}));

describe("useClearSearchParams", () => {
  it("replaces the current path, dropping any search params", () => {
    const { result } = renderHook(() => useClearSearchParams());

    result.current();

    expect(replace).toHaveBeenCalledWith("/dashboard/spells");
  });
});
