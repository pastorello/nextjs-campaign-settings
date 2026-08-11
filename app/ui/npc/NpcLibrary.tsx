"use client";

import NpcCard from "./NpcCard";
import NpcItem from "@/app/lib/definitions/interfaces/npc/NpcItem";
import DerivedPlacement from "@/app/lib/definitions/interfaces/maps/DerivedPlacement";
import OptionBundle from "@/app/lib/definitions/types/OptionBundle";

export default function NpcLibrary(props: {
  items: NpcItem[];
  placements: Record<number, DerivedPlacement>;
  optionBundle?: OptionBundle | undefined;
}) {
  return (
    <div className="w-full pt-5">
      <hr className="mb-4" />
      {props.items.map((item) => (
        <NpcCard
          cardItem={item}
          placement={props.placements[item.id]}
          optionBundle={props.optionBundle}
          key={item.id}
        />
      ))}
    </div>
  );
}
