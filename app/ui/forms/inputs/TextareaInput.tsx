import { Fragment } from "react";
import { Field, Textarea } from "@headlessui/react";

import FormLabel from "./FormLabel";
import isValidString from "@/app/lib/utils/validators/isValidString";
import clsx from "clsx";

interface TextareaInputProps {
  value: string;
  label: string;
  onChange: Function;
  placeholder: string;
}
const TextareaInput = ({
  value,
  label,
  onChange,
  placeholder,
}: TextareaInputProps) => {
  return (
    <Field className="w-full">
      {isValidString(label) && <FormLabel label={label} />}
      <div className="relative">
        <Textarea as={Fragment}>
          {({ focus, hover }) => (
            <textarea
              onChange={(event) => onChange(event.target.value)}
              value={value}
              placeholder={isValidString(placeholder) ? placeholder : ""}
              className={clsx(
                "flex h-[150px] w-full resize-none! items-center rounded-md border px-[5px] focus:ring-indigo-500",
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
