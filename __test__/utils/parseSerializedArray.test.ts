import parseSerializedArray from "../../app/lib/utils/data/parseSerializedArray";

test("parseSerializedArray", () => {
  expect(parseSerializedArray('""')).toEqual([]);
  expect(parseSerializedArray("[]")).toEqual([]);
  expect(parseSerializedArray("[0]")).toEqual([0]);
  expect(parseSerializedArray('["0"]')).toEqual([0]);
  expect(parseSerializedArray('[1,"0"]')).toEqual([0, 1]);
  expect(parseSerializedArray('[1,"0", 1]')).toEqual([0, 1]);
});
