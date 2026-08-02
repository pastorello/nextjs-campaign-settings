import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useFilterController from "./useFilterController";
import SpellMetaField from "../definitions/enums/spells/SpellMetaField";
import SortOrder from "../definitions/types/SortOrder";

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard/spells",
  useSearchParams: () => searchParams,
}));

describe("useFilterController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it("is inactive with no filter value when the search param is absent", () => {
    const { result } = renderHook(() =>
      useFilterController(SpellMetaField.level)
    );

    expect(result.current.isActive).toBe(false);
    expect(result.current.filterValue).toBeNull();
  });

  it("reports the parsed value and marks itself active when the param is set", () => {
    searchParams = new URLSearchParams({ level: "3" });

    const { result } = renderHook(() =>
      useFilterController(SpellMetaField.level)
    );

    expect(result.current.isActive).toBe(true);
    expect(result.current.filterValue).toBe(3);
  });

  it("defaults sortValue to ascending", () => {
    const { result } = renderHook(() =>
      useFilterController(SpellMetaField.level)
    );

    expect(result.current.sortValue).toBe(SortOrder.asc);
  });

  it("reads sortValue as descending only when sort=desc", () => {
    searchParams = new URLSearchParams({ sort: "desc" });

    const { result } = renderHook(() =>
      useFilterController(SpellMetaField.level)
    );

    expect(result.current.sortValue).toBe(SortOrder.desc);
  });

  it("sets the field's param and resets the page to 1", () => {
    searchParams = new URLSearchParams({ page: "3" });
    const { result } = renderHook(() =>
      useFilterController(SpellMetaField.level)
    );

    act(() => {
      result.current.onFilter(2);
    });

    expect(replace).toHaveBeenCalledWith("/dashboard/spells?page=1&level=2");
  });

  it("removes the param instead of setting it when the value is -1", () => {
    // getQuery.ts's own filter controls use -1 as "no selection" — the same
    // convention onFilter has to honour, or clearing a filter would write
    // `?level=-1` to the URL instead of dropping the key.
    searchParams = new URLSearchParams({ level: "2", page: "1" });
    const { result } = renderHook(() =>
      useFilterController(SpellMetaField.level)
    );

    act(() => {
      result.current.onFilter(-1);
    });

    expect(replace).toHaveBeenCalledWith("/dashboard/spells?page=1");
  });
});
