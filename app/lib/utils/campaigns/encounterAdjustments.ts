/*
 * The adventure page's on-the-fly encounter state (SPEC-031 §5.C): a party
 * size and per-creature counts that change the difficulty readout and
 * nothing stored. Kept in the browser only, one object per adventure; these
 * are the pure halves — reading it defensively, applying it to rows, and
 * the edits — so the hook that persists it stays a thin shell.
 */

/** One creature row's override: counted out, or counted a different number of times. */
export interface CreatureAdjustment {
  excluded?: true;
  quantity?: number;
}

export interface EncounterAdjustments {
  partySize?: number;
  /** Keyed by the creature row's id, as a string (JSON object keys). */
  creatures: Record<string, CreatureAdjustment>;
}

/** A row the layer can count: its id and its stored quantity. */
export interface CountableCreature {
  id: number;
  quantity: number;
}

export const NO_ADJUSTMENTS: EncounterAdjustments = { creatures: {} };

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Reads the stored text. Anything malformed — not JSON, a wrong shape, a
 * non-positive count — is dropped rather than trusted: the browser's
 * storage is outside the app's control, and a bad entry must never break
 * the page.
 */
export function parseEncounterAdjustments(
  raw: string | null
): EncounterAdjustments {
  if (raw === null) return NO_ADJUSTMENTS;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return NO_ADJUSTMENTS;
  }
  if (!isRecord(value)) return NO_ADJUSTMENTS;

  const creatures: Record<string, CreatureAdjustment> = {};
  if (isRecord(value.creatures)) {
    for (const [id, entry] of Object.entries(value.creatures)) {
      if (!isRecord(entry)) continue;
      const adjustment: CreatureAdjustment = {};
      if (entry.excluded === true) adjustment.excluded = true;
      if (isPositiveInteger(entry.quantity)) {
        adjustment.quantity = entry.quantity;
      }
      if (Object.keys(adjustment).length > 0) creatures[id] = adjustment;
    }
  }

  return isPositiveInteger(value.partySize)
    ? { partySize: value.partySize, creatures }
    : { creatures };
}

/** How a row is counted: excluded or not, and how many times. */
export function countedCreature(
  adjustments: EncounterAdjustments,
  creature: CountableCreature
): { excluded: boolean; quantity: number } {
  const entry = adjustments.creatures[String(creature.id)];
  return {
    excluded: entry?.excluded === true,
    quantity: entry?.quantity ?? creature.quantity,
  };
}

/** The rows a fight's difficulty is read from: excluded ones out, counts applied. */
export function countedRows<T extends CountableCreature>(
  adjustments: EncounterAdjustments,
  rows: readonly T[]
): T[] {
  return rows.flatMap((row) => {
    const { excluded, quantity } = countedCreature(adjustments, row);
    return excluded ? [] : [{ ...row, quantity }];
  });
}

/** Whether any of these rows is counted differently from what is stored. */
export function isAdjusted(
  adjustments: EncounterAdjustments,
  rows: readonly CountableCreature[]
): boolean {
  return rows.some(
    (row) => adjustments.creatures[String(row.id)] !== undefined
  );
}

/**
 * Sets one row's override. A count equal to the stored quantity is no
 * override, and a row with neither override leaves the object, so the
 * stored state only ever says what differs.
 */
export function withCreature(
  adjustments: EncounterAdjustments,
  creature: CountableCreature,
  change: { excluded?: boolean; quantity?: number }
): EncounterAdjustments {
  const key = String(creature.id);
  const current = adjustments.creatures[key] ?? {};
  const excluded = change.excluded ?? current.excluded === true;
  const quantity = Math.max(
    1,
    change.quantity ?? current.quantity ?? creature.quantity
  );

  const next: CreatureAdjustment = {};
  if (excluded) next.excluded = true;
  if (quantity !== creature.quantity) next.quantity = quantity;

  const others = Object.fromEntries(
    Object.entries(adjustments.creatures).filter(([id]) => id !== key)
  );
  return {
    ...adjustments,
    creatures:
      Object.keys(next).length > 0 ? { ...others, [key]: next } : others,
  };
}

/** Drops these rows' overrides — a scene's Reset. */
export function withoutCreatures(
  adjustments: EncounterAdjustments,
  ids: readonly number[]
): EncounterAdjustments {
  const drop = new Set(ids.map(String));
  return {
    ...adjustments,
    creatures: Object.fromEntries(
      Object.entries(adjustments.creatures).filter(([id]) => !drop.has(id))
    ),
  };
}

/** Sets or clears the party-size override; the default is no override. */
export function withPartySize(
  adjustments: EncounterAdjustments,
  partySize: number | undefined,
  defaultPartySize: number
): EncounterAdjustments {
  const rest: EncounterAdjustments = { creatures: adjustments.creatures };
  return partySize === undefined || partySize === defaultPartySize
    ? rest
    : { ...rest, partySize };
}

/**
 * Drops the overrides of rows that no longer exist (SPEC-031 §5's edge
 * case: a deleted row is pruned the next time the page loads). Returns the
 * same object when nothing was dropped, so the caller can skip a write.
 */
export function pruneEncounterAdjustments(
  adjustments: EncounterAdjustments,
  liveIds: readonly number[]
): EncounterAdjustments {
  const live = new Set(liveIds.map(String));
  const stale = Object.keys(adjustments.creatures).filter(
    (id) => !live.has(id)
  );
  if (stale.length === 0) return adjustments;
  return withoutCreatures(adjustments, stale.map(Number));
}
