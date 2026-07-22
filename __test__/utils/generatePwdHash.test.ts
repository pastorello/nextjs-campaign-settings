import * as bcrypt from "bcrypt";
import { describe, expect, it } from "vitest";

import hashPassword from "@/app/lib/utils/auth/hashPassword";

// The previous version asserted that hashPassword("123456") equalled a
// hardcoded digest. It could never pass: it compared an unawaited Promise
// against a string, and even awaited it would still fail, because bcrypt salts
// every hash randomly. A correct test asserts the properties the function must
// have, not one particular output.
describe("hashPassword", () => {
  it("produces a digest that verifies against the original password", async () => {
    const hash = await hashPassword("123456");

    await expect(bcrypt.compare("123456", hash)).resolves.toBe(true);
  });

  it("produces a digest that rejects a different password", async () => {
    const hash = await hashPassword("123456");

    await expect(bcrypt.compare("123457", hash)).resolves.toBe(false);
  });

  it("salts each call, so the same password never yields the same digest", async () => {
    const [first, second] = await Promise.all([
      hashPassword("123456"),
      hashPassword("123456"),
    ]);

    expect(first).not.toBe(second);
  });

  it("uses a cost factor of 10", async () => {
    const hash = await hashPassword("123456");

    expect(hash).toMatch(/^\$2[aby]\$10\$/);
  });
});
