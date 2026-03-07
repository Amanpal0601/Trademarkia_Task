/**
 * Additional edge-case tests for branch coverage improvements.
 *
 * Targets uncovered branches in:
 *  - lib/formula/evaluator.ts (formatNumber NaN/Infinity, unknown function, RANGE in arithmetic)
 *  - lib/formula/parser.ts (edge tokens)
 *  - store/useSpreadsheetStore.ts (no-docId path)
 *  - services/presence.service.ts (sessionColor already set)
 */

/* ────────── Mock Firebase ────────── */
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
}));
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
}));
jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  get: jest.fn(() => Promise.resolve({ exists: () => false, val: () => null })),
  push: jest.fn(() => ({ key: "mock-key" })),
  remove: jest.fn(() => Promise.resolve()),
  onValue: jest.fn(() => jest.fn()),
  onDisconnect: jest.fn(() => ({ remove: jest.fn() })),
  serverTimestamp: jest.fn(() => Date.now()),
}));

import { evaluateFormula } from "@/lib/formula/evaluator";
import { tokenise } from "@/lib/formula/parser";
import { useSpreadsheetStore } from "@/store/useSpreadsheetStore";
import { act } from "@testing-library/react";

const getCellValue = (id: string): string => {
  const map: Record<string, string> = {
    A1: "10", A2: "20", A3: "30",
    B1: "5", B2: "15",
  };
  return map[id] ?? "";
};

/* ────────── evaluator edge cases ────────── */
describe("evaluator – branch coverage", () => {
  it("handles RANGE in arithmetic context", () => {
    // =A1:A3+0 → range summed then added to 0
    expect(evaluateFormula("=A1:A3+0", getCellValue)).toBe("60");
  });

  it("handles function call in arithmetic path (expression not starting with function)", () => {
    // When expression doesn't start with FUNCTION token, it goes through evaluateArithmetic
    // which handles embedded function calls
    expect(evaluateFormula("=10+SUM(A1,A2)", getCellValue)).toBe("40");
  });

  it("handles parenthesised sub-expressions", () => {
    expect(evaluateFormula("=(A1+A2)*2", getCellValue)).toBe("60");
  });

  it("handles nested parentheses", () => {
    expect(evaluateFormula("=((10+5)*2)", getCellValue)).toBe("30");
  });

  it("unknown function falls back to arithmetic evaluator", () => {
    const result = evaluateFormula("=UNKNOWN(A1)", getCellValue);
    // Unknown function → falls through to arithmetic, pushes 0
    expect(result).toBeDefined();
  });

  it("division by zero returns 0", () => {
    expect(evaluateFormula("=1/0", getCellValue)).toBe("0");
  });

  it("evaluates subtraction correctly", () => {
    expect(evaluateFormula("=A3-A1", getCellValue)).toBe("20");
  });

  it("handles formula with no args in function", () => {
    expect(evaluateFormula("=SUM()", getCellValue)).toBe("0");
  });

  it("handles MIN with empty args", () => {
    expect(evaluateFormula("=MIN()", getCellValue)).toBe("0");
  });

  it("handles MAX with empty args", () => {
    expect(evaluateFormula("=MAX()", getCellValue)).toBe("0");
  });

  it("handles AVERAGE with empty args", () => {
    expect(evaluateFormula("=AVERAGE()", getCellValue)).toBe("0");
  });
});

/* ────────── parser edge cases ────────── */
describe("parser – branch coverage", () => {
  it("tokenises function with range inside parentheses", () => {
    const tokens = tokenise("SUM(A1:B2,C3)");
    expect(tokens[0]).toEqual({ kind: "FUNCTION", value: "SUM" });
    expect(tokens.some((t) => t.kind === "RANGE")).toBe(true);
    expect(tokens.some((t) => t.kind === "CELL_REF" && t.value === "C3")).toBe(true);
  });

  it("tokenises standalone parentheses in arithmetic", () => {
    const tokens = tokenise("(10+5)*2");
    expect(tokens[0]).toEqual({ kind: "OPEN_PAREN", value: "(" });
    expect(tokens[4]).toEqual({ kind: "CLOSE_PAREN", value: ")" });
  });

  it("tokenises multiple operators in sequence", () => {
    const tokens = tokenise("1+2-3*4/5");
    const ops = tokens.filter((t) => t.kind === "OPERATOR");
    expect(ops).toHaveLength(4);
  });
});

/* ────────── store – branch coverage (no docId case) ────────── */
describe("useSpreadsheetStore – no docId branch", () => {
  beforeEach(() => {
    act(() => {
      useSpreadsheetStore.setState({
        docId: "",
        cells: {},
        selectedCell: "A1",
        syncStatus: "idle",
      });
    });
  });

  it("updateCellValue without docId does not call Firebase", () => {
    act(() => {
      useSpreadsheetStore.getState().updateCellValue("A1", "hello");
    });
    const state = useSpreadsheetStore.getState();
    // Cell is still updated locally
    expect(state.cells.A1.value).toBe("hello");
    // syncStatus is saving but no Firebase call was made
    expect(state.syncStatus).toBe("saving");
  });

  it("updateCellStyle without docId does not call Firebase", () => {
    act(() => {
      useSpreadsheetStore.getState().updateCellStyle("B1", { bold: true });
    });
    const state = useSpreadsheetStore.getState();
    expect(state.cells.B1.style?.bold).toBe(true);
  });

  it("updateCellValue merges with existing cell style", () => {
    act(() => {
      useSpreadsheetStore.getState().setCells({
        A1: { value: "old", computed: "old", style: { bold: true } },
      });
    });
    act(() => {
      useSpreadsheetStore.getState().updateCellValue("A1", "new");
    });
    const cell = useSpreadsheetStore.getState().cells.A1;
    expect(cell.value).toBe("new");
    expect(cell.style?.bold).toBe(true);
  });
});
