"use client";

import clsx from "clsx";

import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";
import Spell from "@/app/lib/definitions/interfaces/spells/Spell";
import useFilterController from "@/app/lib/hooks/useFilterController";
import SelectButtonery from "../buttons/SelectButtonery";
import ButtonSize from "../buttons/BaseButton/ButtonSize";
import SpellCard from "./SpellCard";
import classes from "@/app/lib/config/spells/classes";
import { ItemCount } from "@/app/lib/data/getItemsCount";
import { useEffect } from "react";

export default function SpellLibrary(props: {
  itemCount: ItemCount;
  items: Spell[];
}) {
  const { onFilter } = useFilterController(SpellMetaField.classi);

  useEffect(() => {
    onFilter(0);
  }, []);

  return (
    <div className="w-full pt-5">
      <div className="grid gap-2 grid-cols-8">
        <SelectButtonery
          fieldKey={SpellMetaField.classi}
          omitAllButton={true}
        />
      </div>
      <hr className="mb-4" />
      <div className="mb-4 flex w-full">
        <SelectButtonery
          fieldKey={SpellMetaField.livello}
          buttonClassName="mx-1 flex w-[10%] p-1"
          buttonSize={ButtonSize.squaredSmall}
        />
      </div>
      {props.items.map((item) => (
        <SpellCard cardItem={item} key={item.id} />
      ))}
    </div>
  );
}
