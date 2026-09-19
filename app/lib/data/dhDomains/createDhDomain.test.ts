import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DhDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomain";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create, checkRecordImageReference } = vi.hoisted(() => ({
  create: vi.fn(),
  checkRecordImageReference: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhDomain: { create } },
}));
vi.mock("@/app/lib/data/recordImages/checkRecordImageReference", () => ({
  default: checkRecordImageReference,
}));

import createDhDomain from "./createDhDomain";

// Invented content only (SPEC-018 §5): no SRD domain names or text.
const validFormData: DhDomain = {
  id: 0,
  name: "Veilwright",
  description: "<p>Lanterns and the paths between them.</p>",
  colour: "teal",
  origin: "homebrew",
};

describe("createDhDomain (SPEC-021 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    checkRecordImageReference.mockResolvedValue(null);
    create.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createDhDomain(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the domain on valid input", async () => {
    const result = await createDhDomain(validFormData);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        name: "Veilwright",
        description: "<p>Lanterns and the paths between them.</p>",
        colour: "teal",
        origin: "homebrew",
      },
    });
  });

  it("refuses a colour outside the palette with a field error", async () => {
    const result = await createDhDomain({
      ...validFormData,
      colour: "#ff0000",
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.colour).toBeDefined();
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses an unknown origin with a field error", async () => {
    const result = await createDhDomain({
      ...validFormData,
      origin: "borrowed",
    });

    expect(!result.ok && result.errors.origin).toBeDefined();
    expect(create).not.toHaveBeenCalled();
  });

  it("sanitises the formatted description before writing it", async () => {
    await createDhDomain({
      ...validFormData,
      description: '<p onclick="x()">Hi<script>alert(1)</script></p>',
    });

    expect(create.mock.calls[0]?.[0]).toMatchObject({
      data: { description: "<p>Hi</p>" },
    });
  });

  it("attaches an emblem the reference check accepts", async () => {
    await createDhDomain({ ...validFormData, imageId: 7 });

    expect(checkRecordImageReference).toHaveBeenCalledWith(7, {
      relation: "dhDomain",
    });
    expect(create.mock.calls[0]?.[0]).toMatchObject({ data: { imageId: 7 } });
  });

  it("refuses an emblem the reference check rejects, creating nothing", async () => {
    checkRecordImageReference.mockResolvedValue({
      imageId: [{ key: "imageInUse" }],
    });

    const result = await createDhDomain({ ...validFormData, imageId: 7 });

    expect(result).toEqual({
      ok: false,
      errors: { imageId: [{ key: "imageInUse" }] },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("wraps a write failure in a DatabaseError", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    create.mockRejectedValue(new Error("connection lost"));

    await expect(createDhDomain(validFormData)).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});
