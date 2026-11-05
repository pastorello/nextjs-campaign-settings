import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, mocked, spyOn, waitFor } from "storybook/test";

import createRootPlace from "@/app/lib/data/maps/createRootPlace";
import CreateWorldForm from "./CreateWorldForm";

/**
 * The one action an empty installation offers: name the world, upload its
 * map. The upload goes through `fetch`, the creation is a Server Action
 * (a spy, ADR-0021).
 */
const meta = {
  component: CreateWorldForm,
} satisfies Meta<typeof CreateWorldForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const map = new File(["x"], "aerivel.png", { type: "image/png" });

export const Empty: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Crea il mondo" })
    );
    await waitFor(async () =>
      expect(
        await canvas.findByText("Il nome del mondo è obbligatorio.")
      ).toBeVisible()
    );
  },
};

export const MissingMap: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome del mondo" }),
      "Aerivel"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Crea il mondo" })
    );
    await waitFor(async () =>
      expect(await canvas.findByText("Carica una mappa.")).toBeVisible()
    );
  },
};

export const Create: Story = {
  beforeEach: () => {
    spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "map-1" }), { status: 200 })
    );
    mocked(createRootPlace).mockResolvedValue({ ok: true });
  },
  play: async ({ canvasElement, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome del mondo" }),
      "Aerivel"
    );
    const input =
      canvasElement.querySelector<HTMLInputElement>("input[type=file]");
    if (!input) throw new Error("the map input is missing");
    await userEvent.upload(input, map);
    await userEvent.click(
      canvas.getByRole("button", { name: "Crea il mondo" })
    );

    await waitFor(() =>
      expect(createRootPlace).toHaveBeenCalledWith({
        title: "Aerivel",
        mapImage: "map-1",
      })
    );
    await waitFor(() => expect(getRouter().refresh).toHaveBeenCalled());
  },
};

export const UploadFailed: Story = {
  beforeEach: () => {
    spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("no", { status: 500 })
    );
  },
  play: async ({ canvasElement, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome del mondo" }),
      "Aerivel"
    );
    const input =
      canvasElement.querySelector<HTMLInputElement>("input[type=file]");
    if (!input) throw new Error("the map input is missing");
    await userEvent.upload(input, map);
    await userEvent.click(
      canvas.getByRole("button", { name: "Crea il mondo" })
    );

    await expect(createRootPlace).not.toHaveBeenCalled();
  },
};
