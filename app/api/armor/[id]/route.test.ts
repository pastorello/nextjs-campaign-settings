import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { findUnique, remove } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhArmor: { findUnique, delete: remove } },
}));
vi.mock("@/app/lib/data/recordImages/deleteRecordImage", () => ({
  default: vi.fn(),
}));

import { DELETE } from "./route";

const call = (id: string) =>
  DELETE(new Request(`http://localhost/api/armor/${id}`), {
    params: Promise.resolve({ id }),
  });

describe("DELETE /api/armor/[id] (SPEC-029)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", name: "dm", role: "dm" },
    } as never);
    findUnique.mockResolvedValue({ id: 3, imageId: null });
  });

  it("refuses an unauthenticated delete", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    expect((await call("3")).status).toBe(401);
    expect(remove).not.toHaveBeenCalled();
  });

  it("refuses a player", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "2", name: "p", role: "player" },
    } as never);

    expect((await call("3")).status).toBe(403);
    expect(remove).not.toHaveBeenCalled();
  });

  it("deletes an armor", async () => {
    expect((await call("3")).status).toBe(200);
    expect(remove).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it("answers 404 for a missing armor", async () => {
    findUnique.mockResolvedValue(null);

    expect((await call("3")).status).toBe(404);
  });
});
