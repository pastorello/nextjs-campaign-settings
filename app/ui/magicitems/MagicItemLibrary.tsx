"use client";
import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";
import SelectButtonery from "../buttons/SelectButtonery";
import ButtonSize from "../buttons/BaseButton/ButtonSize";
import Spell from "@/app/lib/definitions/interfaces/spells/Spell";
import useFilterController from "@/app/lib/hooks/useFilterController";
import classes from "@/app/lib/config/spells/classes";
import { ItemCount } from "@/app/lib/data/getItemsCount";
import clsx from "clsx";
import MagicItemCard from "./MagicItemCard";
import MagicItem from "@/app/lib/definitions/interfaces/magicitem/MagicItem";
import MagicItemMetaField from "@/app/lib/definitions/enums/magicitem/MagicItemMetaField";

export default function MagicItemLibrary(props: {
  itemCount: ItemCount;
  items: MagicItem[];
}) {
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
