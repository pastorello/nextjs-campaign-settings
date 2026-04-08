import FieldType from "../../types/FieldType";
import SelectValueType from "../../types/SelectValueType";

interface FilterMeta {
  metaField: string;
  value: SelectValueType;
  fieldType: FieldType;
  setter: Function;
  ignoreFilter?: string[];
  compareStats?: string[];
  defaultValue: number | number[];
}

export default FilterMeta;
