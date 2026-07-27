"use client";
import SelectButtonery from "../buttons/SelectButtonery";
import MagicItemCard from "./MagicItemCard";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";

export default function MagicItemLibrary(props: { items: MagicItem[] }) {
  return (
    <div className="w-full pt-5">
      <div className="grid gap-2 grid-cols-8">
        <SelectButtonery fieldKey={MagicItemMetaField.rarita} />
      </div>
      <hr className="mb-4" />
      <div className={"grid gap-2 grid-cols-5"}>
        <SelectButtonery fieldKey={MagicItemMetaField.tipo} />
      </div>
      {props.items.map((item) => (
        <MagicItemCard cardItem={item} key={item.id} />
      ))}
    </div>
  );
}
