import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen, waitFor } from "storybook/test";

import updateZoneGrid from "@/app/lib/data/maps/updateZoneGrid";
import { worldMapSize } from "@/.storybook/fixtures/maps";
import GridScale from "@/app/lib/definitions/enums/geography/GridScale";
import MapGridConfigPanel from "./MapGridConfigPanel";

/**
 * The map's grid dialog: the width in squares and a scale, with the height
 * derived from the image. The save is a Server Action, so a spy (ADR-0021).
 */
const meta = {
  component: MapGridConfigPanel,
  args: {
    placeId: 7,
    isOpen: true,
    onClose: fn(),
    gridColumns: null,
    gridScale: null,
    imageSize: worldMapSize,
    onSaved: fn(),
  },
} satisfies Meta<typeof MapGridConfigPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotConfigured: Story = {
  play: async () => {
    await screen.findByRole("dialog");
    await expect(screen.getByTestId("derived-rows")).toHaveTextContent("—");
  },
};

/** 800 × 600 over 40 squares across: 30 down. */
export const Configured: Story = {
  args: { gridColumns: 40, gridScale: GridScale.Kingdom },
  play: async () => {
    await screen.findByRole("dialog");
    await expect(screen.getByTestId("derived-rows")).toHaveTextContent("30");
    await expect(screen.getByRole("combobox", { name: "Scala" })).toHaveValue(
      GridScale.Kingdom
    );
  },
};

export const Save: Story = {
  beforeEach: () => {
    mocked(updateZoneGrid).mockResolvedValue({ ok: true });
  },
  play: async ({ args, userEvent }) => {
    await screen.findByRole("dialog");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Larghezza in quadretti" }),
      "20"
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Scala" }),
      GridScale.Province
    );
    await expect(screen.getByTestId("derived-rows")).toHaveTextContent("15");
    await userEvent.click(
      screen.getByRole("button", { name: "Salva la griglia" })
    );

    await waitFor(() =>
      expect(updateZoneGrid).toHaveBeenCalledWith({
        id: 7,
        gridColumns: 20,
        gridScale: GridScale.Province,
      })
    );
    await expect(args.onSaved).toHaveBeenCalledWith(20, GridScale.Province);
    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const Refused: Story = {
  beforeEach: () => {
    mocked(updateZoneGrid).mockResolvedValue({
      ok: false,
      errors: { gridColumns: [{ key: "tooBig", values: { maximum: 200 } }] },
    });
  },
  play: async ({ args, userEvent }) => {
    await screen.findByRole("dialog");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Larghezza in quadretti" }),
      "9999"
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Salva la griglia" })
    );

    await waitFor(async () =>
      expect(await screen.findByRole("alert")).toBeVisible()
    );
    await expect(args.onSaved).not.toHaveBeenCalled();
  },
};

/** The image is still loading: the derived height is a dash, never `0`. */
export const ImageNotLoaded: Story = {
  args: { imageSize: null, gridColumns: 40, gridScale: GridScale.Kingdom },
  play: async () => {
    await screen.findByRole("dialog");
    await expect(screen.getByTestId("derived-rows")).toHaveTextContent("—");
  },
};
