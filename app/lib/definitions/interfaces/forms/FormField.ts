import MetaValue from "../../types/MetaValue";
import { ResolvedOption } from "../../types/SelectOption";
import ControlType from "../../types/ControlType";

interface FormField {
  label: string;
  value: MetaValue;
  onChange: (newVal: MetaValue) => void;
  type: ControlType;
  options?: ResolvedOption[];
  multiple?: boolean;
  placeholder?: string;
}

export default FormField;
