import { describe, expect, it } from "vitest";

import {
  NO_ADJUSTMENTS,
  countedCreature,
  countedRows,
  isAdjusted,
  parseEncounterAdjustments,
  pruneEncounterAdjustments,
  withCreature,
  withPartySize,
  withoutCreatures,
} from "./encounterAdjustments";

const wolves = { id: 7, quantity: 4 };
const witch = { id: 8, quantity: 1 };

describe("parseEncounterAdjustments (SPEC-031 §5.C)", () => {
  it("reads nothing stored as no overrides", () => {
    expect(parseEncounterAdjustments(null)).toEqual(NO_ADJUSTMENTS);
  });

  it("reads a stored object", () => {
    expect(
      parseEncounterAdjustments(
        '{"partySize":3,"creatures":{"7":{"quantity":2},"8":{"excluded":true}}}'
      )
    ).toEqual({
      partySize: 3,
      creatures: { "7": { quantity: 2 }, "8": { excluded: true } },
    });
  });

  it.each(["not json", "[]", "42", '"text"', "null", '{"creatures":[1,2]}'])(
    "drops a malformed value: %s",
    (raw) => {
      expect(parseEncounterAdjustments(raw)).toEqual(NO_ADJUSTMENTS);
    }
  );

  it("drops bad fields one by one, keeping the good ones", () => {
    expect(
      parseEncounterAdjustments(
        '{"partySize":0,"creatures":{"7":{"quantity":-1,"excluded":"yes"},"8":{"quantity":2.5},"9":{"quantity":3},"10":"x"}}'
      )
    ).toEqual({ creatures: { "9": { quantity: 3 } } });
  });
});

describe("counting rows", () => {
  const adjustments = {
    creatures: { "7": { quantity: 2 }, "8": { excluded: true as const } },
  };

  it("counts a row its override's number of times, or its stored one", () => {
    expect(countedCreature(adjustments, wolves)).toEqual({
      excluded: false,
      quantity: 2,
    });
    expect(countedCreature(NO_ADJUSTMENTS, wolves)).toEqual({
      excluded: false,
      quantity: 4,
    });
  });

  it("leaves excluded rows out and applies the counts", () => {
    expect(countedRows(adjustments, [wolves, witch])).toEqual([
      { id: 7, quantity: 2 },
    ]);
  });

  it("says whether a scene's rows are adjusted", () => {
    expect(isAdjusted(adjustments, [witch])).toBe(true);
    expect(isAdjusted(adjustments, [{ id: 99, quantity: 1 }])).toBe(false);
  });
});

describe("editing the overrides", () => {
  it("excludes and includes a row, leaving no entry once back to stored", () => {
    const excluded = withCreature(NO_ADJUSTMENTS, wolves, { excluded: true });
    expect(excluded.creatures).toEqual({ "7": { excluded: true } });
    expect(
      withCreature(excluded, wolves, { excluded: false }).creatures
    ).toEqual({});
  });

  it("counts a row more or fewer times, never fewer than one", () => {
    const fewer = withCreature(NO_ADJUSTMENTS, wolves, { quantity: 3 });
    expect(fewer.creatures).toEqual({ "7": { quantity: 3 } });
    expect(withCreature(fewer, wolves, { quantity: 0 }).creatures).toEqual({
      "7": { quantity: 1 },
    });
    expect(withCreature(fewer, wolves, { quantity: 4 }).creatures).toEqual({});
  });

  it("keeps a row's count while it is excluded", () => {
    const counted = withCreature(NO_ADJUSTMENTS, wolves, { quantity: 2 });
    expect(withCreature(counted, wolves, { excluded: true }).creatures).toEqual(
      { "7": { excluded: true, quantity: 2 } }
    );
  });

  it("resets a scene's rows and nothing else", () => {
    const both = withCreature(
      withCreature(NO_ADJUSTMENTS, wolves, { quantity: 2 }),
      witch,
      { excluded: true }
    );
    expect(withoutCreatures(both, [7]).creatures).toEqual({
      "8": { excluded: true },
    });
  });

  it("sets the party size, and clears it at the default", () => {
    expect(withPartySize(NO_ADJUSTMENTS, 3, 4)).toEqual({
      partySize: 3,
      creatures: {},
    });
    expect(withPartySize({ partySize: 3, creatures: {} }, 4, 4)).toEqual({
      creatures: {},
    });
    expect(
      withPartySize({ partySize: 3, creatures: {} }, undefined, 4)
    ).toEqual({ creatures: {} });
  });

  it("prunes deleted rows, returning the same object when nothing is stale", () => {
    const both = {
      creatures: { "7": { quantity: 2 }, "8": { excluded: true as const } },
    };
    expect(pruneEncounterAdjustments(both, [7]).creatures).toEqual({
      "7": { quantity: 2 },
    });
    expect(pruneEncounterAdjustments(both, [7, 8])).toBe(both);
  });
});
