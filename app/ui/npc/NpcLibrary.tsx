"use client";

import NpcCard from "./NpcCard";
import NpcItem from "@/app/lib/definitions/interfaces/npc/NpcItem";
import DerivedPlacement from "@/app/lib/definitions/interfaces/maps/DerivedPlacement";

export default function NpcLibrary(props: {
  items: NpcItem[];
  placements: Record<number, DerivedPlacement>;
}) {
  return (
    <div className="w-full pt-5">
      <hr className="mb-4" />
      {props.items.map((item) => (
        <NpcCard
          cardItem={item}
          placement={props.placements[item.id]}
          key={item.id}
        />
      ))}
    </div>
  );
}
