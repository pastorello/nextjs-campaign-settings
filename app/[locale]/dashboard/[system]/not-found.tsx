import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FaceFrownIcon } from "@heroicons/react/24/outline";

export default async function NotFound() {
  const t = await getTranslations("common.notFound");

  return (
    <main className="flex h-full flex-col items-center justify-center gap-2">
      <FaceFrownIcon className="w-10 text-gray-400" />
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      <p>{t("description")}</p>
      <Link
        href="/dashboard"
        className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
      >
        {t("goBack")}
      </Link>
    </main>
  );
}
