"use client";

import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";
import Spell from "@/app/lib/definitions/interfaces/spells/Spell";
import SelectButtonery from "../buttons/SelectButtonery";
import ButtonSize from "../buttons/BaseButton/ButtonSize";
import SpellCard from "./SpellCard";

export default function SpellLibrary(props: { items: Spell[] }) {
  return (
    <div className="w-full pt-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <SelectButtonery
          fieldKey={SpellMetaField.classes}
          omitAllButton={true}
        />
      </div>
      <hr className="mb-4" />
      <div className="mb-4 flex w-full flex-wrap">
        <SelectButtonery
          fieldKey={SpellMetaField.level}
          buttonClassName="mx-1 flex min-w-14 flex-1 p-1"
          buttonSize={ButtonSize.squaredSmall}
        />
      </div>
      {props.items.map((item) => (
        <SpellCard cardItem={item} key={item.id} />
      ))}
    </div>
  );
}
