"use client";

import { useParams } from "next/navigation";

import GameSystem, { isGameSystem } from "@/app/lib/definitions/GameSystem";

/**
 * The game system of the current dashboard route, for client components
 * (ADR-0013 rule 5). Server components read it from `params` instead.
 *
 * `[system]/layout.tsx` has already 404ed an unknown system, so a missing or
 * invalid param here means the hook is used outside the dashboard — a bug,
 * reported loudly rather than papered over with the default system.
 */
export default function useGameSystem(): GameSystem {
  const { system } = useParams<{ system?: string }>();
  if (!isGameSystem(system)) {
    throw new Error(
      `useGameSystem() needs a [system] route segment, got ${String(system)}`
    );
  }
  return system;
}
