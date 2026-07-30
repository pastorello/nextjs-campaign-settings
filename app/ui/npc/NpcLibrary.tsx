"use client";

import SelectButtonery from "../buttons/SelectButtonery";

import NpcCard from "./NpcCard";
import NpcItem from "@/app/lib/definitions/interfaces/npc/NpcItem";
import NpcMetaField from "@/app/lib/definitions/enums/npc/NpcMetaField";

export default function NpcLibrary(props: { items: NpcItem[] }) {
  return (
    <div className="w-full pt-5">
      <hr className="mb-4" />
      <div className={"grid gap-2 grid-cols-5"}>
        <SelectButtonery fieldKey={NpcMetaField.location} />
      </div>
      {props.items.map((item) => (
        <NpcCard cardItem={item} key={item.id} />
      ))}
    </div>
  );
}
