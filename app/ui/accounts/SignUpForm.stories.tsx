import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import requestDmAccount from "@/app/lib/data/accounts/requestDmAccount";
import SignUpForm from "./SignUpForm";

/** The logged-out DM sign-up (SPEC-022 T4). */
const meta = { component: SignUpForm } satisfies Meta<typeof SignUpForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Requested: Story = {
  beforeEach: () => {
    mocked(requestDmAccount).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Nome"), "Mara Venti");
    await userEvent.type(canvas.getByLabelText("Email"), "m@example.test");
    await userEvent.type(canvas.getByLabelText("Password"), "una-frase-lunga");
    await userEvent.click(canvas.getByRole("button"));
    await waitFor(() => expect(requestDmAccount).toHaveBeenCalled());
    await expect(await canvas.findByRole("heading")).toBeVisible();
  },
};

export const Refused: Story = {
  beforeEach: () => {
    mocked(requestDmAccount).mockResolvedValue({
      ok: false,
      errors: { password: [{ key: "tooShort", values: { minimum: 8 } }] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button"));
    await waitFor(() => expect(requestDmAccount).toHaveBeenCalled());
  },
};
