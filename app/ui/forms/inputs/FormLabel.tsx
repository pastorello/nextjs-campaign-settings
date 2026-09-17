import { Label } from "@headlessui/react";

interface FormLabelProps {
  label: string;
}

const FormLabel = ({ label }: FormLabelProps) => (
  <Label className="mb-[10px] text-sm font-medium text-gray-900">{label}</Label>
);

export default FormLabel;
