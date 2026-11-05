import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, spyOn, waitFor } from "storybook/test";

import { MapProvider } from "@/app/modules/maps/contexts/MapContext";
import { MapSearchBar } from "./MapSearchBar";

/**
 * Vendored (CLAUDE.md, "unused is not dead"): the starter's country search.
 * Its one request, `/api/countries/search`, is answered here; no story
 * reaches the network.
 */
const meta = {
  component: MapSearchBar,
  args: { onCountrySelect: fn() },
  beforeEach: () => {
    spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify([
            { id: "ae", name: "Aerivel", nameLong: "Regno di Aerivel" },
            { id: "br", name: "Brina", nameLong: "Marca di Brina" },
          ]),
          { status: 200 }
        )
      )
    );
  },
  decorators: [
    (Story) => (
      <MapProvider>
        <div className="relative h-96 w-full bg-gray-200">
          <Story />
        </div>
      </MapProvider>
    ),
  ],
} satisfies Meta<typeof MapSearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("textbox", { name: "Search countries" })
    ).toBeVisible();
  },
};

/**
 * TD-165: the results `listbox` holds plain buttons, not `option`s
 * (`aria-required-children`). Vendored and unwired, so not edited here.
 */
export const Results: Story = {
  parameters: { a11y: { test: "todo" } },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("textbox", { name: "Search countries" })
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await userEvent.click(await canvas.findByText("Aerivel"));
    await expect(args.onCountrySelect).toHaveBeenCalledWith("ae");
  },
};
