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
  UserCircleIcon,
  IdentificationIcon,
  HomeModernIcon,
  ShieldExclamationIcon,
  GlobeEuropeAfricaIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import { PLAYER_PAGES } from "@/app/lib/auth/playerPages";
import isPageInSystem from "@/app/lib/config/isPageInSystem";
import PageType from "@/app/lib/definitions/types/PageType";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { dashboardPath } from "@/i18n/dashboardPath";
import { Link, usePathname } from "@/i18n/navigation";

type DashboardSubpath = Parameters<typeof dashboardPath>[1];

// Paths inside the system segment; `dashboardPath` adds the rest.
interface NavLink {
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
}

/**
 * A labelled group of tiles with no page of its own (SPEC-029 §5.5: the
 * equipment catalogues). Shown when any of its tiles is.
 */
interface NavGroup {
  key: string;
  icon: typeof HomeIcon;
  group: NavLink[];
}

const links: (NavLink | NavGroup)[] = [
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
  {
    key: "dhClasses",
    page: PageType.DhClass,
    href: "/classes",
    admin: "/admin/classes",
    icon: AcademicCapIcon,
  },
  // No public list: a subclass is shown on its class's page (SPEC-021 T6),
  // so the tile links to the admin list.
  {
    key: "dhSubclasses",
    page: PageType.DhSubclass,
    href: "/admin/subclasses",
    icon: RectangleGroupIcon,
  },
  // SPEC-027: the heritage catalogues.
  {
    key: "dhAncestries",
    page: PageType.DhAncestry,
    href: "/ancestries",
    admin: "/admin/ancestries",
    icon: IdentificationIcon,
  },
  {
    key: "dhCommunities",
    page: PageType.DhCommunity,
    href: "/communities",
    admin: "/admin/communities",
    icon: HomeModernIcon,
  },
  // SPEC-028: the DM's alone, so no player ever sees these tiles.
  {
    key: "dhAdversaries",
    page: PageType.DhAdversary,
    href: "/adversaries",
    admin: "/admin/adversaries",
    icon: ShieldExclamationIcon,
  },
  {
    key: "dhEnvironments",
    page: PageType.DhEnvironment,
    href: "/environments",
    admin: "/admin/environments",
    icon: GlobeEuropeAfricaIcon,
  },
  // SPEC-029: the equipment, one group (§9 decision 6).
  {
    key: "dhEquipment",
    icon: WrenchScrewdriverIcon,
    group: [
      {
        key: "dhWeapons",
        page: PageType.DhWeapon,
        href: "/weapons",
        admin: "/admin/weapons",
        icon: BoltIcon,
      },
    ],
  },
  // SPEC-022 T2, T3: the tile is the DM's own account, the pencil every
  // account. Last, beside the sign-out tile it relates to.
  {
    key: "accounts",
    href: "/account",
    admin: "/admin/accounts",
    icon: UserCircleIcon,
  },
];

/**
 * `player` (SPEC-022 T7) keeps the tiles of the pages open to players
 * (`PLAYER_PAGES`), without the admin pencil: everything else is refused to
 * them by the server, so offering it would only lead to the 403 page.
 */
export default function NavLinks({ player = false }: { player?: boolean }) {
  // next-intl's usePathname, so the comparison below ignores the locale
  // prefix: with next/navigation's, no English page was ever highlighted.
  const pathname = usePathname();
  const system = useGameSystem();
  const t = useTranslations("common.nav");
  const shown = (link: NavLink) =>
    (link.page === undefined || isPageInSystem(link.page, system)) &&
    (!player || PLAYER_PAGES.includes(link.href));
  const systemLinks = links.flatMap<NavLink | NavGroup>((entry) => {
    if (!("group" in entry)) return shown(entry) ? [entry] : [];
    const group = entry.group.filter(shown);
    return group.length > 0 ? [{ ...entry, group }] : [];
  });

  const renderTile = (link: NavLink) => {
    const name = t(link.key);
    const LinkIcon = link.icon;
    const href = dashboardPath(system, link.href);
    const adminHref =
      !player && link.admin && dashboardPath(system, link.admin);
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
  };

  return (
    // A real box below `md` — `min-w-0` lets it shrink so its own
    // `overflow-x-auto` can actually kick in inside the sidebar's flex row
    // (TD-114: ten icon tiles in one row used to run past the right edge).
    // `md:contents` un-boxes it at `md` and up, so the tiles become direct
    // children of `<nav>` again and its `md:flex-col` stacks them exactly as
    // before — this wrapper changes nothing on desktop.
    <div className="relative min-w-0 md:contents">
      <div className="flex gap-2 overflow-x-auto md:contents">
        {systemLinks.map((entry) => {
          if (!("group" in entry)) return renderTile(entry);
          const GroupIcon = entry.icon;
          const labelId = `nav-group-${entry.key}`;
          // The label is shown from `md`; below it the tiles sit in the
          // row like any other, and the group keeps its name through
          // `aria-labelledby`, which reads hidden text too.
          return (
            <div
              key={entry.key}
              role="group"
              aria-labelledby={labelId}
              className="flex shrink-0 gap-2 md:w-full md:flex-col md:gap-1"
            >
              <p
                id={labelId}
                className="hidden items-center gap-2 px-3 pt-2 text-xs font-semibold text-gray-600 uppercase md:flex"
              >
                <GroupIcon className="w-5" aria-hidden="true" />
                {t(entry.key)}
              </p>
              {entry.group.map(renderTile)}
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
