import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import requireSession, {
  UnauthorizedError,
} from "@/app/lib/auth/requireSession";
import requireApiSession from "@/app/lib/auth/requireApiSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const withUser = { user: { name: "dm" } };

describe("requireSession (mutation guard)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the session when one exists", async () => {
    vi.mocked(auth).mockResolvedValue(withUser as never);

    await expect(requireSession()).resolves.toBe(withUser);
  });

  it("throws UnauthorizedError when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(requireSession()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws when a session object has no user", async () => {
    vi.mocked(auth).mockResolvedValue({} as never);

    await expect(requireSession()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe("requireApiSession (route-handler guard)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when authenticated, so the handler proceeds", async () => {
    vi.mocked(auth).mockResolvedValue(withUser as never);

    await expect(requireApiSession()).resolves.toBeNull();
  });

  it("returns a 401 response when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await requireApiSession();

    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    await expect(res!.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
