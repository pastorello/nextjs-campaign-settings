"use client";

import {
  UserGroupIcon,
  HomeIcon,
  TrophyIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  MapIcon,
  PencilSquareIcon,
  FlagIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import { Link, usePathname } from "@/i18n/navigation";

type DashboardSubpath = Parameters<typeof dashboardPath>[1];

// Paths inside the system segment; `dashboardPath` adds the rest.
const links: {
  key: string;
  href: DashboardSubpath;
  admin?: DashboardSubpath;
  icon: typeof HomeIcon;
}[] = [
  // First, above "home" — the first thing a DM reaches for when they know a
  // name but not which of the six catalogues holds it (SPEC-011 §5).
  { key: "search", href: "/search", icon: MagnifyingGlassIcon },
  { key: "home", href: "", icon: HomeIcon },
  {
    key: "campaign",
    href: "/campaign",
    icon: ClipboardDocumentListIcon,
  },
  {
    key: "deities",
    href: "/deities",
    admin: "/admin/deities",
    icon: BuildingLibraryIcon,
  },
  {
    key: "geography",
    href: "/geography",
    icon: MapIcon,
  },
  {
    key: "spells",
    href: "/spells",
    admin: "/admin/spells",
    icon: BookOpenIcon,
  },
  {
    key: "magicItems",
    href: "/magicitems",
    icon: TrophyIcon,
    admin: "/admin/magicitems",
  },
  {
    key: "npc",
    href: "/npc",
    admin: "/admin/npc",
    icon: UserGroupIcon,
  },
  {
    key: "factions",
    href: "/factions",
    admin: "/admin/factions",
    icon: FlagIcon,
  },
  {
    key: "treasure",
    href: "/treasures",
    admin: "/admin/treasures",
    icon: BanknotesIcon,
  },
];

export default function NavLinks() {
  // next-intl's usePathname, so the comparison below ignores the locale
  // prefix: with next/navigation's, no English page was ever highlighted.
  const pathname = usePathname();
  const system = useGameSystem();
  const t = useTranslations("common.nav");

  return (
    <>
      {links.map((link) => {
        const name = t(link.key);
        const LinkIcon = link.icon;
        const href = dashboardPath(system, link.href);
        const adminHref = link.admin && dashboardPath(system, link.admin);
        return (
          <div
            key={link.key}
            className={clsx(
              "w-full flex rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
              {
                "bg-sky-100 text-blue-600":
                  pathname === href || pathname === adminHref,
              }
            )}
          >
            <div className="flex flex-1">
              <Link
                href={href}
                className="flex gap-2 h-[48px] grow items-center w-full"
              >
                <LinkIcon className="w-6" />
                <p className="hidden md:block">{name}</p>
              </Link>
            </div>
            {adminHref && (
              <div className="flex flex-0 justify-end">
                <Link
                  href={adminHref}
                  // Icon-only, so it needs a name of its own: a screen reader
                  // announced four unlabelled links in the main navigation of
                  // every page (TD-15).
                  aria-label={t("manage", { section: name.toLowerCase() })}
                  className="flex gap-2 h-12 grow items-center justify-center w-full"
                >
                  <PencilSquareIcon className="w-6" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
