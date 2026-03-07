/**
 * Unit tests for lib/formula/parser.ts
 *
 * Covers: tokenise, isFormula
 */

import { tokenise, isFormula } from "@/lib/formula/parser";

/* ──────────── isFormula ──────────── */
describe("isFormula", () => {
  it("returns true for strings starting with '='", () => {
    expect(isFormula("=SUM(A1)")).toBe(true);
  });

  it("returns true with leading whitespace", () => {
    expect(isFormula("  =A1+B1")).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(isFormula("hello")).toBe(false);
  });

  it("returns false for numbers", () => {
    expect(isFormula("42")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isFormula("")).toBe(false);
  });
});

/* ──────────── tokenise ──────────── */
describe("tokenise", () => {
  it("tokenises a simple number", () => {
    const tokens = tokenise("42");
    expect(tokens).toEqual([{ kind: "NUMBER", value: "42" }]);
  });

  it("tokenises a decimal number", () => {
    const tokens = tokenise("3.14");
    expect(tokens).toEqual([{ kind: "NUMBER", value: "3.14" }]);
  });

  it("tokenises a cell reference", () => {
    const tokens = tokenise("A1");
    expect(tokens).toEqual([{ kind: "CELL_REF", value: "A1" }]);
  });

  it("tokenises a range", () => {
    const tokens = tokenise("A1:B5");
    expect(tokens).toEqual([{ kind: "RANGE", value: "A1:B5" }]);
  });

  it("tokenises a function call", () => {
    const tokens = tokenise("SUM(A1,A2)");
    expect(tokens).toHaveLength(6);
    expect(tokens[0]).toEqual({ kind: "FUNCTION", value: "SUM" });
    expect(tokens[1]).toEqual({ kind: "OPEN_PAREN", value: "(" });
    expect(tokens[2]).toEqual({ kind: "CELL_REF", value: "A1" });
    expect(tokens[3]).toEqual({ kind: "COMMA", value: "," });
    expect(tokens[4]).toEqual({ kind: "CELL_REF", value: "A2" });
    expect(tokens[5]).toEqual({ kind: "CLOSE_PAREN", value: ")" });
  });

  it("tokenises arithmetic operators", () => {
    const tokens = tokenise("A1+B1*2");
    expect(tokens).toHaveLength(5);
    expect(tokens[1]).toEqual({ kind: "OPERATOR", value: "+" });
    expect(tokens[3]).toEqual({ kind: "OPERATOR", value: "*" });
  });

  it("tokenises subtraction and division", () => {
    const tokens = tokenise("10-5/2");
    expect(tokens).toHaveLength(5);
    expect(tokens[0]).toEqual({ kind: "NUMBER", value: "10" });
    expect(tokens[1]).toEqual({ kind: "OPERATOR", value: "-" });
    expect(tokens[2]).toEqual({ kind: "NUMBER", value: "5" });
    expect(tokens[3]).toEqual({ kind: "OPERATOR", value: "/" });
    expect(tokens[4]).toEqual({ kind: "NUMBER", value: "2" });
  });

  it("handles whitespace correctly", () => {
    const tokens = tokenise("  A1  +  B1  ");
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toEqual({ kind: "CELL_REF", value: "A1" });
    expect(tokens[1]).toEqual({ kind: "OPERATOR", value: "+" });
    expect(tokens[2]).toEqual({ kind: "CELL_REF", value: "B1" });
  });

  it("tokenises nested expression SUM(A1:A3)+10", () => {
    const tokens = tokenise("SUM(A1:A3)+10");
    expect(tokens.length).toBeGreaterThanOrEqual(5);
    expect(tokens[0]).toEqual({ kind: "FUNCTION", value: "SUM" });
  });

  it("tokenises empty string to empty array", () => {
    expect(tokenise("")).toEqual([]);
  });

  it("handles unknown characters gracefully", () => {
    const tokens = tokenise("A1@B1");
    // '@' is skipped; should produce A1 and B1
    expect(tokens.some((t) => t.kind === "CELL_REF" && t.value === "A1")).toBe(true);
    expect(tokens.some((t) => t.kind === "CELL_REF" && t.value === "B1")).toBe(true);
  });
});
