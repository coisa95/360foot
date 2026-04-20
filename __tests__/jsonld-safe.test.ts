/**
 * Smoke tests for safeJsonLd — the util that serialises JSON-LD for
 * injection into <script type="application/ld+json"> tags.
 *
 * The dangerous case is an attacker-controlled string that contains
 * </script> — without escaping, it closes the script tag early and
 * enables XSS.
 */
import { describe, it, expect } from "vitest";
import { safeJsonLd } from "../lib/json-ld";

describe("safeJsonLd", () => {
  it("escapes </script> so the payload cannot break out of the tag", () => {
    const payload = {
      name: "</script><script>alert(1)</script>",
    };
    const out = safeJsonLd(payload);
    // There must be no raw "</script" anywhere in the output — every
    // occurrence is replaced by the escaped form "<\/script".
    expect(out.toLowerCase()).not.toContain("</script");
    expect(out).toContain("<\\/script");
  });

  it("escapes the case-insensitive variants (</SCRIPT>, </Script>)", () => {
    const out = safeJsonLd({ x: "</SCRIPT>" });
    expect(out.toLowerCase()).not.toContain("</script");
  });

  it("escapes HTML comment openers (<!--)", () => {
    // Defensive: an `<!--` inside a <script> can start a comment in
    // certain parsers, so safeJsonLd neutralises it too.
    const out = safeJsonLd({ x: "<!-- danger -->" });
    expect(out).not.toContain("<!--");
    expect(out).toContain("<\\!--");
  });

  it("handles null by returning the JSON literal 'null'", () => {
    // JSON.stringify(null) === "null" — that's fine as a JSON-LD value.
    expect(safeJsonLd(null)).toBe("null");
  });

  it("returns 'null' on undefined input instead of crashing SSR", () => {
    // Earlier behaviour threw because JSON.stringify(undefined) is
    // undefined (not a string), which broke the follow-up .replace().
    // A missing JSON-LD block should degrade gracefully, not 500 the
    // page — the safeJsonLd helper now guards this.
    expect(safeJsonLd(undefined)).toBe("null");
  });

  it("round-trips plain data through JSON.parse", () => {
    const input = { name: "OK", n: 1, nested: { a: [1, 2, 3] } };
    const out = safeJsonLd(input);
    expect(JSON.parse(out)).toEqual(input);
  });

  it("returns 'null' on circular refs and logs, instead of throwing", () => {
    // Circular data in a JSON-LD payload should not bring down the
    // page. We log the warning and render `null` so the <script> tag
    // is still valid JSON.
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(safeJsonLd(obj)).toBe("null");
  });
});
