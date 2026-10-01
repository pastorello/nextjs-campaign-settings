import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/lib/actions/authenticate", () => ({ authenticate: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props} />
  ),
}));

import LoginForm from "./login-form";

describe("LoginForm", () => {
  // SPEC-022 T4: the way to ask for a DM account starts here.
  it("links to the DM sign-up", () => {
    render(<LoginForm />);

    expect(screen.getByRole("link", { name: "signUpLink" })).toHaveAttribute(
      "href",
      "/signup"
    );
  });

  it("sends the sign-in on to the default system's dashboard", () => {
    const { container } = render(<LoginForm />);

    expect(container.querySelector('input[name="redirectTo"]')).toHaveAttribute(
      "value",
      "/dashboard/dnd5e"
    );
  });
});
