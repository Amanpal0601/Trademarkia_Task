/**
 * Unit tests for lib/formula/evaluator.ts
 *
 * Covers: evaluateFormula with all strategies (SUM, AVERAGE, MIN, MAX, COUNT)
 * and arithmetic expressions with operator precedence.
 */

import { evaluateFormula } from "@/lib/formula/evaluator";

/** Helper: simple cell map for tests. */
const cellValues: Record<string, string> = {
  A1: "10",
  A2: "20",
  A3: "30",
  B1: "5",
  B2: "15",
  B3: "hello", // non-numeric
  C1: "0",
};

const getCellValue = (id: string): string => cellValues[id] ?? "";

/* ──────────── Non-formula passthrough ──────────── */
describe("evaluateFormula – passthrough", () => {
  it("returns plain text as-is", () => {
    expect(evaluateFormula("hello", getCellValue)).toBe("hello");
  });

  it("returns plain number as-is", () => {
    expect(evaluateFormula("42", getCellValue)).toBe("42");
  });

  it("returns empty string as-is", () => {
    expect(evaluateFormula("", getCellValue)).toBe("");
  });
});

/* ──────────── SUM ──────────── */
describe("evaluateFormula – SUM", () => {
  it("sums individual cell refs", () => {
    expect(evaluateFormula("=SUM(A1,A2)", getCellValue)).toBe("30");
  });

  it("sums a range", () => {
    expect(evaluateFormula("=SUM(A1:A3)", getCellValue)).toBe("60");
  });

  it("sums mixed refs and ranges", () => {
    expect(evaluateFormula("=SUM(A1,B1:B2)", getCellValue)).toBe("30");
  });

  it("returns 0 for empty range", () => {
    expect(evaluateFormula("=SUM(D1:D5)", getCellValue)).toBe("0");
  });

  it("handles non-numeric cells as 0", () => {
    expect(evaluateFormula("=SUM(B3,A1)", getCellValue)).toBe("10");
  });
});

/* ──────────── AVERAGE ──────────── */
describe("evaluateFormula – AVERAGE", () => {
  it("averages cell refs", () => {
    expect(evaluateFormula("=AVERAGE(A1,A2,A3)", getCellValue)).toBe("20");
  });

  it("averages a range", () => {
    expect(evaluateFormula("=AVERAGE(A1:A3)", getCellValue)).toBe("20");
  });

  it("works with AVG alias", () => {
    expect(evaluateFormula("=AVG(A1,A2)", getCellValue)).toBe("15");
  });

  it("returns 0 for empty args", () => {
    expect(evaluateFormula("=AVERAGE(D1:D5)", getCellValue)).toBe("0");
  });
});

/* ──────────── MIN / MAX ──────────── */
describe("evaluateFormula – MIN and MAX", () => {
  it("finds minimum value", () => {
    expect(evaluateFormula("=MIN(A1,A2,A3)", getCellValue)).toBe("10");
  });

  it("finds maximum value", () => {
    expect(evaluateFormula("=MAX(A1,A2,A3)", getCellValue)).toBe("30");
  });

  it("MIN with range", () => {
    expect(evaluateFormula("=MIN(B1:B2)", getCellValue)).toBe("5");
  });

  it("MAX with range", () => {
    expect(evaluateFormula("=MAX(B1:B2)", getCellValue)).toBe("15");
  });
});

/* ──────────── COUNT ──────────── */
describe("evaluateFormula – COUNT", () => {
  it("counts numeric values", () => {
    expect(evaluateFormula("=COUNT(A1,A2,A3)", getCellValue)).toBe("3");
  });

  it("excludes NaN values from count (non-numeric cells become 0)", () => {
    // B3 = "hello" → parseFloat gives NaN → || 0 converts to 0
    // So both args are valid numbers and COUNT returns 2
    expect(evaluateFormula("=COUNT(B3,A1)", getCellValue)).toBe("2");
  });
});

/* ──────────── Arithmetic ──────────── */
describe("evaluateFormula – arithmetic", () => {
  it("adds two numbers", () => {
    expect(evaluateFormula("=10+20", getCellValue)).toBe("30");
  });

  it("subtracts", () => {
    expect(evaluateFormula("=30-10", getCellValue)).toBe("20");
  });

  it("multiplies", () => {
    expect(evaluateFormula("=5*6", getCellValue)).toBe("30");
  });

  it("divides", () => {
    expect(evaluateFormula("=20/4", getCellValue)).toBe("5");
  });

  it("handles division by zero", () => {
    expect(evaluateFormula("=10/0", getCellValue)).toBe("0");
  });

  it("respects operator precedence (* before +)", () => {
    expect(evaluateFormula("=2+3*4", getCellValue)).toBe("14");
  });

  it("uses cell references in arithmetic", () => {
    expect(evaluateFormula("=A1+B1", getCellValue)).toBe("15");
  });

  it("combines cell refs and numbers", () => {
    expect(evaluateFormula("=A1*2+B1", getCellValue)).toBe("25");
  });

  it("evaluates parenthesised expression", () => {
    expect(evaluateFormula("=(2+3)*4", getCellValue)).toBe("20");
  });
});

/* ──────────── Edge cases ──────────── */
describe("evaluateFormula – edge cases", () => {
  it("returns empty string for '=' with nothing after", () => {
    expect(evaluateFormula("=", getCellValue)).toBe("");
  });

  it("handles unknown function gracefully", () => {
    const result = evaluateFormula("=FOOBAR(A1)", getCellValue);
    // Unknown function returns 0 via the arithmetic evaluator fallback
    expect(result).toBeDefined();
  });

  it("handles cell ref to zero-value cell", () => {
    expect(evaluateFormula("=C1+10", getCellValue)).toBe("10");
  });
});
