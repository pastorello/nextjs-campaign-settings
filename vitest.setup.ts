import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

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
