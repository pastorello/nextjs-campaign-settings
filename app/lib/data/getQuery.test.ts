import { describe, expect, it } from "vitest";

import getQuery from "./getQuery";
import SpellMetaField from "../definitions/enums/spells/SpellMetaField";
import { DEFAULT_ITEMS_PER_PAGE } from "../config/constants";

// getQuery is the metadata layer's payoff: one pure function from
// (searchParams, enabledMeta) to a Prisma query. It is the single place where a
// wrong field type silently produces a filter that stops filtering, so it is
// worth covering exhaustively — and it needs no database to do so.
describe("getQuery", () => {
  describe("free-text search", () => {
    it("builds a case-insensitive contains filter on nome", () => {
      const { where } = getQuery({ query: "fuoco" }, []);

      expect(where).toEqual({
        nome: { contains: "fuoco", mode: "insensitive" },
      });
    });

    it("omits the filter entirely when query is absent", () => {
      const { where } = getQuery({}, []);

      expect(where).toEqual({});
    });

    it("omits the filter when query is an empty string", () => {
      const { where } = getQuery({ query: "" }, []);

      expect(where).not.toHaveProperty("nome");
    });
  });

  describe("metadata-driven filters", () => {
    it("uses equality for an integer field", () => {
      const { where } = getQuery({ livello: "3" }, [SpellMetaField.livello]);

      expect(where).toEqual({ livello: 3 });
    });

    it("uses hasSome for an array field", () => {
      const { where } = getQuery({ circolo: "2" }, [SpellMetaField.circolo]);

      expect(where).toEqual({ circolo: { hasSome: [2] } });
    });

    it("ignores a field that is not in enabledMeta", () => {
      const { where } = getQuery({ livello: "3" }, []);

      expect(where).toEqual({});
    });

    it("drops a value that fails its field-type validator", () => {
      // paramValidator for integers requires Number(value) >= 0.
      const { where } = getQuery({ livello: "-1" }, [SpellMetaField.livello]);

      expect(where).not.toHaveProperty("livello");
    });

    it("keeps a boolean field only when it is truthy", () => {
      const enabled = [SpellMetaField.rituale];

      expect(getQuery({ rituale: "true" }, enabled).where).toEqual({
        rituale: true,
      });
      expect(getQuery({ rituale: "false" }, enabled).where).not.toHaveProperty(
        "rituale"
      );
    });

    it("combines free-text search with a field filter", () => {
      const { where } = getQuery({ query: "palla", livello: "3" }, [
        SpellMetaField.livello,
      ]);

      expect(where).toEqual({
        nome: { contains: "palla", mode: "insensitive" },
        livello: 3,
      });
    });
  });

  describe("pagination", () => {
    it("takes the default page size and skips nothing on page 1", () => {
      const { skip, take } = getQuery({}, []);

      expect(take).toBe(DEFAULT_ITEMS_PER_PAGE);
      expect(skip).toBe(0);
    });

    it("computes skip from the page number", () => {
      expect(getQuery({ page: "3" }, []).skip).toBe(DEFAULT_ITEMS_PER_PAGE * 2);
    });

    it("honours an explicit page size", () => {
      const { skip, take } = getQuery({ page: "2" }, [], 10);

      expect(take).toBe(10);
      expect(skip).toBe(10);
    });

    it("treats a page below 1 as page 1", () => {
      expect(getQuery({ page: "0" }, []).skip).toBe(0);
      expect(getQuery({ page: "-5" }, []).skip).toBe(0);
    });

    it("treats an unparseable page as page 1", () => {
      expect(getQuery({ page: "banana" }, []).skip).toBe(0);
    });
  });

  describe("ordering", () => {
    it("falls back to ascending nome", () => {
      expect(getQuery({}, []).orderBy).toEqual([{ nome: "asc" }]);
    });

    it("orders nome descending when sort is desc", () => {
      expect(getQuery({ sort: "desc" }, []).orderBy).toEqual([
        { nome: "desc" },
      ]);
    });

    it("ignores an unrecognised sort direction", () => {
      expect(getQuery({ sort: "sideways" }, []).orderBy).toEqual([
        { nome: "asc" },
      ]);
    });

    it("puts explicit sortFields before the nome fallback", () => {
      const { orderBy } = getQuery(
        { sortFields: JSON.stringify({ livello: "desc" }) },
        []
      );

      expect(orderBy).toEqual([{ livello: "desc" }, { nome: "asc" }]);
    });
  });
});
