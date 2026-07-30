import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import usePageManager from "./usePageManager";
import formFields from "../config/formFields";
import pageMetaFields from "../config/pageMetaFields";
import MetaValue from "../definitions/types/MetaValue";
import PageType from "../definitions/types/PageType";
import SpellMetaField from "../definitions/enums/spells/SpellMetaField";

const PAGE_TYPES = [
  PageType.Spell,
  PageType.MagicItem,
  PageType.Npc,
  PageType.Deity,
];

describe("usePageManager", () => {
  describe("create mode", () => {
    it.each(PAGE_TYPES)(
      "starts %s with every declared field at its default",
      (pageType) => {
        const { result } = renderHook(() =>
          usePageManager<Record<string, MetaValue>>(pageType)
        );

        // The assertion inside the hook claims `page` carries exactly the
        // domain's fields. This is what makes that true rather than assumed.
        expect(Object.keys(result.current.page).sort()).toEqual(
          [...formFields[pageType]].sort()
        );

        for (const field of formFields[pageType]) {
          expect(result.current.page[field]).toEqual(
            pageMetaFields[field].defaultValue
          );
        }
      }
    );

    it("reports nothing as edited before anything is touched", () => {
      const { result } = renderHook(() => usePageManager(PageType.Spell));

      expect(result.current.editedFields).toEqual([]);
    });

    it("carries no id", () => {
      const { result } = renderHook(() =>
        usePageManager<Record<string, MetaValue>>(PageType.Spell)
      );

      expect(result.current.page.id).toBeUndefined();
    });
  });

  describe("edit mode", () => {
    const existing = {
      id: 42,
      name: "Dardo Incantato",
      level: 1,
      description: "<p>Tre dardi.</p>",
    };

    it("starts from the record's values, not the field defaults", () => {
      const { result } = renderHook(() =>
        usePageManager<typeof existing>(PageType.Spell, existing)
      );

      expect(result.current.page.name).toBe("Dardo Incantato");
      expect(result.current.page.level).toBe(1);
    });

    it("carries the id without mutating the returned object", () => {
      // The four hooks this replaces assigned `page.id = item.id` after the
      // fact — a direct state mutation, and TD-22's react-hooks/immutability
      // warnings. It is part of the derived object now.
      const { result } = renderHook(() =>
        usePageManager<typeof existing>(PageType.Spell, existing)
      );

      expect(result.current.page.id).toBe(42);
      expect(Object.isFrozen(result.current.page)).toBe(false);
      expect(result.current.page).not.toBe(existing);
    });
  });

  describe("editing", () => {
    it("records only the fields that actually changed", () => {
      const { result } = renderHook(() => usePageManager(PageType.Spell));

      act(() => {
        result.current.setField(SpellMetaField.name, "Palla di Fuoco");
      });

      expect(result.current.editedFields).toEqual([SpellMetaField.name]);
      expect(result.current.getField(SpellMetaField.name)).toBe(
        "Palla di Fuoco"
      );
    });

    it("stops reporting a field as edited once it is set back", () => {
      const { result } = renderHook(() => usePageManager(PageType.Spell));
      const original = result.current.getField(SpellMetaField.level);

      act(() => {
        result.current.setField(SpellMetaField.level, 7);
      });
      expect(result.current.editedFields).toEqual([SpellMetaField.level]);

      act(() => {
        result.current.setField(SpellMetaField.level, original);
      });
      expect(result.current.editedFields).toEqual([]);
    });

    it("throws when asked for a field the domain does not declare", () => {
      const { result } = renderHook(() => usePageManager(PageType.MagicItem));

      // `level` belongs to spells; a magic item has no state for it.
      expect(() => result.current.getField(SpellMetaField.level)).toThrow(
        /No value found/
      );
    });
  });
});
