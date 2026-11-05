import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import PageTitle from "./PageTitle";
import SectionTitle from "./SectionTitle";

/**
 * The two headings every page shares (TD-116): `PageTitle` is the page's one
 * `h1`, in Lusitana; `SectionTitle` is an in-page `h2`.
 */
const meta = {
  component: PageTitle,
  subcomponents: { SectionTitle },
  args: { children: "Incantesimi" },
} satisfies Meta<typeof PageTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Page: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { level: 1, name: "Incantesimi" })
    ).toBeVisible();
  },
};

export const Section: Story = {
  render: () => <SectionTitle>Scene</SectionTitle>,
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { level: 2, name: "Scene" })
    ).toBeVisible();
  },
};

export const PageWithSections: Story = {
  render: (args) => (
    <div className="space-y-4">
      <PageTitle {...args}>La caduta di Kang</PageTitle>
      <SectionTitle>Scene</SectionTitle>
      <p>…</p>
      <SectionTitle>Bottino</SectionTitle>
      <p>…</p>
    </div>
  ),
};
