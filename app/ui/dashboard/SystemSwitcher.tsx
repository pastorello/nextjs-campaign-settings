"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { GAME_SYSTEMS } from "@/app/lib/definitions/GameSystem";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { usePathname, useRouter } from "@/i18n/navigation";
import { switchSystemPath } from "@/i18n/switchSystemPath";

const HINT_ID = "system-switcher-hint";

/**
 * The game-system switch (ADR-0013 rule 6), beside the locale switcher.
 *
 * While only one system is defined it is shown disabled, not hidden (the
 * DM's answer, 2026-09-18), with a hint saying why, so the control is
 * already in place when a second system joins `GAME_SYSTEMS`.
 */
export default function SystemSwitcher() {
  const t = useTranslations("common.nav");
  const tSystems = useTranslations("gameSystems");
  const system = useGameSystem();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const single = GAME_SYSTEMS.length < 2;

  return (
    <div className="w-full">
      <select
        aria-label={t("gameSystem")}
        aria-describedby={single ? HINT_ID : undefined}
        value={system}
        disabled={single}
        className="w-full rounded-md bg-gray-50 p-2 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:text-current"
        onChange={(event) => {
          const target = GAME_SYSTEMS.find((s) => s === event.target.value);
          if (!target) return;
          router.push(
            switchSystemPath(pathname, searchParams.toString(), target)
          );
        }}
      >
        {GAME_SYSTEMS.map((availableSystem) => (
          <option key={availableSystem} value={availableSystem}>
            {tSystems(availableSystem)}
          </option>
        ))}
      </select>
      {single && (
        <p id={HINT_ID} className="sr-only">
          {t("gameSystemSingle")}
        </p>
      )}
    </div>
  );
}
