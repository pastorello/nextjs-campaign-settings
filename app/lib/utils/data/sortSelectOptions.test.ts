import { expect, test } from "vitest";

import sortSelectOptions from "./sortSelectOptions";

test("sortSelectOptions", () => {
  expect(sortSelectOptions([])).toEqual([]);
  expect(
    sortSelectOptions([
      { value: 1, label: "1° Livello" },
      { value: 0, label: "Trucchetto" },
    ])
  ).toEqual([
    { value: 1, label: "1° Livello" },
    { value: 0, label: "Trucchetto" },
  ]);
  expect(
    sortSelectOptions([
      { value: 2, label: "Beta" },
      { value: -1, label: "Tutti" },
      { value: 1, label: "Alfa" },
    ])
  ).toEqual([
    { value: -1, label: "Tutti" },
    { value: 1, label: "Alfa" },
    { value: 2, label: "Beta" },
  ]);
});

test("sortSelectOptions does not mutate the array it is given", () => {
  // TD-31: `PageMeta.options` is a shared, module-scoped array — every field
  // using it (a form's <Select>, a list's filter buttons) holds the same
  // reference. A sort that mutates in place would leak across all of them.
  const original = [
    { value: 1, label: "1° Livello" },
    { value: 0, label: "Trucchetto" },
  ];
  const originalOrder = [...original];

  sortSelectOptions(original);

  expect(original).toEqual(originalOrder);
});
