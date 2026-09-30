import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import requireDm, {
  ForbiddenError,
  UnauthorizedError,
} from "@/app/lib/auth/requireDm";
import requireApiDm from "@/app/lib/auth/requireApiDm";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const withUser = { user: { name: "dm", role: "dm" } };
const withPlayer = { user: { name: "p", role: "player" } };

describe("requireDm (mutation guard)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the session when one exists", async () => {
    vi.mocked(auth).mockResolvedValue(withUser as never);

    await expect(requireDm()).resolves.toBe(withUser);
  });

  it("throws UnauthorizedError when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(requireDm()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws when a session object has no user", async () => {
    vi.mocked(auth).mockResolvedValue({} as never);

    await expect(requireDm()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  // SPEC-022 T1: every mutation is the DM's.
  it("throws ForbiddenError for a player's session", async () => {
    vi.mocked(auth).mockResolvedValue(withPlayer as never);

    await expect(requireDm()).rejects.toBeInstanceOf(ForbiddenError);
  });

  // A role the session callback could not set is not a DM's: never
  // default to the powerful side.
  it("throws ForbiddenError when the session carries no role", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { name: "x" } } as never);

    await expect(requireDm()).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("requireApiDm (route-handler guard)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when authenticated, so the handler proceeds", async () => {
    vi.mocked(auth).mockResolvedValue(withUser as never);

    await expect(requireApiDm()).resolves.toBeNull();
  });

  it("returns a 401 response when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const res = await requireApiDm();

    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    await expect(res!.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns a 403 response for a player's session (SPEC-022 T1)", async () => {
    vi.mocked(auth).mockResolvedValue(withPlayer as never);

    const res = await requireApiDm();

    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    await expect(res!.json()).resolves.toEqual({ error: "Forbidden" });
  });
});
