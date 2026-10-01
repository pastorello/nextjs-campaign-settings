import DhWeaponSlot from "@/app/lib/definitions/enums/daggerheart/DhWeaponSlot";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** A weapon's two slots (SPEC-029 T1), as select options. */
const dhWeaponSlots: SelectOption<DhWeaponSlot>[] = [
  { value: DhWeaponSlot.Primary, labelKey: "daggerheart.weaponSlots.primary" },
  {
    value: DhWeaponSlot.Secondary,
    labelKey: "daggerheart.weaponSlots.secondary",
  },
];

export default dhWeaponSlots;
