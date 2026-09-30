import { NoSymbolIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";

import SignOutButton from "@/app/ui/dashboard/SignOutButton";

/**
 * What `forbidden()` renders, with a 403 (SPEC-022): a signed-in account
 * reached a page that is the DM's alone. Usually that is the proxy's rewrite
 * to `access-denied`. It says so and offers the way out, since a player's
 * account has no sidebar to sign out from. It sits at the root layout's
 * segment, so it also catches a `forbidden()` thrown by the dashboard's
 * layout, which a boundary beside that layout would not.
 */
export default async function Forbidden() {
  const t = await getTranslations("common.forbidden");

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <NoSymbolIcon className="w-10 text-gray-400" />
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <p>{t("description")}</p>
      <div className="mt-4">
        <SignOutButton />
      </div>
    </main>
  );
}
