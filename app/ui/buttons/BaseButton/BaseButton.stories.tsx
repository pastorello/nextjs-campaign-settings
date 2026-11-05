import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent } from "storybook/test";

import BaseButton from ".";
import ButtonSize from "./ButtonSize";
import ButtonState from "./ButtonState";
import ButtonVariant from "./ButtonVariant";
import IconType from "./IconType";
import { dashboardPath } from "@/i18n/dashboardPath";

const meta = {
  component: BaseButton,
  args: {
    children: "Salva",
    onClick: fn(),
    variant: ButtonVariant.primary,
    size: ButtonSize.medium,
    buttonState: ButtonState.Default,
  },
  argTypes: {
    variant: { control: "select", options: Object.values(ButtonVariant) },
    size: { control: "select", options: Object.values(ButtonSize) },
    buttonState: { control: "select", options: Object.values(ButtonState) },
    icon: {
      control: "select",
      options: [undefined, ...Object.values(IconType)],
    },
  },
} satisfies Meta<typeof BaseButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Salva" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Secondary: Story = {
  args: { variant: ButtonVariant.secondary, children: "Annulla" },
};

export const Neutral: Story = {
  args: { variant: ButtonVariant.neutral, children: "Chiudi" },
};

export const Danger: Story = {
  args: { variant: ButtonVariant.danger, children: "Elimina" },
};

export const GhostDanger: Story = {
  args: { variant: ButtonVariant.ghostDanger, children: "Rimuovi" },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {Object.values(ButtonSize).map((size) =>
        // The square size is for an icon alone, which then needs a label.
        size === ButtonSize.squaredSmall ? (
          <BaseButton key={size} {...args} size={size} ariaLabel="Cerca">
            {undefined}
          </BaseButton>
        ) : (
          <BaseButton key={size} {...args} size={size}>
            {size}
          </BaseButton>
        )
      )}
    </div>
  ),
  args: { icon: IconType.search },
};

export const WithIcon: Story = {
  args: { icon: IconType.chevronDown, children: "Ordina" },
};

/** An icon-only button needs `ariaLabel`, or a screen reader says only "button" (TD-15). */
export const IconOnly: Story = {
  args: {
    children: undefined,
    icon: IconType.search,
    ariaLabel: "Cerca",
    size: ButtonSize.squaredSmall,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Cerca" })).toBeVisible();
  },
};

export const Loading: Story = {
  args: { buttonState: ButtonState.Loading },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Salva" });
    await expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Salva" })).toBeDisabled();
  },
};

/** A filter chip: `isToggle` exposes the selection as `aria-pressed` (TD-134). */
export const ToggleActive: Story = {
  args: {
    isToggle: true,
    buttonState: ButtonState.Active,
    variant: ButtonVariant.secondary,
    children: "Livello 3",
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Livello 3", pressed: true })
    ).toBeVisible();
  },
};

/** With `to` it renders a `next/link` rather than a button. */
export const AsLink: Story = {
  args: { to: dashboardPath("dnd5e", "/spells/create"), children: "Nuovo" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Nuovo" })).toHaveAttribute(
      "href",
      dashboardPath("dnd5e", "/spells/create")
    );
  },
};

/** SPEC-033's export: a plain `<a download>`, never prefetched by `next/link`. */
export const DownloadLink: Story = {
  args: {
    to: "/api/export/spells",
    download: true,
    variant: ButtonVariant.neutral,
    children: "Esporta",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Esporta" })).toHaveAttribute(
      "download"
    );
  },
};

/** Without `onClick` the button submits its form. */
export const Submit: Story = {
  render: ({ children }) => <BaseButton>{children}</BaseButton>,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Salva" })).toHaveAttribute(
      "type",
      "submit"
    );
  },
};
