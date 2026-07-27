import Select from "@/app/ui/forms/inputs/Select";
import TextInput from "@/app/ui/forms/inputs/TextInput";
import CheckboxInput from "@/app/ui/forms/inputs/CheckboxInput";
import TextareaInput from "@/app/ui/forms/inputs/TextareaInput";
import ControlProps from "@/app/lib/definitions/interfaces/forms/ControlProps";
import ControlType from "@/app/lib/definitions/types/ControlType";

/**
 * Which component renders which control type. Typed on the shared ControlProps
 * now instead of `ComponentType<any>` — the four controls disagreed about
 * `value` until they were aligned on MetaValue (TD-08 step 4).
 */
const controlComponents: Record<
  ControlType,
  React.ComponentType<ControlProps>
> = {
  text: TextInput,
  textarea: TextareaInput,
  bool: CheckboxInput,
  select: Select,
  multiselect: Select,
};

export default controlComponents;
