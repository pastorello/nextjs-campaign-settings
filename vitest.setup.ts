import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

// Clears the stale focus pointer the previous test's unmount left behind.
//
// jsdom 30.1.0 keeps pointing at the focused element after that element is
// removed from the document — which is exactly what Testing Library's cleanup
// does when focus sits inside the tree it unmounts. `activeElement` correctly
// reports `<body>` afterwards, but the *next* `focus()` call still treats the
// detached node as the old focus target, cannot retarget it inside the
// document, and so fires a `blur` event **at `window`**, which no browser does
// for a focus move within one document. jsdom 30.0.1 fired nothing at all.
//
// That stray window blur is not cosmetic: Radix's menu root closes itself on
// `window`'s `blur` (`@radix-ui/react-menu`), so from the second test in a file
// onwards a dropdown opened and then closed again in the same tick and its
// items never appeared — four of `MapUser.test.tsx`'s six tests, found on the
// Dependabot bump to jsdom 30.1.0.
//
// Focusing and blurring a throwaway node absorbs that one stray event here,
// before the component under test is rendered and before Radix has registered
// any listener, and leaves the pointer properly cleared. It has to happen in a
// `beforeEach`: Vitest runs `afterEach` hooks in reverse registration order, so
// a hook declared in this file would run *after* Testing Library's cleanup, by
// which time the focused node is already detached and `blur()` is a no-op.
beforeEach(() => {
  // Two suites opt into the `node` environment with a `@vitest-environment`
  // pragma, and this setup file runs for them too.
  if (typeof document === "undefined") return;

  const scratch = document.createElement("div");
  scratch.tabIndex = -1;
  document.body.appendChild(scratch);
  scratch.focus();
  scratch.blur();
  scratch.remove();
});

// The TextEncoder/TextDecoder polyfills the Jest setup carried are gone: they
// existed because the suite ran under `jest-environment-node`, and Vitest's
// jsdom environment provides both.

vi.mock("next-auth/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-auth/react")>();
  const mockSession = {
    expires: new Date(Date.now() + 2 * 86400).toISOString(),
    user: { username: "admin", id: 1 },
  };

  return {
    ...actual,
    useSession: vi.fn(() => ({ data: mockSession, status: "authenticated" })),
  };
});

vi.mock("next-intl", () => ({
  // Components under test render outside `NextIntlClientProvider`; returning
  // the key lets assertions target stable message keys instead of copy text.
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "inter", style: { fontFamily: "Inter" } }),
  Lusitana: () => ({
    className: "lusitana",
    style: { fontFamily: "Lusitana" },
  }),
}));
