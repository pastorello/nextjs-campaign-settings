import MetaValue from "@/app/lib/definitions/types/MetaValue";
import { Fragment } from "react";
import { Field, Textarea } from "@headlessui/react";

import FormLabel from "./FormLabel";
import isValidString from "@/app/lib/utils/validators/isValidString";
import clsx from "clsx";

interface TextareaInputProps {
  // See TextInput: every control takes MetaValue and narrows it itself.
  value: MetaValue;
  label: string;
  onChange: (value: MetaValue) => void;
  placeholder?: string;
  /** See `PageMeta.tall` (TD-120) — a taller box for long-form content. */
  tall?: boolean;
}
const TextareaInput = ({
  value,
  label,
  onChange,
  placeholder,
  tall,
}: TextareaInputProps) => {
  return (
    <Field className="w-full">
      {isValidString(label) && <FormLabel label={label} />}
      <div className="relative">
        <Textarea as={Fragment}>
          {({ focus, hover }) => (
            <textarea
              onChange={(event) => onChange(event.target.value)}
              value={String(value ?? "")}
              placeholder={isValidString(placeholder) ? placeholder : ""}
              className={clsx(
                "flex w-full resize-none! items-center rounded-md border px-[5px] focus:ring-indigo-500",
                tall ? "h-[280px]" : "h-[150px]",
                {
                  "bg-blue-100": focus,
                  shadow: hover,
                }
              )}
            ></textarea>
          )}
        </Textarea>
      </div>
    </Field>
  );
};

export default TextareaInput;
