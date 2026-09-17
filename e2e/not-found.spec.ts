import { test, expect } from "@playwright/test";

/**
 * Regression test for a routing gap: `[locale]/dashboard/not-found.tsx`
 * never actually rendered. Next.js only honours a nested not-found.tsx when
 * `notFound()` is called explicitly from within that segment; a genuinely
 * unmatched URL always falls through to Next's built-in 404 unless a
 * not-found.tsx sits outside every dynamic segment — which `app/not-found.tsx`
 * now does. This locks that in against Next re-introducing the built-in page.
 */
test.describe("unmatched dashboard route", () => {
  test("renders the app's own 404 page, not Next's built-in one", async ({
    page,
  }) => {
    const response = await page.goto("/dashboard/nonexistent-xyz");

    expect(response?.status()).toBe(404);
    await expect(page.getByText("404 Not Found")).toBeVisible();
    await expect(
      page.getByText("This page could not be found.")
    ).not.toBeVisible();
  });
});

/**
 * SPEC-018 T2 part B: every spec now goes straight to `/dashboard/dnd5e/...`
 * rather than relying on this redirect, so nothing else in the suite still
 * exercises it end to end. This one assertion keeps `proxy.ts`'s
 * `systemRedirectPath` (ADR-0013 rule 3) covered from the outside — a link
 * that drops the system must still land the DM on a working page.
 */
test.describe("a dashboard URL without a system", () => {
  test("307s to the default system, keeping the rest of the path", async ({
    page,
  }) => {
    await page.goto("/dashboard/spells");

    await expect(page).toHaveURL(/\/dashboard\/dnd5e\/spells$/);
  });
});
