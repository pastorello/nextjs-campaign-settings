import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import { authenticate } from "@/app/lib/actions/authenticate";
import LoginForm from "./login-form";
import { dashboardPath } from "@/i18n/dashboardPath";

/**
 * The sign-in form. `authenticate` is a Server Action, so a spy here
 * (ADR-0021): it answers with the error message, or nothing on success.
 */
const meta = {
  component: LoginForm,
  parameters: {
    layout: "centered",
    nextjs: { navigation: { pathname: "/login", query: {} } },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WrongCredentials: Story = {
  beforeEach: () => {
    mocked(authenticate).mockResolvedValue("Credenziali non valide.");
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/email/i), "dm@example.test");
    await userEvent.type(canvas.getByLabelText(/password/i), "sbagliata");
    await userEvent.click(canvas.getByRole("button", { name: /accedi/i }));

    await expect(
      await canvas.findByText("Credenziali non valide.")
    ).toBeVisible();
    await waitFor(() => expect(authenticate).toHaveBeenCalledOnce());
  },
};

/** After sign-in the form posts the page the user was sent away from. */
export const WithCallback: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/login",
        query: { callbackUrl: dashboardPath("dnd5e", "/spells") },
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('input[name="redirectTo"]')
    ).toHaveValue(dashboardPath("dnd5e", "/spells"));
  },
};
