import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { findUnique, remove, count } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  remove: vi.fn(),
  count: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    dhAdversary: { findUnique, delete: remove },
    dhEnvironmentAdversary: { count },
  },
}));
vi.mock("@/app/lib/data/recordImages/deleteRecordImage", () => ({
  default: vi.fn(),
}));

import { DELETE } from "./route";

const call = (id: string) =>
  DELETE(new Request(`http://localhost/api/adversaries/${id}`), {
    params: Promise.resolve({ id }),
  });

describe("DELETE /api/adversaries/[id] (SPEC-028 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "1", name: "dm", role: "dm" },
    } as never);
    findUnique.mockResolvedValue({ id: 3, name: "Wraith", imageId: null });
    count.mockResolvedValue(0);
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

  it("deletes an adversary", async () => {
    expect((await call("3")).status).toBe(200);
    expect(remove).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it("refuses, with the count, an adversary an environment lists", async () => {
    count.mockResolvedValue(1);

    const response = await call("3");

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      refusal: { key: "adversaryInEnvironments", values: { count: 1 } },
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it("answers 404 for a missing adversary", async () => {
    findUnique.mockResolvedValue(null);

    expect((await call("3")).status).toBe(404);
  });
});
