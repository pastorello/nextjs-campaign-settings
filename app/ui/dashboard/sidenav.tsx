import { getTranslations } from "next-intl/server";
import NavLinks from "@/app/ui/dashboard/nav-links";
import LocaleSwitcher from "@/app/ui/dashboard/LocaleSwitcher";
import SystemSwitcher from "@/app/ui/dashboard/SystemSwitcher";
import { Link } from "@/i18n/navigation";
import SignOutButton from "@/app/ui/dashboard/SignOutButton";
import CampaignSelector from "@/app/ui/dashboard/CampaignSelector";
import type Viewer from "@/app/lib/auth/Viewer";
import CampaignSettingsLogo from "../icons/CampaignSettingsLogo";

export default async function SideNav({ viewer }: { viewer: Viewer }) {
  const t = await getTranslations("common.nav");
  // SPEC-022 T7: a player gets the pages open to them, and in place of the
  // system switch, the campaign they are viewing, which decides the system.
  const isPlayer = viewer.kind === "player";

  return (
    <div className="flex h-full flex-col py-4 px-2 md:overflow-y-auto">
      <Link
        className="mb-2 flex h-26 items-end justify-start rounded-md bg-blue-600 p-4 py-4"
        href="/"
      >
        <div className="text-white w-40">
          <CampaignSettingsLogo />
        </div>
      </Link>
      <nav
        aria-label={t("sidebarLabel")}
        className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2"
      >
        <NavLinks player={isPlayer} />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
        {viewer.kind === "dm" ? (
          <SystemSwitcher />
        ) : (
          viewer.campaigns.length > 1 && (
            <CampaignSelector
              campaigns={viewer.campaigns}
              currentId={viewer.campaign?.id ?? null}
            />
          )
        )}
        <LocaleSwitcher />
        <SignOutButton />
      </nav>
    </div>
  );
}
