/**
 * Smoke tests for the `limit` query-param parsing used in
 * /api/syndication/articles (and siblings).
 *
 * The parsing logic is inlined in the route handler:
 *   const rawLimit = parseInt(searchParams.get("limit") || "", 10);
 *   const limit = Number.isFinite(rawLimit) && rawLimit > 0
 *     ? Math.min(rawLimit, 50) : 20;
 *
 * Extracting it would be intrusive for a smoke layer, so we duplicate
 * the expression here and test THAT.  If the route changes, mirror the
 * change here.  Default 20, max 50.
 */
import { describe, it, expect } from "vitest";

function parseLimit(raw: string | null, max = 50, fallback = 20): number {
  const rawLimit = parseInt(raw || "", 10);
  return Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, max)
    : fallback;
}

describe("parseLimit (syndication)", () => {
  it("returns 20 as default when param is missing", () => {
    expect(parseLimit(null)).toBe(20);
  });

  it("returns 20 when param is non-numeric", () => {
    expect(parseLimit("abc")).toBe(20);
  });

  it("returns 20 when param is empty string", () => {
    expect(parseLimit("")).toBe(20);
  });

  it("returns 20 when param is 0 (not strictly positive)", () => {
    expect(parseLimit("0")).toBe(20);
  });

  it("returns 20 when param is negative", () => {
    expect(parseLimit("-5")).toBe(20);
  });

  it("clamps to 50 when param is huge", () => {
    expect(parseLimit("99999")).toBe(50);
  });

  it("returns the value when it's a valid positive int ≤ max", () => {
    expect(parseLimit("30")).toBe(30);
  });

  it("returns exactly max when param equals max", () => {
    expect(parseLimit("50")).toBe(50);
  });
});
