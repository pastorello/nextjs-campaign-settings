import { defineRouting } from "next-intl/routing";

/**
 * ADR-0006: Italian is the default and keeps unprefixed URLs
 * (`/dashboard/spells`); English is served under `/en/dashboard/spells`.
 */
export const routing = defineRouting({
  locales: ["it", "en"],
  defaultLocale: "it",
  localePrefix: "as-needed",
  // Unprefixed URLs always serve Italian, the ADR-0006 default — not
  // whatever the browser's Accept-Language header negotiates. English is
  // reached only via an explicit `/en/...` URL or the LocaleSwitcher, which
  // persists the choice in a cookie regardless of this setting.
  localeDetection: false,
});
