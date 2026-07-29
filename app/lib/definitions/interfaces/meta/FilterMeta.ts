import FieldType from "../../types/FieldType";
import SelectValueType from "../../types/SelectValueType";

interface FilterMeta {
  metaField: string;
  value: SelectValueType;
  fieldType: FieldType;
  setter: (...args: unknown[]) => unknown;
  ignoreFilter?: string[];
  compareStats?: string[];
  defaultValue: number | number[];
}

export default FilterMeta;
