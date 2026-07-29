"use client";

import SelectButtonery from "../buttons/SelectButtonery";

import DeityCard from "./DeityCard";
import Deity from "@/app/lib/definitions/interfaces/deities/Deity";
import DeityMetaField from "@/app/lib/definitions/enums/deities/DeityMetaField";

export default function DeityLibrary(props: { items: Deity[] }) {
  return (
    <div className="w-full pt-5">
      <hr className="mb-4" />
      <div className={"grid gap-2 grid-cols-8"}>
        <SelectButtonery fieldKey={DeityMetaField.alignmentDomain} />
        <SelectButtonery fieldKey={DeityMetaField.alignment} />
      </div>
      <div className="p-5">
        {props.items.map((item) => (
          <DeityCard cardItem={item} key={item.id} />
        ))}
      </div>
    </div>
  );
}
