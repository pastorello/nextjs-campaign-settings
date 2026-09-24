"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

import RemovalOutcome from "@/app/lib/definitions/types/RemovalOutcome";

export interface RemovalOutcomeOption {
  outcome: RemovalOutcome;
  /** The outcome's own name — "Rimuovi dalla mappa", "Elimina definitivamente". */
  label: string;
  /**
   * What this outcome does to the thing and to what is inside it, counts
   * included (SPEC-023 §5.3). A node rather than a string because the
   * place dialog builds it from several count lines, each of which only
   * renders when its count is non-zero.
   */
  detail: ReactNode;
  /** Colours the label red and is announced by the confirm button's variant. */
  isDestructive?: boolean;
}

interface RemovalOutcomeChoicesProps {
  /** Groups the radios; also the prefix of each input's `id`. */
  name: string;
  legend: string;
  options: RemovalOutcomeOption[];
  /** `null` until the DM has picked — the dialog's confirm stays disabled. */
  value: RemovalOutcome | null;
  onChange: (outcome: RemovalOutcome) => void;
}

/**
 * The two named outcomes of SPEC-023's one question, as radios.
 *
 * Radios rather than two buttons that act on click: §5.4 asks for one
 * confirmation step after the choice, not two one-click destructive
 * entries wearing a dialog — that would be the same two entries the spec
 * exists to merge. Radios rather than a checkbox (§5.2) for the same
 * reason the spec spells it out: "delete, and also…" makes one outcome the
 * default the other modifies, and here neither is.
 *
 * Nothing is selected initially, so the destructive outcome is never one
 * stray Return away. A dialog offering a single outcome (the map's own
 * "delete this map" entry, which has nothing to un-place) selects it up
 * front instead and doesn't render this at all.
 *
 * Shared by `RemovePlaceDialog` and `RemoveLandmarkDialog` — presentational
 * only, since what the outcomes mean, and what they cost, differ between a
 * place and a landmark.
 */
export default function RemovalOutcomeChoices({
  name,
  legend,
  options,
  value,
  onChange,
}: RemovalOutcomeChoicesProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="pb-2 text-sm font-medium text-gray-800">
        {legend}
      </legend>
      {options.map((option) => {
        const id = `${name}-${option.outcome}`;
        const isSelected = value === option.outcome;

        return (
          <div
            key={option.outcome}
            className={clsx(
              "flex gap-2 rounded-lg border p-3",
              isSelected
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:bg-gray-50"
            )}
          >
            <input
              type="radio"
              id={id}
              name={name}
              value={option.outcome}
              checked={isSelected}
              onChange={() => onChange(option.outcome)}
              className="mt-1 h-4 w-4"
            />
            <div className="space-y-1">
              <label
                htmlFor={id}
                className={clsx(
                  "block text-sm font-medium",
                  option.isDestructive ? "text-red-600" : "text-gray-800"
                )}
              >
                {option.label}
              </label>
              <div className="space-y-1 text-sm text-gray-600">
                {option.detail}
              </div>
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
