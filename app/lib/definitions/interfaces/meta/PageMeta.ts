import { ReactNode } from "react";

import SelectOption from "@/app/lib/definitions/types/SelectOption";
import SelectValueType from "@/app/lib/definitions/types/SelectValueType";
import ControlType from "@/app/lib/definitions/types/ControlType";
import FieldType from "@/app/lib/definitions/types/FieldType";

interface PageMeta {
  metaField: string;
  fieldType: FieldType;
  controlType: ControlType;
  defaultValue: SelectValueType | boolean;
  label?: string;
  options?: SelectOption[];
  placeholder?: string;
  validator: any;
  getDatum: (rawValue: any, options?: any) => string | ReactNode;
}

export default PageMeta;
