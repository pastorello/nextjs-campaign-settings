"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Locale names are the language's own endonym, so unlike the rest of the
// UI they are the same value regardless of the active locale (TD-21).
const localeNames: Record<(typeof routing.locales)[number], string> = {
  it: "Italiano",
  en: "English",
};

export default function LocaleSwitcher() {
  const t = useTranslations("common.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  return (
    <select
      aria-label={t("language")}
      value={locale}
      className="w-full rounded-md bg-gray-50 p-2 text-sm font-medium hover:bg-sky-100 hover:text-blue-600"
      onChange={(event) => {
        router.replace(
          { pathname, query: Object.fromEntries(searchParams) },
          { locale: event.target.value }
        );
      }}
    >
      {routing.locales.map((availableLocale) => (
        <option key={availableLocale} value={availableLocale}>
          {localeNames[availableLocale]}
        </option>
      ))}
    </select>
  );
}
