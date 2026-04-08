"use client";

import SelectButtonery from "../buttons/SelectButtonery";
import { ItemCount } from "@/app/lib/data/getItemsCount";

import DeityCard from "./DeityCard";
import Patrono from "@/app/lib/definitions/interfaces/deities/Patrono";
import PatronoMetaField from "@/app/lib/definitions/enums/deities/PatronoMetaField";

export default function DeityLibrary(props: {
  itemCount: ItemCount;
  items: Patrono[];
}) {
  return (
    <div className="w-full pt-5">
      <hr className="mb-4" />
      <div className={"grid gap-2 grid-cols-8"}>
        <SelectButtonery fieldKey={PatronoMetaField.dominioAllineamento} />
        <SelectButtonery fieldKey={PatronoMetaField.allineamento} />
      </div>
      <div className="p-5">
        {props.items.map((item) => (
          <DeityCard cardItem={item} key={item.id} />
        ))}
      </div>
    </div>
  );
}
