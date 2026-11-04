import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import campaignMeta from "@/app/lib/config/campaigns/campaignMeta";
import BespokeFormErrorSummary from "../forms/BespokeFormErrorSummary";
import FormErrorSummary from "./FormErrorSummary";

/**
 * The alert above a form whose save the server refused (TD-124): one line per
 * field, labelled from the field's `PageMeta` and translated from the error
 * key. `BespokeFormErrorSummary` is the same for a form outside the metadata
 * layer, which passes its own meta record.
 */
const meta = {
  component: FormErrorSummary,
  subcomponents: { BespokeFormErrorSummary },
  args: {
    errors: {
      name: [{ key: "tooLong", values: { maximum: 80 } }],
      level: [{ key: "tooBig", values: { maximum: 9 } }],
    },
  },
} satisfies Meta<typeof FormErrorSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MetadataFields: Story = {
  play: async ({ canvas }) => {
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveTextContent("Controlla i campi segnalati");
    await expect(alert).toHaveTextContent("Livello");
  },
};

/** With nothing to report, nothing renders. */
export const NoErrors: Story = {
  args: { errors: {} },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("alert")).toBeNull();
  },
};

export const OwnLabels: Story = {
  args: {
    errors: { mood: [{ key: "invalid" }] },
    labels: { mood: "Atmosfera" },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("Atmosfera");
  },
};

export const Bespoke: Story = {
  render: () => (
    <BespokeFormErrorSummary
      meta={campaignMeta}
      errors={{ title: [{ key: "tooShort", values: { minimum: 1 } }] }}
    />
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toBeVisible();
  },
};
