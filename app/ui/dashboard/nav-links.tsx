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
  SwatchIcon,
  RectangleStackIcon,
  AcademicCapIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import isPageInSystem from "@/app/lib/config/isPageInSystem";
import PageType from "@/app/lib/definitions/types/PageType";
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
  /**
   * The `pagesConfig` page behind a catalogue entry. The entry is shown only
   * under the page's system (ADR-0013 rule 4): a 5e catalogue under
   * `daggerheart` would be a 404. Entries without one are the world, shared
   * by every system. SPEC-021 T2–T5 add the Daggerheart catalogues here, each
   * with the page it creates, so they show under `daggerheart` alone.
   */
  page?: PageType;
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
    page: PageType.Spell,
    href: "/spells",
    admin: "/admin/spells",
    icon: BookOpenIcon,
  },
  {
    key: "magicItems",
    page: PageType.MagicItem,
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
    page: PageType.Treasure,
    href: "/treasures",
    admin: "/admin/treasures",
    icon: BanknotesIcon,
  },
  // SPEC-021 — the Daggerheart catalogues, shown under `daggerheart` alone.
  {
    key: "dhDomains",
    page: PageType.DhDomain,
    href: "/domains",
    admin: "/admin/domains",
    icon: SwatchIcon,
  },
  {
    key: "dhDomainCards",
    page: PageType.DhDomainCard,
    href: "/domain-cards",
    admin: "/admin/domain-cards",
    icon: RectangleStackIcon,
  },
  // SPEC-021 T4/T5: admin lists only, so the tile links there; the class
  // page (T6) is where a public `href` would go.
  {
    key: "dhClasses",
    page: PageType.DhClass,
    href: "/admin/classes",
    icon: AcademicCapIcon,
  },
  {
    key: "dhSubclasses",
    page: PageType.DhSubclass,
    href: "/admin/subclasses",
    icon: RectangleGroupIcon,
  },
];

export default function NavLinks() {
  // next-intl's usePathname, so the comparison below ignores the locale
  // prefix: with next/navigation's, no English page was ever highlighted.
  const pathname = usePathname();
  const system = useGameSystem();
  const t = useTranslations("common.nav");
  const systemLinks = links.filter(
    (link) => link.page === undefined || isPageInSystem(link.page, system)
  );

  return (
    // A real box below `md` — `min-w-0` lets it shrink so its own
    // `overflow-x-auto` can actually kick in inside the sidebar's flex row
    // (TD-114: ten icon tiles in one row used to run past the right edge).
    // `md:contents` un-boxes it at `md` and up, so the tiles become direct
    // children of `<nav>` again and its `md:flex-col` stacks them exactly as
    // before — this wrapper changes nothing on desktop.
    <div className="relative min-w-0 md:contents">
      <div className="flex gap-2 overflow-x-auto md:contents">
        {systemLinks.map((link) => {
          const name = t(link.key);
          const LinkIcon = link.icon;
          const href = dashboardPath(system, link.href);
          const adminHref = link.admin && dashboardPath(system, link.admin);
          return (
            <div
              key={link.key}
              className={clsx(
                "flex shrink-0 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:w-full md:flex-none md:justify-start md:p-2 md:px-3",
                {
                  "bg-sky-100 text-blue-600":
                    pathname === href || pathname === adminHref,
                }
              )}
            >
              <div className="flex flex-1">
                <Link
                  href={href}
                  // The label text below is `hidden` under `md`, and
                  // `display: none` content has no accessible name — so an
                  // icon-only tile named nothing at all (TD-114). The
                  // explicit aria-label covers both widths; it does not
                  // change anything once the text is visible again at `md`.
                  aria-label={name}
                  className="flex gap-2 h-[48px] grow items-center w-full"
                >
                  <LinkIcon className="w-6" aria-hidden="true" />
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
      </div>
      {/* A static "more this way" cue (TD-114) rather than a scroll-position
          -tracking one: the page has no explicit background, so this fades
          against the same white the body already renders on, at rest or
          mid-scroll alike. `md:hidden` — the row never scrolls at `md` and up. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent md:hidden"
      />
    </div>
  );
}
