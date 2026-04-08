import ControlType from "../../types/ControlType";
import PrimitiveValue from "../../types/PrimitiveValue";
import SelectOption from "../../types/SelectOption";

interface FormFieldProps {
  label: string;
  defaultValue: PrimitiveValue | number[] | string[];
  type: ControlType;
  options?: SelectOption[];
}

export default FormFieldProps;
