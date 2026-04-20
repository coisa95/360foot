/**
 * Regression tests for the prediction winner/goals coercion.
 *
 * The bug we're fencing off: API-Football sometimes returns
 *   predictions.winner = { id, name, comment }
 * and sometimes
 *   predictions.winner = "Some Team FC"
 * The old code stored the object directly in Supabase → React tried to
 * render `{id, name, comment}` in JSX → crash.  Same story for `goals`
 * which can be a string ("2.5") or `{ home, away }`.
 */
import { describe, it, expect } from "vitest";
import {
  coerceWinnerName,
  coerceWinnerComment,
  coerceGoals,
} from "./helpers/coerce-prediction";

describe("coerceWinnerName", () => {
  it("returns the string as-is when winner is already a string", () => {
    expect(coerceWinnerName("Real Madrid")).toBe("Real Madrid");
  });

  it("extracts .name when winner is an API-Football object", () => {
    expect(
      coerceWinnerName({ id: 541, name: "Real Madrid", comment: "..." })
    ).toBe("Real Madrid");
  });

  it("returns null for null/undefined", () => {
    expect(coerceWinnerName(null)).toBeNull();
    expect(coerceWinnerName(undefined)).toBeNull();
  });

  it("returns null for an object without a name field", () => {
    expect(coerceWinnerName({ id: 1 })).toBeNull();
  });
});

describe("coerceWinnerComment", () => {
  it("extracts .comment when present", () => {
    expect(
      coerceWinnerComment({ id: 1, name: "X", comment: "Win or draw" })
    ).toBe("Win or draw");
  });

  it("returns null for string winner (no comment to extract)", () => {
    expect(coerceWinnerComment("Real Madrid")).toBeNull();
  });

  it("returns null when comment is absent", () => {
    expect(coerceWinnerComment({ id: 1, name: "X" })).toBeNull();
  });
});

describe("coerceGoals", () => {
  it("returns the string as-is when goals is a string", () => {
    expect(coerceGoals("2.5")).toBe("2.5");
  });

  it("formats { home, away } as 'home - away'", () => {
    expect(coerceGoals({ home: 1.5, away: 1.2 })).toBe("1.5 - 1.2");
  });

  it("returns null when home is missing", () => {
    expect(coerceGoals({ away: 1 })).toBeNull();
  });

  it("returns null for null/undefined", () => {
    expect(coerceGoals(null)).toBeNull();
    expect(coerceGoals(undefined)).toBeNull();
  });

  it("never returns an object — typeof result is string or null", () => {
    // This is the load-bearing invariant that protects JSX from crashing.
    const variants = [
      "2.5",
      { home: 1, away: 2 },
      null,
      undefined,
      { foo: "bar" },
    ];
    for (const v of variants) {
      const out = coerceGoals(v);
      expect(out === null || typeof out === "string").toBe(true);
    }
  });
});
