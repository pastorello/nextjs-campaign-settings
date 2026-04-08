import sortByField from ".";

test("sortByField", () => {
  expect(sortByField([])).toEqual([]);
  expect(sortByField([3, 2, 1])).toEqual([1, 2, 3]);
  expect(sortByField([{ id: 3 }, { id: 2 }, { id: 1 }], "id")).toEqual([
    { id: 1 },
    { id: 2 },
    { id: 3 },
  ]);
});
