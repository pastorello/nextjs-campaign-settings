import hashPassword from "@/app/lib/utils/auth/hashPassword";

test("hasPassword", () => {
  expect(hashPassword("123456")).toBe(
    "$2b$10$mSxfSmFrrODBXsgobmj.ZeCEVzWkwJ.B206EqokaHcfhYBheuK8oe"
  );
});
