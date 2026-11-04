import { Field } from "@headlessui/react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";

import IconType from "@/app/ui/buttons/BaseButton/IconType";
import type MetaValue from "@/app/lib/definitions/types/MetaValue";
import FormLabel from "./FormLabel";
import TextareaInput from "./TextareaInput";
import TextInput from "./TextInput";

/**
 * The plain text controls the metadata layer renders for `ControlType.Text`
 * and `ControlType.Textarea`. Controlled: the form owns the value.
 */
const meta = {
  component: TextInput,
  subcomponents: { TextareaInput, FormLabel },
  args: {
    label: "Nome",
    value: "",
    onChange: fn(),
    placeholder: "Lama di brina",
  },
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Wires the controlled value to local state, so typing shows. */
function Stateful(props: React.ComponentProps<typeof TextInput>) {
  const [value, setValue] = useState<MetaValue>(props.value);
  return (
    <TextInput
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange(next);
      }}
    />
  );
}

export const Text: Story = {
  render: (args) => <Stateful {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole("textbox", { name: "Nome" });
    await userEvent.type(input, "Lanterna");
    await expect(input).toHaveValue("Lanterna");
    await expect(args.onChange).toHaveBeenLastCalledWith("Lanterna");
  },
};

export const Filled: Story = { args: { value: "Lama di brina" } };

export const WithIcon: Story = {
  args: { label: "Cerca", icon: IconType.search, placeholder: "Cerca..." },
};

export const Password: Story = {
  args: {
    label: "Password",
    inputType: "password",
    autoComplete: "current-password",
    placeholder: "",
  },
};

export const Textarea: Story = {
  render: (args) => (
    <TextareaInput
      label="Note"
      value="Un velo di ghiaccio ricopre l'arma."
      onChange={args.onChange}
    />
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox", { name: "Note" })).toHaveValue(
      "Un velo di ghiaccio ricopre l'arma."
    );
  },
};

export const TallTextarea: Story = {
  render: (args) => (
    <TextareaInput label="Note" value="" tall onChange={args.onChange} />
  ),
};

/** Headless UI's `Label`: it must sit in the `Field` it labels. */
export const Label: Story = {
  render: () => (
    <Field>
      <FormLabel label="Livello" />
    </Field>
  ),
};
