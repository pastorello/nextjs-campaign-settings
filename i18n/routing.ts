import { defineRouting } from "next-intl/routing";

/**
 * ADR-0006: Italian is the default and keeps unprefixed URLs
 * (`/dashboard/spells`); English is served under `/en/dashboard/spells`.
 */
export const routing = defineRouting({
  locales: ["it", "en"],
  defaultLocale: "it",
  localePrefix: "as-needed",
});
