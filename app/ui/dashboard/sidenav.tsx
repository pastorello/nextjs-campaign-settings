import { getTranslations } from "next-intl/server";
import NavLinks from "@/app/ui/dashboard/nav-links";
import LocaleSwitcher from "@/app/ui/dashboard/LocaleSwitcher";
import SystemSwitcher from "@/app/ui/dashboard/SystemSwitcher";
import { Link } from "@/i18n/navigation";
import SignOutButton from "@/app/ui/dashboard/SignOutButton";
import CampaignSettingsLogo from "../icons/CampaignSettingsLogo";

export default async function SideNav() {
  const t = await getTranslations("common.nav");

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
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
        <SystemSwitcher />
        <LocaleSwitcher />
        <SignOutButton />
      </nav>
    </div>
  );
}
