import { Label } from "@headlessui/react";

interface FormLabelProps {
  label: string;
}

const FormLabel = ({ label }: FormLabelProps) => (
  <Label className="mb-[10px] font-bold uppercase">{label}</Label>
);

export default FormLabel;
