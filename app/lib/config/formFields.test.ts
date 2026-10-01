import { describe, expect, it } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import formFields from "./formFields";
import pagesConfig from "./pagesConfig";

describe("formFields", () => {
  // A form field the page does not declare is never read back nor written by
  // the domain's actions, so it would edit nothing. Found when SPEC-022 T6's
  // `revealedTo` landed on the treasure form instead of the faction's.
  it.each(Object.values(PageType))(
    "%s edits only fields its page declares",
    (pageType) => {
      const declared = new Set<string>(pagesConfig[pageType].fields);
      const undeclared = formFields[pageType].filter(
        (field) => !declared.has(field)
      );

      expect(undeclared).toEqual([]);
    }
  );
});
