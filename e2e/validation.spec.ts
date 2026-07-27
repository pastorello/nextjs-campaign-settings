import { test, expect } from "@playwright/test";

/**
 * Input validation at the HTTP boundary (TD-02).
 *
 * **Why this is not the spec docs/TESTING.md §E2E describes.** That plan says
 * "submit an empty required field → inline error, nothing written". It cannot
 * be written today, and the reason is recorded in TECH_DEBT.md TD-02: every
 * string field's declared validator is a bare `z.string()` with no `.min(1)`,
 * so an empty `nome` is *valid* and the form correctly saves it. A spec
 * asserting an error would fail; a spec asserting the empty name is accepted
 * would lock in the laxness as intended behaviour. Tightening the validator is
 * a product decision (TD-02 leaves it open deliberately), not a test fix.
 *
 * So this covers the boundary that does reject: route params. `parseIdParam`
 * turns a malformed `:id` into a 400 instead of letting `parseInt("abc")` reach
 * Prisma as `NaN`. The unit suite covers the parser; this proves the running
 * app returns the status.
 */
test.describe("input validation at the API boundary", () => {
  const malformedIds = ["abc", "1.5", "-1", "0", "%20"];

  for (const id of malformedIds) {
    test(`DELETE /api/spells/${id} is rejected with 400`, async ({
      request,
    }) => {
      const response = await request.delete(`/api/spells/${id}`);

      expect(response.status()).toBe(400);
    });
  }

  test("a well-formed id for a missing record is a 404, not a 400 or a 500", async ({
    request,
  }) => {
    // The id is syntactically valid, so it gets past the parser — which keeps
    // the tests above honest: it must be the *shape* being rejected, not every
    // delete.
    //
    // The status is the TD-13 half: `deleteSpellById` returned a boolean, so a
    // missing row and an unreachable database were the same value and the
    // handler answered 500 to both.
    const response = await request.delete("/api/spells/999999");

    expect(response.status()).toBe(404);
  });
});

/**
 * The unauthenticated half of this boundary lives in auth.spec.ts, which runs
 * in the project that has no stored session.
 *
 * It was here first, using `request.newContext()` to "start anonymous", and
 * that was wrong in a way worth recording: **`request.newContext()` inherits
 * the project's `use` options, storageState included.** The context was
 * therefore signed in, the DELETE succeeded with 200 instead of 401, and the
 * test read as a missing auth guard when the guard was working perfectly.
 * Verified with `curl -X DELETE` and no cookies: the endpoint returns 401.
 *
 * It also permanently deleted the row it aimed at. Any spec that asserts on a
 * *destructive* endpoint must target a record it created itself — never a
 * hardcoded id.
 */
