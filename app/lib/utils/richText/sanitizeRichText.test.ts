import { describe, expect, it } from "vitest";

import sanitizeRichText from "./sanitizeRichText";

describe("sanitizeRichText — the allowlist (SPEC-019 T1)", () => {
  it("keeps every allowed element as written", () => {
    const html =
      "<h3>Title</h3><h4>Sub</h4><p>A <strong>bold</strong> and <em>italic</em><br />line</p>" +
      "<ul><li>one</li></ul><ol><li>two</li></ol>";

    expect(sanitizeRichText(html)).toBe(html);
  });

  it("maps pasted b/i to strong/em", () => {
    expect(sanitizeRichText("<p><b>x</b> <i>y</i></p>")).toBe(
      "<p><strong>x</strong> <em>y</em></p>"
    );
  });

  it("unwraps disallowed elements but keeps their text", () => {
    expect(
      sanitizeRichText(
        "<h1>Big</h1><div><span>in</span> <u>u</u> <table><tr><td>cell</td></tr></table></div>"
      )
    ).toBe("Bigin u cell");
  });

  it("drops every attribute on allowed elements", () => {
    expect(
      sanitizeRichText(
        '<p class="x" style="color:red" id="y" title="t">text</p>'
      )
    ).toBe("<p>text</p>");
  });

  it("drops images, even without a handler", () => {
    expect(sanitizeRichText('<p>a<img src="https://x.test/a.png">b</p>')).toBe(
      "<p>ab</p>"
    );
  });
});

describe("sanitizeRichText — attack payloads (OWASP XSS filter evasion)", () => {
  const payloads: [string, string][] = [
    ["script element", "<script>alert(1)</script>"],
    ["script, mixed case", "<ScRiPt>alert(1)</sCrIpT>"],
    ["script with src", '<script src="https://evil.test/x.js"></script>'],
    [
      "style element",
      "<style>body{background:url(javascript:alert(1))}</style>",
    ],
    ["img onerror", '<img src=x onerror="alert(1)">'],
    ["svg onload", "<svg onload=alert(1)><circle /></svg>"],
    ["body onload", "<body onload=alert(1)>"],
    ["event handler on allowed tag", '<p onclick="alert(1)">x</p>'],
    ["event handler, no quotes", "<strong onmouseover=alert(1)>x</strong>"],
    ["iframe", '<iframe src="javascript:alert(1)"></iframe>'],
    ["iframe srcdoc", '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
    ["object data", '<object data="javascript:alert(1)"></object>'],
    ["embed", '<embed src="javascript:alert(1)">'],
    [
      "meta refresh",
      '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
    ],
    [
      "form action",
      '<form action="javascript:alert(1)"><button>x</button></form>',
    ],
    ["math href", '<math href="javascript:alert(1)">x</math>'],
    ["html comment hiding script", "<!--<script>alert(1)</script>-->"],
    ["CDATA", "<![CDATA[<script>alert(1)</script>]]>"],
    ["template", "<template><script>alert(1)</script></template>"],
    ["broken nesting", "<p><scr<script>ipt>alert(1)</script></p>"],
    [
      "noscript breakout",
      '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>',
    ],
  ];

  it.each(payloads)("neutralises %s", (_name, payload) => {
    const clean = sanitizeRichText(payload);

    expect(clean).not.toMatch(
      /<\s*(script|style|img|svg|iframe|object|embed|meta|form|body|math|template)/i
    );
    expect(clean).not.toMatch(/\son\w+\s*=/i);
    expect(clean).not.toMatch(/javascript:/i);
    expect(clean).not.toMatch(/href|src=/i);
  });

  it("keeps no script text at all", () => {
    expect(sanitizeRichText("<p>a</p><script>alert(1)</script>")).toBe(
      "<p>a</p>"
    );
  });

  it.each([
    ["javascript: href", '<a href="javascript:alert(1)">x</a>'],
    ["encoded javascript:", '<a href="&#106;avascript:alert(1)">x</a>'],
    ["tab-split javascript:", '<a href="jav&#x09;ascript:alert(1)">x</a>'],
    ["data: href", '<a href="data:text/html,<script>alert(1)</script>">x</a>'],
    ["external href", '<a href="https://example.com">x</a>'],
    ["protocol-relative", '<a href="//example.com">x</a>'],
  ])("unwraps an anchor with a %s", (_name, payload) => {
    expect(sanitizeRichText(payload)).toBe("x");
  });
});

describe("sanitizeRichText — record links (ADR-0016)", () => {
  it("keeps a well-formed record link", () => {
    const link = '<a data-record-domain="npc" data-record-id="42">Mira</a>';

    expect(sanitizeRichText(`<p>${link}</p>`)).toBe(`<p>${link}</p>`);
  });

  it("accepts every searchable domain, including places", () => {
    for (const domain of [
      "spells",
      "magicItems",
      "npc",
      "deities",
      "factions",
      "places",
    ]) {
      const link = `<a data-record-domain="${domain}" data-record-id="1">x</a>`;
      expect(sanitizeRichText(link)).toBe(link);
    }
  });

  it("strips href and every other attribute from a record link", () => {
    expect(
      sanitizeRichText(
        '<a href="javascript:alert(1)" onclick="x()" target="_blank" data-record-domain="npc" data-record-id="7" data-other="1">M</a>'
      )
    ).toBe('<a data-record-domain="npc" data-record-id="7">M</a>');
  });

  it.each([
    ["unknown domain", 'data-record-domain="users" data-record-id="1"'],
    ["wrong-case domain", 'data-record-domain="NPC" data-record-id="1"'],
    ["missing id", 'data-record-domain="npc"'],
    ["missing domain", 'data-record-id="1"'],
    ["zero id", 'data-record-domain="npc" data-record-id="0"'],
    ["negative id", 'data-record-domain="npc" data-record-id="-1"'],
    ["decimal id", 'data-record-domain="npc" data-record-id="4.2"'],
    ["exponent id", 'data-record-domain="npc" data-record-id="1e3"'],
    ["leading zero", 'data-record-domain="npc" data-record-id="042"'],
    ["id past integer", 'data-record-domain="npc" data-record-id="2147483648"'],
    ["non-numeric id", 'data-record-domain="npc" data-record-id="abc"'],
  ])("unwraps a link with a %s", (_name, attributes) => {
    expect(sanitizeRichText(`<p><a ${attributes}>Mira</a></p>`)).toBe(
      "<p>Mira</p>"
    );
  });

  it("escapes attribute-breaking characters instead of passing them through", () => {
    expect(
      sanitizeRichText(
        '<a data-record-domain="npc" data-record-id="1&quot; onmouseover=&quot;alert(1)">x</a>'
      )
    ).toBe("x");
  });
});
