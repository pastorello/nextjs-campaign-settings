"use client";

import SelectButtonery from "../buttons/SelectButtonery";
import { ItemCount } from "@/app/lib/data/getItemsCount";

import PngCard from "./PngCard";
import PngItem from "@/app/lib/definitions/interfaces/png/PngItem";
import PngMetaField from "@/app/lib/definitions/enums/png/PngMetaField";

export default function PngLibrary(props: {
  itemCount: ItemCount;
  items: PngItem[];
}) {
  return (
    <div className="w-full pt-5">
      <hr className="mb-4" />
      <div className={"grid gap-2 grid-cols-5"}>
        <SelectButtonery fieldKey={PngMetaField.luogo} />
      </div>
      {props.items.map((item) => (
        <PngCard cardItem={item} key={item.id} />
      ))}
    </div>
  );
}
