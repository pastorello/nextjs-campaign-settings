import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { classFindMany, subclassFindMany } = vi.hoisted(() => ({
  classFindMany: vi.fn(),
  subclassFindMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhClass: { findMany: classFindMany },
    dhSubclass: { findMany: subclassFindMany },
  },
}));

import { fetchFilteredDhClasses } from "./fetchFilteredDhClasses";
import { fetchFilteredDhSubclasses } from "../dhSubclasses/fetchFilteredDhSubclasses";

// Invented content only (SPEC-018 §5).
const classRow = {
  id: 7,
  name: "Lamplighter",
  description: null,
  domainAId: 3,
  domainBId: 4,
  startingEvasion: 10,
  startingHp: 6,
  classItems: null,
  hopeFeatureName: "Kindle",
  hopeFeatureText: "<p>h</p>",
  origin: "homebrew",
  features: [{ id: 1, classId: 7, position: 1, name: "Wick", text: "<p/>" }],
};
const subclassRow = {
  id: 11,
  classId: 7,
  name: "Glass Warden",
  description: null,
  spellcastTrait: null,
  origin: "homebrew",
  features: [
    {
      id: 21,
      subclassId: 11,
      tier: "mastery",
      position: 1,
      name: "Pane",
      text: "<p/>",
    },
  ],
};

describe("fetchFilteredDhClasses and fetchFilteredDhSubclasses (SPEC-021 T4, T5)", () => {
  beforeEach(() => {
    classFindMany.mockReset();
    subclassFindMany.mockReset();
    classFindMany.mockResolvedValue([classRow]);
    subclassFindMany.mockResolvedValue([subclassRow]);
  });

  it("reads each class's features in position order and keeps them", async () => {
    const [dhClass] = await fetchFilteredDhClasses({ query: "lamp" });

    expect(classFindMany.mock.calls[0]?.[0]).toMatchObject({
      include: { features: { orderBy: { position: "asc" } } },
    });
    expect(dhClass?.features?.map((f) => f.name)).toEqual(["Wick"]);
  });

  it("filters subclasses by class and keeps their features", async () => {
    const [subclass] = await fetchFilteredDhSubclasses({ classId: "7" });

    expect(
      (subclassFindMany.mock.calls[0]?.[0] as { where: object }).where
    ).toEqual({ classId: 7 });
    expect(subclass?.spellcastTrait).toBe("none");
    expect(subclass?.features?.map((f) => f.tier)).toEqual(["mastery"]);
  });

  it("throws a DatabaseError for a malformed row", async () => {
    classFindMany.mockResolvedValue([{ ...classRow, startingHp: "six" }]);
    subclassFindMany.mockResolvedValue([{ ...subclassRow, name: 4 }]);

    await expect(fetchFilteredDhClasses({})).rejects.toBeInstanceOf(
      DatabaseError
    );
    await expect(fetchFilteredDhSubclasses({})).rejects.toBeInstanceOf(
      DatabaseError
    );
  });

  it("wraps a failed query", async () => {
    classFindMany.mockRejectedValue(new Error("down"));
    subclassFindMany.mockRejectedValue(new Error("down"));

    await expect(fetchFilteredDhClasses({})).rejects.toThrow(
      /fetching classes/
    );
    await expect(fetchFilteredDhSubclasses({})).rejects.toThrow(
      /fetching subclasses/
    );
  });
});
