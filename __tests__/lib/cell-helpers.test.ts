/**
 * Unit tests for lib/utils/cell-helpers.ts
 *
 * Covers: columnToLetter, letterToColumn, parseCellRef, buildCellId, expandRange
 */

import {
  columnToLetter,
  letterToColumn,
  parseCellRef,
  buildCellId,
  expandRange,
} from "@/lib/utils/cell-helpers";

/* ──────────── columnToLetter ──────────── */
describe("columnToLetter", () => {
  it("converts 0 → A", () => {
    expect(columnToLetter(0)).toBe("A");
  });

  it("converts 25 → Z", () => {
    expect(columnToLetter(25)).toBe("Z");
  });

  it("converts 26 → AA (multi-letter)", () => {
    expect(columnToLetter(26)).toBe("AA");
  });

  it("converts 27 → AB", () => {
    expect(columnToLetter(27)).toBe("AB");
  });

  it("converts 51 → AZ", () => {
    expect(columnToLetter(51)).toBe("AZ");
  });

  it("converts 701 → ZZ", () => {
    expect(columnToLetter(701)).toBe("ZZ");
  });
});

/* ──────────── letterToColumn ──────────── */
describe("letterToColumn", () => {
  it("converts A → 0", () => {
    expect(letterToColumn("A")).toBe(0);
  });

  it("converts Z → 25", () => {
    expect(letterToColumn("Z")).toBe(25);
  });

  it("converts AA → 26", () => {
    expect(letterToColumn("AA")).toBe(26);
  });

  it("converts AB → 27", () => {
    expect(letterToColumn("AB")).toBe(27);
  });

  it("roundtrips with columnToLetter for all single letters", () => {
    for (let i = 0; i < 26; i++) {
      const letter = columnToLetter(i);
      expect(letterToColumn(letter)).toBe(i);
    }
  });
});

/* ──────────── parseCellRef ──────────── */
describe("parseCellRef", () => {
  it("parses 'A1' → { col: 0, row: 0 }", () => {
    expect(parseCellRef("A1")).toEqual({ col: 0, row: 0 });
  });

  it("parses 'B12' → { col: 1, row: 11 }", () => {
    expect(parseCellRef("B12")).toEqual({ col: 1, row: 11 });
  });

  it("parses lowercase 'c5' → { col: 2, row: 4 }", () => {
    expect(parseCellRef("c5")).toEqual({ col: 2, row: 4 });
  });

  it("returns null for invalid ref 'hello'", () => {
    expect(parseCellRef("hello")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseCellRef("")).toBeNull();
  });

  it("returns null for numeric-only '123'", () => {
    expect(parseCellRef("123")).toBeNull();
  });
});

/* ──────────── buildCellId ──────────── */
describe("buildCellId", () => {
  it("builds cell id from col=0, row=0 → 'A1'", () => {
    expect(buildCellId(0, 0)).toBe("A1");
  });

  it("builds cell id from col=2, row=9 → 'C10'", () => {
    expect(buildCellId(2, 9)).toBe("C10");
  });

  it("roundtrips with parseCellRef", () => {
    const id = buildCellId(5, 14);
    const ref = parseCellRef(id);
    expect(ref).toEqual({ col: 5, row: 14 });
  });
});

/* ──────────── expandRange ──────────── */
describe("expandRange", () => {
  it("expands single column range A1:A3", () => {
    expect(expandRange("A1:A3")).toEqual(["A1", "A2", "A3"]);
  });

  it("expands single row range A1:C1", () => {
    expect(expandRange("A1:C1")).toEqual(["A1", "B1", "C1"]);
  });

  it("expands a 2×2 block A1:B2", () => {
    const result = expandRange("A1:B2");
    expect(result).toEqual(["A1", "B1", "A2", "B2"]);
  });

  it("handles reversed range (B2:A1 same as A1:B2)", () => {
    const result = expandRange("B2:A1");
    expect(result).toEqual(["A1", "B1", "A2", "B2"]);
  });

  it("returns empty array for invalid range", () => {
    expect(expandRange("INVALID")).toEqual([]);
  });

  it("returns empty array for range without colon", () => {
    expect(expandRange("A1A3")).toEqual([]);
  });

  it("returns empty array for range with invalid refs", () => {
    expect(expandRange("123:456")).toEqual([]);
  });
});
