import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/ui/accounts/SignUpForm", () => ({
  default: () => <form aria-label="sign up" />,
}));
vi.mock("@/app/ui/icons/CampaignSettingsLogo", () => ({
  default: () => <span>logo</span>,
}));

import SignUpPage from "./page";

describe("SignUpPage (SPEC-022 T4)", () => {
  it("renders the sign-up form under the logo", () => {
    render(<SignUpPage />);

    expect(screen.getByRole("form", { name: "sign up" })).toBeInTheDocument();
    expect(screen.getByText("logo")).toBeInTheDocument();
  });
});
