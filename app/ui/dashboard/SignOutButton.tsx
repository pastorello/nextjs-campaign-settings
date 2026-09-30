import { PowerIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { signOut } from "@/auth";

/**
 * The sidebar's sign-out tile, also offered by the 403 page (SPEC-022), where
 * a player's account has no sidebar to find it in. Hand-rolled on purpose:
 * it matches `NavLinks`' tiles, which no `BaseButton` variant reproduces
 * (`CLAUDE.md`, TD-117).
 */
export default function SignOutButton() {
  const t = useTranslations("common.nav");

  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3">
        <PowerIcon className="w-6" />
        <div className="hidden md:block">{t("signOut")}</div>
      </button>
    </form>
  );
}
