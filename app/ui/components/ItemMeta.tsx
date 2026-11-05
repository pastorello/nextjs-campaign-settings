import { ReactNode } from "react";

interface ItemMetaProps {
  label: string;
  // Always the output of a PageMeta `getDatum`, which is `string | ReactNode`.
  value: ReactNode;
}

// Only ever rendered on a dark card (`bg-slate-800`), where gray-400 is 5.6:1.
// TD-155 darkened it to gray-600 after measuring it on a white story canvas,
// which made the real cards fail at 1.9:1; TD-157 put it back.
const ItemMeta = ({ label, value }: ItemMetaProps) => (
  <div className="flex">
    <div className="w-[110px]">{label}:</div>
    <div className="flex-1 text-gray-400">{value}</div>
  </div>
);

export default ItemMeta;
