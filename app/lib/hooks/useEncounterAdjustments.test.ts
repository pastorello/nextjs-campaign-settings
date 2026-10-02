import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  encounterAdjustmentsKey,
  useEncounterAdjustmentsStore,
} from "./useEncounterAdjustments";

const wolves = { id: 7, quantity: 4 };
const witch = { id: 8, quantity: 1 };

const renderStore = (
  adventureId = 1,
  defaultPartySize = 4,
  liveIds: number[] = [7, 8]
) =>
  renderHook(() =>
    useEncounterAdjustmentsStore(adventureId, defaultPartySize, liveIds)
  );

describe("useEncounterAdjustmentsStore (SPEC-031 §5.C)", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("starts at the campaign's party size, with nothing counted differently", () => {
    const { result } = renderStore();

    expect(result.current.partySize).toBe(4);
    expect(result.current.partySizeOverridden).toBe(false);
    expect(result.current.counted(wolves)).toEqual({
      excluded: false,
      quantity: 4,
    });
  });

  it("keeps the party size in localStorage, per adventure, until Reset", () => {
    const { result } = renderStore(1);
    act(() => result.current.setPartySize(3));

    expect(result.current.partySize).toBe(3);
    expect(
      JSON.parse(window.localStorage.getItem(encounterAdjustmentsKey(1)) ?? "")
    ).toEqual({ partySize: 3, creatures: {} });
    // A reload reads it back; another adventure does not see it.
    expect(renderStore(1).result.current.partySize).toBe(3);
    expect(renderStore(2).result.current.partySize).toBe(4);

    act(() => result.current.resetPartySize());
    expect(result.current.partySize).toBe(4);
    expect(window.localStorage.getItem(encounterAdjustmentsKey(1))).toBeNull();
  });

  it("follows the campaign's party size while there is no override", () => {
    const { result, rerender } = renderHook(
      ({ size }) => useEncounterAdjustmentsStore(1, size, [7, 8]),
      { initialProps: { size: 4 } }
    );
    rerender({ size: 5 });
    expect(result.current.partySize).toBe(5);
  });

  it("excludes a creature and counts another differently; Reset puts them back", () => {
    const { result } = renderStore();
    act(() => {
      result.current.setExcluded(witch, true);
      result.current.setCountedQuantity(wolves, 3);
    });

    expect(result.current.countedRows([wolves, witch])).toEqual([
      { id: 7, quantity: 3 },
    ]);
    expect(result.current.isAdjusted([wolves])).toBe(true);

    act(() => result.current.resetCreatures([7, 8]));
    expect(result.current.countedRows([wolves, witch])).toEqual([
      wolves,
      witch,
    ]);
    expect(result.current.isAdjusted([wolves, witch])).toBe(false);
  });

  it("prunes a deleted row's override when the page loads", () => {
    window.localStorage.setItem(
      encounterAdjustmentsKey(1),
      JSON.stringify({
        creatures: { "7": { quantity: 2 }, "99": { excluded: true } },
      })
    );

    renderStore(1, 4, [7, 8]);

    expect(
      JSON.parse(window.localStorage.getItem(encounterAdjustmentsKey(1)) ?? "")
    ).toEqual({ creatures: { "7": { quantity: 2 } } });
  });

  it("ignores a malformed stored value", () => {
    window.localStorage.setItem(encounterAdjustmentsKey(1), "{not json");

    const { result } = renderStore();

    expect(result.current.partySize).toBe(4);
  });

  it("works for the visit, keeping nothing, when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const { result } = renderStore(42);
    expect(result.current.partySize).toBe(4);

    act(() => result.current.setPartySize(2));
    expect(result.current.partySize).toBe(2);
  });
});
