"use client";

import FactionCard from "./FactionCard";
import Faction from "@/app/lib/definitions/interfaces/faction/Faction";
import { RosterMember } from "@/app/lib/data/faction/fetchFactionRosters";

// No `SelectButtonery` row: a faction has no closed-vocabulary field to filter
// by, and SPEC-006 §9's open question 2 says ship whatever the shared
// component gives rather than add filters nothing asked for.
export default function FactionLibrary(props: {
  items: Faction[];
  rosters: Map<number, RosterMember[]>;
}) {
  return (
    <div className="w-full pt-5">
      {props.items.map((item) => (
        <FactionCard
          cardItem={item}
          roster={props.rosters.get(item.id) ?? []}
          key={item.id}
        />
      ))}
    </div>
  );
}
