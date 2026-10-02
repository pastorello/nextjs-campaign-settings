"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  type CountableCreature,
  type EncounterAdjustments,
  countedCreature,
  countedRows,
  isAdjusted,
  parseEncounterAdjustments,
  pruneEncounterAdjustments,
  withCreature,
  withPartySize,
  withoutCreatures,
} from "@/app/lib/utils/campaigns/encounterAdjustments";

/*
 * SPEC-031 §5.C: the DM's on-the-fly party size and creature counts, kept in
 * `localStorage` only — one key per adventure, so one adventure's missing
 * player does not change another's fights. Every storage access is in a
 * `try`: a private window, a full quota or a blocked origin throws, and the
 * page must still work. When it throws, the change lives in memory for the
 * rest of the visit and nothing is kept across a reload.
 */

export const encounterAdjustmentsKey = (adventureId: number) =>
  `campaign.encounterAdjustments.${adventureId}`;

const listeners = new Set<() => void>();
/** Writes that storage refused, so the controls still work for this visit. */
const unsaved = new Map<string, string | null>();

function readStored(key: string): string | null {
  if (unsaved.has(key)) return unsaved.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    unsaved.delete(key);
  } catch {
    unsaved.set(key, value);
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab on the same adventure changes it too.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** The server has no browser storage: it renders the stored values. */
const serverSnapshot = () => null;

export interface EncounterAdjustmentsApi {
  /** The party size every fight on the page is priced for. */
  partySize: number;
  defaultPartySize: number;
  partySizeOverridden: boolean;
  setPartySize: (partySize: number) => void;
  resetPartySize: () => void;
  counted: (creature: CountableCreature) => {
    excluded: boolean;
    quantity: number;
  };
  countedRows: <T extends CountableCreature>(rows: readonly T[]) => T[];
  isAdjusted: (rows: readonly CountableCreature[]) => boolean;
  setExcluded: (creature: CountableCreature, excluded: boolean) => void;
  setCountedQuantity: (creature: CountableCreature, quantity: number) => void;
  resetCreatures: (ids: readonly number[]) => void;
}

/**
 * The store behind `EncounterAdjustmentsProvider`. `liveIds` are the
 * adventure's creature rows; an override for any other id belonged to a
 * deleted row and is pruned once the page has loaded.
 */
export function useEncounterAdjustmentsStore(
  adventureId: number,
  defaultPartySize: number,
  liveIds: readonly number[]
): EncounterAdjustmentsApi {
  const key = encounterAdjustmentsKey(adventureId);
  const raw = useSyncExternalStore(
    subscribe,
    () => readStored(key),
    serverSnapshot
  );
  const adjustments = useMemo(() => parseEncounterAdjustments(raw), [raw]);

  const liveIdsKey = liveIds.join(",");
  useEffect(() => {
    const stored = parseEncounterAdjustments(readStored(key));
    const pruned = pruneEncounterAdjustments(
      stored,
      liveIdsKey === "" ? [] : liveIdsKey.split(",").map(Number)
    );
    if (pruned !== stored) save(key, pruned);
  }, [key, liveIdsKey]);

  const update = useCallback(
    (change: (current: EncounterAdjustments) => EncounterAdjustments) =>
      save(key, change(parseEncounterAdjustments(readStored(key)))),
    [key]
  );

  return useMemo(
    () => ({
      partySize: adjustments.partySize ?? defaultPartySize,
      defaultPartySize,
      partySizeOverridden: adjustments.partySize !== undefined,
      setPartySize: (partySize) =>
        update((current) =>
          withPartySize(current, partySize, defaultPartySize)
        ),
      resetPartySize: () =>
        update((current) =>
          withPartySize(current, undefined, defaultPartySize)
        ),
      counted: (creature) => countedCreature(adjustments, creature),
      countedRows: (rows) => countedRows(adjustments, rows),
      isAdjusted: (rows) => isAdjusted(adjustments, rows),
      setExcluded: (creature, excluded) =>
        update((current) => withCreature(current, creature, { excluded })),
      setCountedQuantity: (creature, quantity) =>
        update((current) => withCreature(current, creature, { quantity })),
      resetCreatures: (ids) =>
        update((current) => withoutCreatures(current, ids)),
    }),
    [adjustments, defaultPartySize, update]
  );
}

/** Writes the object, or removes the key once nothing is overridden. */
function save(key: string, adjustments: EncounterAdjustments) {
  const empty =
    adjustments.partySize === undefined &&
    Object.keys(adjustments.creatures).length === 0;
  writeStored(key, empty ? null : JSON.stringify(adjustments));
}

export const EncounterAdjustmentsContext =
  createContext<EncounterAdjustmentsApi | null>(null);

/**
 * The adventure page's on-the-fly state, or `null` outside its provider —
 * where a component prices with its own props, as before SPEC-031.
 */
export default function useEncounterAdjustments(): EncounterAdjustmentsApi | null {
  return useContext(EncounterAdjustmentsContext);
}
