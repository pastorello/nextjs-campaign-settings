"use client";
import SelectButtonery from "../buttons/SelectButtonery";
import TreasureCard from "./TreasureCard";
import Treasure from "@/app/lib/definitions/interfaces/treasure/Treasure";
import TreasureMetaField from "@/app/lib/definitions/enums/treasure/TreasureMetaField";

export default function TreasureLibrary(props: { items: Treasure[] }) {
  return (
    <div className="w-full pt-5">
      <div className="grid gap-2 grid-cols-5">
        <SelectButtonery fieldKey={TreasureMetaField.category} />
      </div>
      {props.items.map((item) => (
        <TreasureCard cardItem={item} key={item.id} />
      ))}
    </div>
  );
}
