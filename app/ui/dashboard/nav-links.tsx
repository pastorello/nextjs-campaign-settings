"use client";

import {
  UserGroupIcon,
  HomeIcon,
  TrophyIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  MapIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "Home", href: "/dashboard", icon: HomeIcon },
  {
    name: "Religione",
    href: "/dashboard/deities",
    admin: "/dashboard/admin/deities",
    icon: BuildingLibraryIcon,
  },
  {
    name: "Geografia",
    href: "/dashboard/geography",
    icon: MapIcon,
  },
  {
    name: "Incantesimi",
    href: "/dashboard/spells",
    admin: "/dashboard/admin/spells",
    icon: BookOpenIcon,
  },
  {
    name: "Oggetti magici",
    href: "/dashboard/magicitems",
    icon: TrophyIcon,
    admin: "/dashboard/admin/magicitems",
  },
  {
    name: "Personaggi conosciuti",
    href: "/dashboard/png",
    admin: "/dashboard/admin/png",
    icon: UserGroupIcon,
  },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <div
            key={link.name}
            className={clsx(
              "w-full flex rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
              {
                "bg-sky-100 text-blue-600":
                  pathname === link.href || pathname === link.admin,
              },
            )}
          >
            <div className="flex flex-1">
              <Link
                href={link.href}
                className="flex gap-2 h-[48px] grow items-center w-full"
              >
                <LinkIcon className="w-6" />
                <p className="hidden md:block">{link.name}</p>
              </Link>
            </div>
            {link.admin && (
              <div className="flex flex-0 justify-end">
                <Link
                  href={link.admin}
                  className="flex gap-2 h-12 grow items-center justify-center w-full"
                >
                  <PencilSquareIcon className="w-6" />
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
