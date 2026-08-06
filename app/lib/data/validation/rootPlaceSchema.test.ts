import { describe, expect, it } from "vitest";

import { buildRootPlaceSchema } from "./rootPlaceSchema";

describe("rootPlaceSchema", () => {
  it("accepts a title and a map image id", () => {
    const result = buildRootPlaceSchema().safeParse({
      title: "Aerivel",
      mapImage: "uploaded-id.png",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = buildRootPlaceSchema().safeParse({
      title: "",
      mapImage: "uploaded-id.png",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing map image", () => {
    const result = buildRootPlaceSchema().safeParse({ title: "Aerivel" });

    expect(result.success).toBe(false);
  });
});
