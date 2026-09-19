import { describe, expect, it } from "vitest";

import collectRecordLinks from "./collectRecordLinks";

describe("collectRecordLinks", () => {
  it("collects each distinct link once, nested or not, across values", () => {
    expect(
      collectRecordLinks([
        '<p><strong><a data-record-domain="npc" data-record-id="1">a</a></strong></p>',
        '<ul><li><a data-record-domain="npc" data-record-id="1">b</a> <a data-record-domain="places" data-record-id="2">c</a></li></ul>',
      ])
    ).toEqual([
      { domain: "npc", id: 1 },
      { domain: "places", id: 2 },
    ]);
  });

  it("ignores plain text, empty values and invalid links", () => {
    expect(
      collectRecordLinks([
        '<a data-record-domain="npc" data-record-id="1">plain text row</a>',
        null,
        undefined,
        "",
        '<p><a data-record-domain="users" data-record-id="1">x</a></p>',
      ])
    ).toEqual([]);
  });
});
