import Link from "next/link";
import { FaceFrownIcon } from "@heroicons/react/24/outline";
import { getLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";

import "@/app/ui/global.css";

// All user-facing copy for this component, in one place for TD-21.
const COPY = {
  title: "404 Not Found",
  body: "Could not find the requested page.",
  goBack: "Go Back",
};

/**
 * Catches genuinely-unmatched routes app-wide. Next.js only honours a
 * not-found.tsx nested under a dynamic segment (like `[locale]` or
 * `dashboard`) when `notFound()` is called explicitly from within it — an
 * unmatched URL always falls through to the nearest file that sits outside
 * every dynamic segment, which in this app is here rather than
 * `[locale]/dashboard/not-found.tsx`. Because that puts this file outside
 * `[locale]/layout.tsx`, Next supplies its own implicit `<html>`/`<body>`
 * for it (rendering one here too would double them up and break
 * hydration), and it can only use next-intl's server-side helpers — no
 * `NextIntlClientProvider` wraps it.
 */
export default async function NotFound() {
  const locale = await getLocale();
  const dashboardHref =
    locale === routing.defaultLocale ? "/dashboard" : `/${locale}/dashboard`;

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-2">
      <FaceFrownIcon className="w-10 text-gray-400" />
      <h2 className="text-xl font-semibold">{COPY.title}</h2>
      <p>{COPY.body}</p>
      <Link
        href={dashboardHref}
        className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
      >
        {COPY.goBack}
      </Link>
    </main>
  );
}
