import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get }),
}));

describe("readDisplayDateSystemId (SPEC-014 T4)", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("reads the viewer's choice from the request cookie", async () => {
    get.mockReturnValue({ name: "worldDateSystem", value: "2" });

    const { default: readDisplayDateSystemId } =
      await import("./readDisplayDateSystemId");

    expect(await readDisplayDateSystemId()).toBe(2);
    expect(get).toHaveBeenCalledWith("worldDateSystem");
  });

  it("reads no cookie as no preference", async () => {
    get.mockReturnValue(undefined);

    const { default: readDisplayDateSystemId } =
      await import("./readDisplayDateSystemId");

    expect(await readDisplayDateSystemId()).toBeNull();
  });
});
