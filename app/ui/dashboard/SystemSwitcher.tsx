"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import type GameSystem from "@/app/lib/definitions/GameSystem";
import { GAME_SYSTEMS } from "@/app/lib/definitions/GameSystem";
import useGameSystem from "@/app/lib/hooks/useGameSystem";
import { usePathname, useRouter } from "@/i18n/navigation";
import { switchSystemPath } from "@/i18n/switchSystemPath";

const COMPATIBILITY_ID = "system-switcher-compatibility";

/**
 * Systems whose licence asks for a descriptive compatibility line wherever
 * the system is named: Daggerheart's DPCGL name-mark rule, "Daggerheart™
 * Compatible" (SPEC-018 §5.3, SPEC-021 §5.7). The line's text lives under
 * `gameSystemCompatibility.<system>` in both catalogues.
 */
const HAS_COMPATIBILITY_LINE: ReadonlySet<GameSystem> = new Set([
  "daggerheart",
]);

/**
 * The game-system switch (ADR-0013 rule 6), beside the locale switcher.
 *
 * It was shown disabled while `dnd5e` was the only system (the DM's answer,
 * 2026-09-18); Daggerheart joined in SPEC-021 T1, so it is always live now.
 */
export default function SystemSwitcher() {
  const t = useTranslations("common.nav");
  const tSystems = useTranslations("gameSystems");
  const tCompatibility = useTranslations("gameSystemCompatibility");
  const system = useGameSystem();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const compatible = HAS_COMPATIBILITY_LINE.has(system);

  return (
    <div className="w-full">
      <select
        aria-label={t("gameSystem")}
        aria-describedby={compatible ? COMPATIBILITY_ID : undefined}
        value={system}
        className="w-full rounded-md bg-gray-50 p-2 text-sm font-medium hover:bg-sky-100 hover:text-blue-600"
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
      {compatible && (
        <p id={COMPATIBILITY_ID} className="mt-1 px-2 text-xs text-gray-600">
          {tCompatibility(system)}
        </p>
      )}
    </div>
  );
}
