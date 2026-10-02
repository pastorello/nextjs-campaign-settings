"use client";

import type { ReactNode } from "react";

import {
  EncounterAdjustmentsContext,
  useEncounterAdjustmentsStore,
} from "@/app/lib/hooks/useEncounterAdjustments";

interface EncounterAdjustmentsProviderProps {
  adventureId: number;
  /** The campaign's number of players (`campaign.partySize`); 4 standalone. */
  defaultPartySize: number;
  /** Every creature row on the adventure, for pruning deleted ones. */
  creatureIds: readonly number[];
  children: ReactNode;
}

/**
 * Gives the adventure page's party-size control and scene list one shared
 * on-the-fly state (SPEC-031 §5.C). Browser-only; see
 * `useEncounterAdjustments`.
 */
export default function EncounterAdjustmentsProvider({
  adventureId,
  defaultPartySize,
  creatureIds,
  children,
}: EncounterAdjustmentsProviderProps) {
  const api = useEncounterAdjustmentsStore(
    adventureId,
    defaultPartySize,
    creatureIds
  );
  return (
    <EncounterAdjustmentsContext.Provider value={api}>
      {children}
    </EncounterAdjustmentsContext.Provider>
  );
}
