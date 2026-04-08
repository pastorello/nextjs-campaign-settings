import createEmptyArray from "@/app/lib/utils/data/createEmptyArray";
import isNumberArray from "@/app/lib/utils/validators/isNumberArray";
import isObjectArray from "@/app/lib/utils/validators/isObjectArray";
import isStringArray from "@/app/lib/utils/validators/isStringArray";

test("createEmptyArray", () => {
  const unknownArray = createEmptyArray([]);
  const numberArray = createEmptyArray([3, 2, 1]);
  const stringArray = createEmptyArray(["foo", "foo", "foo"]);
  const objectArray = createEmptyArray([{ id: 3 }, { id: 2 }, { id: 1 }]);

  expect(unknownArray).toEqual([]);
  expect(numberArray).toEqual([]);
  expect(stringArray).toEqual([]);
  expect(objectArray).toEqual([]);
  expect(isNumberArray(numberArray)).toBe(true);
  expect(isStringArray(stringArray)).toBe(true);
  expect(isObjectArray(objectArray)).toBe(true);
});
