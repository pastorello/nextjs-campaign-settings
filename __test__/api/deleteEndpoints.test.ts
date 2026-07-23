import { beforeEach, describe, expect, it, vi } from "vitest";

// Every DELETE handler is guarded by requireApiSession, which calls auth().
// Mock auth() to drive the session, and mock each delete function so no
// database is touched — the 401 path must reject *before* any DB call anyway.
import { auth } from "@/auth";

import { DELETE as deleteSpell } from "@/app/api/spells/[id]/route";
import { DELETE as deleteDeity } from "@/app/api/deities/[id]/route";
import { DELETE as deleteMagicItem } from "@/app/api/magicitems/[id]/route";
import { DELETE as deletePng } from "@/app/api/png/[id]/route";

import { deleteSpellById } from "@/app/lib/data/spells/deleteSpellById";
import { deleteDeityById } from "@/app/lib/data/deities/deleteDeityById";
import { deleteMagicItemById } from "@/app/lib/data/magicitems/deleteMagicItemById";
import { deletePngById } from "@/app/lib/data/png/deletePngById";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/app/lib/data/spells/deleteSpellById", () => ({
  deleteSpellById: vi.fn(),
}));
vi.mock("@/app/lib/data/deities/deleteDeityById", () => ({
  deleteDeityById: vi.fn(),
}));
vi.mock("@/app/lib/data/magicitems/deleteMagicItemById", () => ({
  deleteMagicItemById: vi.fn(),
}));
vi.mock("@/app/lib/data/png/deletePngById", () => ({
  deletePngById: vi.fn(),
}));

const context = { params: Promise.resolve({ id: "1" }) };
const req = new Request("http://localhost/api/x/1", { method: "DELETE" });

const endpoints = [
  { name: "spells", handler: deleteSpell, del: deleteSpellById },
  { name: "deities", handler: deleteDeity, del: deleteDeityById },
  { name: "magicitems", handler: deleteMagicItem, del: deleteMagicItemById },
  { name: "png", handler: deletePng, del: deletePngById },
] as const;

describe("DELETE /api/:domain/:id auth guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.each(endpoints)("$name", ({ handler, del }) => {
    it("returns 401 and does not touch the database without a session", async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const res = await handler(req, { params: Promise.resolve({ id: "1" }) });

      expect(res.status).toBe(401);
      expect(del).not.toHaveBeenCalled();
    });

    it("proceeds to the delete when a session is present", async () => {
      vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
      vi.mocked(del).mockResolvedValue(true);

      const res = await handler(req, { params: Promise.resolve({ id: "1" }) });

      expect(res.status).toBe(200);
      expect(del).toHaveBeenCalledWith(1);
    });

    // TD-02 boundary 2: parseInt("abc") is NaN, which used to reach Prisma.
    it.each(["abc", "", "1.5", "-1", "0", "9e99"])(
      "returns 400 for a malformed id (%j) and never queries",
      async (id) => {
        vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);

        const res = await handler(req, { params: Promise.resolve({ id }) });

        expect(res.status).toBe(400);
        expect(del).not.toHaveBeenCalled();
      }
    );
  });
});
