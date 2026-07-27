import MetaValue from "../../types/MetaValue";
import SelectOption from "../../types/SelectOption";
import ControlType from "../../types/ControlType";

interface FormField {
  label: string;
  value: MetaValue;
  onChange: (newVal: MetaValue) => void;
  type: ControlType;
  options?: SelectOption[];
  multiple?: boolean;
  placeholder?: string;
}

export default FormField;
