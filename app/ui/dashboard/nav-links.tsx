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
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const links = [
  { key: "home", href: "/dashboard", icon: HomeIcon },
  {
    key: "deities",
    href: "/dashboard/deities",
    admin: "/dashboard/admin/deities",
    icon: BuildingLibraryIcon,
  },
  {
    key: "geography",
    href: "/dashboard/geography",
    icon: MapIcon,
  },
  {
    key: "spells",
    href: "/dashboard/spells",
    admin: "/dashboard/admin/spells",
    icon: BookOpenIcon,
  },
  {
    key: "magicItems",
    href: "/dashboard/magicitems",
    icon: TrophyIcon,
    admin: "/dashboard/admin/magicitems",
  },
  {
    key: "npc",
    href: "/dashboard/npc",
    admin: "/dashboard/admin/npc",
    icon: UserGroupIcon,
  },
  {
    key: "factions",
    href: "/dashboard/factions",
    admin: "/dashboard/admin/factions",
    icon: FlagIcon,
  },
];

export default function NavLinks() {
  const pathname = usePathname();
  const t = useTranslations("common.nav");

  return (
    <>
      {links.map((link) => {
        const name = t(link.key);
        const LinkIcon = link.icon;
        return (
          <div
            key={link.key}
            className={clsx(
              "w-full flex rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
              {
                "bg-sky-100 text-blue-600":
                  pathname === link.href || pathname === link.admin,
              }
            )}
          >
            <div className="flex flex-1">
              <Link
                href={link.href}
                className="flex gap-2 h-[48px] grow items-center w-full"
              >
                <LinkIcon className="w-6" />
                <p className="hidden md:block">{name}</p>
              </Link>
            </div>
            {link.admin && (
              <div className="flex flex-0 justify-end">
                <Link
                  href={link.admin}
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
