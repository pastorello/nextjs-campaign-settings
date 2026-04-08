import SelectOption from "../../types/SelectOption";
import ControlType from "../../types/ControlType";

interface FormField {
  label: string;
  value: any;
  onChange: (newVal: any) => void;
  type: ControlType;
  options?: SelectOption[];
  multiple?: boolean;
  placeholder?: string;
}

export default FormField;
