import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";

import type MetaValue from "@/app/lib/definitions/types/MetaValue";
import ImageInput from "./ImageInput";

/**
 * The image field (SPEC-020 T3): pick or drop a file, see its thumbnail,
 * replace it, remove it. A file is uploaded as soon as it is chosen, through
 * `POST /api/record-images` — `fetch` is replaced here, so no story reaches a
 * server.
 */
const meta = {
  component: ImageInput,
  args: { label: "Immagine", value: null, onChange: fn() },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
  // The control is controlled; the wrapper keeps the value it reports.
  render: function Render(args) {
    const [value, setValue] = useState<MetaValue | null>(args.value);
    return (
      <ImageInput
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof ImageInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Replaces `fetch` for one story and restores it afterwards. */
function answerUploadsWith(response: Response) {
  const original = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(response);
  return () => {
    globalThis.fetch = original;
  };
}

const png = () => new File(["x"], "mappa.png", { type: "image/png" });

export const Empty: Story = {};

export const WithImage: Story = {
  args: { value: 12 },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Sostituisci" })
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Rimuovi" })).toBeVisible();
  },
};

export const Uploaded: Story = {
  beforeEach: () =>
    answerUploadsWith(
      new Response(JSON.stringify({ id: 33 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ),
  play: async ({ args, canvasElement, userEvent }) => {
    const input =
      canvasElement.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("file input missing");
    await userEvent.upload(input, png());
    await waitFor(() => expect(args.onChange).toHaveBeenCalledWith(33));
  },
};

export const Refused: Story = {
  beforeEach: () =>
    answerUploadsWith(
      new Response(JSON.stringify({ error: "imageTooLarge" }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      })
    ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input =
      canvasElement.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("file input missing");
    await userEvent.upload(input, png());
    await expect(await canvas.findByRole("alert")).toBeVisible();
  },
};

export const Removing: Story = {
  args: { value: 12 },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Rimuovi" }));
    await expect(args.onChange).toHaveBeenCalledWith(null);
    await expect(
      await canvas.findByRole("button", { name: "Scegli un'immagine" })
    ).toBeVisible();
  },
};
