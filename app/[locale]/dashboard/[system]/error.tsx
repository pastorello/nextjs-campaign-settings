"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import DatabaseUnreachableError from "@/app/lib/errors/DatabaseUnreachableError";

/**
 * Tells "the database is down" apart from "a query failed" (TD-25).
 *
 * **Known limit, and it is Next's rather than ours.** In production Next
 * replaces a server error's message with a generic string before it reaches a
 * client boundary, leaving only `digest` — so the specific message can only be
 * recognised in development. That is the case that matters here: this is a
 * self-hosted app whose owner runs it themselves, and the startup check in
 * `instrumentation.ts` covers the terminal in both modes.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common.errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  const isUnreachable = error.message.includes(DatabaseUnreachableError.PREFIX);

  return (
    <main className="flex h-full flex-col items-center justify-center gap-2">
      <h2 className="text-center text-lg font-medium">
        {isUnreachable ? t("unreachableTitle") : t("genericTitle")}
      </h2>
      <p className="max-w-md text-center text-sm text-gray-500">
        {isUnreachable ? t("unreachableBody") : t("genericBody")}
      </p>
      <button
        className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
        onClick={() => reset()}
      >
        {t("retry")}
      </button>
    </main>
  );
}
