/**
 * Smoke tests for verifySyndicationApiKey.
 *
 * Focus: fail-closed semantics (missing env, wrong key, length mismatch)
 * and the one happy path.  The timingSafeEqual internals aren't tested
 * — we trust Node's crypto module.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { verifySyndicationApiKey } from "../lib/syndication-auth";

function makeRequest(headers: Record<string, string>): Request {
  return new Request("https://example.com/api/syndication/articles", {
    headers,
  });
}

describe("verifySyndicationApiKey", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when SYNDICATION_API_KEY env is missing", () => {
    vi.stubEnv("SYNDICATION_API_KEY", "");
    const req = makeRequest({ "x-api-key": "anything" });
    expect(verifySyndicationApiKey(req)).toBe(false);
  });

  it("returns false when x-api-key header is missing", () => {
    vi.stubEnv("SYNDICATION_API_KEY", "secret-key-123");
    const req = makeRequest({});
    expect(verifySyndicationApiKey(req)).toBe(false);
  });

  it("returns false when provided key differs from expected", () => {
    vi.stubEnv("SYNDICATION_API_KEY", "secret-key-123");
    const req = makeRequest({ "x-api-key": "secret-key-XXX" });
    expect(verifySyndicationApiKey(req)).toBe(false);
  });

  it("returns false when keys share a prefix but have different lengths", () => {
    // This is the length-mismatch short-circuit — important because
    // timingSafeEqual throws if buffers differ in length.
    vi.stubEnv("SYNDICATION_API_KEY", "secret-key-123");
    const req = makeRequest({ "x-api-key": "secret-key-1234" });
    expect(verifySyndicationApiKey(req)).toBe(false);
  });

  it("returns true when header matches env exactly", () => {
    vi.stubEnv("SYNDICATION_API_KEY", "secret-key-123");
    const req = makeRequest({ "x-api-key": "secret-key-123" });
    expect(verifySyndicationApiKey(req)).toBe(true);
  });
});
