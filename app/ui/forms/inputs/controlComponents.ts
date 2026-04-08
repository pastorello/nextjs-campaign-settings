import Select from "@/app/ui/forms/inputs/Select";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import CheckboxInput from "@/app/ui/forms/inputs/CheckboxInput";
import TextareaInput from "@/app/ui/forms/inputs/TextareaInput";
import ControlType from "@/app/lib/definitions/types/ControlType";

const controlComponents: Record<ControlType, React.ComponentType<any>> = {
  text: TextInput,
  textarea: TextareaInput,
  bool: CheckboxInput,
  select: Select,
  multiselect: Select,
};

export default controlComponents;
