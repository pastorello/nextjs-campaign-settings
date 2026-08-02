import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticate } from "@/app/lib/actions/authenticate";
import { signIn } from "@/auth";
import logServerIssue from "@/app/lib/notifications/logServerIssue";

vi.mock("@/auth", () => ({ signIn: vi.fn() }));

// `next-auth`'s own barrel pulls in `next/server`, which the vitest/jsdom
// environment can't resolve, and `@auth/core` (where the real classes live)
// is a transitive dependency pnpm does not hoist, so it isn't resolvable here
// either. `actions.ts` imports `AuthError` straight from `next-auth`, so the
// mock below stands in for the module with minimal classes that reproduce the
// one property the code under test reads (`error.type`) — `error instanceof
// AuthError` still holds because both the mock and the code resolve the same
// mocked module.
const { AuthError, CredentialsSignin } = vi.hoisted(() => {
  class AuthError extends Error {
    type = "AuthError";
  }
  class CredentialsSignin extends AuthError {
    override type = "CredentialsSignin";
  }
  return { AuthError, CredentialsSignin };
});

vi.mock("next-auth", () => ({ AuthError, CredentialsSignin }));

vi.mock("@/app/lib/notifications/logServerIssue", () => ({
  default: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

const formData = new FormData();
formData.set("email", "dm@example.com");
formData.set("password", "correct-horse");

describe("authenticate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined on a successful sign-in", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined);

    await expect(authenticate(undefined, formData)).resolves.toBeUndefined();
  });

  it("returns the invalid-credentials message for a CredentialsSignin error", async () => {
    vi.mocked(signIn).mockRejectedValue(new CredentialsSignin());

    await expect(authenticate(undefined, formData)).resolves.toBe(
      "invalidCredentials"
    );
  });

  it("logs the failure type for a CredentialsSignin error", async () => {
    vi.mocked(signIn).mockRejectedValue(new CredentialsSignin());

    await authenticate(undefined, formData);

    expect(logServerIssue).toHaveBeenCalledWith(
      "Sign-in failed: CredentialsSignin"
    );
  });

  it("returns a generic message for any other AuthError type", async () => {
    vi.mocked(signIn).mockRejectedValue(new AuthError());

    await expect(authenticate(undefined, formData)).resolves.toBe(
      "somethingWrong"
    );
  });

  it("rethrows an error that is not an AuthError", async () => {
    const boom = new Error("boom");
    vi.mocked(signIn).mockRejectedValue(boom);

    await expect(authenticate(undefined, formData)).rejects.toBe(boom);
  });

  it("does not log when the error is not an AuthError", async () => {
    vi.mocked(signIn).mockRejectedValue(new Error("boom"));

    await authenticate(undefined, formData).catch(() => {});

    expect(logServerIssue).not.toHaveBeenCalled();
  });
});
