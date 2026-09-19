import { describe, expect, it } from "vitest";

import { isRecordLinkDomain } from "./RecordLinkDomain";

describe("RecordLinkDomain", () => {
  it("recognises only those domains", () => {
    expect(isRecordLinkDomain("npc")).toBe(true);
    expect(isRecordLinkDomain("places")).toBe(true);
    expect(isRecordLinkDomain("users")).toBe(false);
    expect(isRecordLinkDomain("NPC")).toBe(false);
    expect(isRecordLinkDomain(undefined)).toBe(false);
  });
});
