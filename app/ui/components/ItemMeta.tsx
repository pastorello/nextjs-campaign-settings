import PrimitiveValue from "../types/PrimitiveValue";

interface ItemMetaProps {
  label: string;
  value: PrimitiveValue;
}

const ItemMeta = ({ label, value }: ItemMetaProps) => (
  <div className="flex">
    <div className="w-[110px]">{label}:</div>
    <div className="flex-1 text-gray-400">{value}</div>
  </div>
);

export default ItemMeta;
