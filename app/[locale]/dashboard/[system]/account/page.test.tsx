import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireDmPage, fetchOwnAccount, notFound } = vi.hoisted(() => ({
  requireDmPage: vi.fn(),
  fetchOwnAccount: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/app/lib/auth/requireDmPage", () => ({ default: requireDmPage }));
vi.mock("@/app/lib/data/accounts/fetchOwnAccount", () => ({
  default: fetchOwnAccount,
}));
vi.mock("@/app/ui/accounts/OwnAccountForms", () => ({
  default: ({ name, email }: { name: string; email: string }) => (
    <p>
      forms for {name} {email}
    </p>
  ),
}));

import AccountPage from "./page";

describe("AccountPage (SPEC-022 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireDmPage.mockResolvedValue(undefined);
  });

  it("guards itself, then shows the signed-in account's forms", async () => {
    fetchOwnAccount.mockResolvedValue({ name: "Mira", email: "m@x.test" });

    render(await AccountPage());

    expect(requireDmPage).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.getByText("forms for Mira m@x.test")).toBeInTheDocument();
  });

  it("is a 404 when the account vanished", async () => {
    fetchOwnAccount.mockResolvedValue(null);

    await expect(AccountPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
