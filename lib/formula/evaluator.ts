/**
 * Formula evaluator – Strategy Pattern
 *
 * Each built-in function (SUM, AVERAGE, MIN, MAX, COUNT) is implemented as a
 * separate FormulaStrategy.  Arithmetic expressions use a small shunting-yard
 * evaluator so that operator precedence (* / before + -) is correct.
 *
 * Public API:
 *   evaluateFormula("=SUM(A1,A2:A5)", getCellValue)  →  "42"
 */

import { tokenise, isFormula, type Token } from "./parser";
import { expandRange } from "@/lib/utils/cell-helpers";

/* ────────────────────── Strategy interface ────────────────────── */

type CellValueGetter = (cellId: string) => string;

interface FormulaStrategy {
  evaluate(args: number[]): number;
}

/* ────────────────────── Concrete strategies ───────────────────── */

class SumStrategy implements FormulaStrategy {
  evaluate(args: number[]): number {
    return args.reduce((a, b) => a + b, 0);
  }
}

class AverageStrategy implements FormulaStrategy {
  evaluate(args: number[]): number {
    if (args.length === 0) return 0;
    return args.reduce((a, b) => a + b, 0) / args.length;
  }
}

class MinStrategy implements FormulaStrategy {
  evaluate(args: number[]): number {
    if (args.length === 0) return 0;
    return Math.min(...args);
  }
}

class MaxStrategy implements FormulaStrategy {
  evaluate(args: number[]): number {
    if (args.length === 0) return 0;
    return Math.max(...args);
  }
}

class CountStrategy implements FormulaStrategy {
  evaluate(args: number[]): number {
    return args.filter((n) => !Number.isNaN(n)).length;
  }
}

/* ────────────────────── Registry ──────────────────────────────── */

const strategyRegistry: Record<string, FormulaStrategy> = {
  SUM: new SumStrategy(),
  AVERAGE: new AverageStrategy(),
  AVG: new AverageStrategy(),
  MIN: new MinStrategy(),
  MAX: new MaxStrategy(),
  COUNT: new CountStrategy(),
};

/* ────────────────────── Helpers ───────────────────────────────── */

/** Resolve a token to a numeric value, dereferencing cell refs via getter. */
function resolveNumeric(token: Token, getCellValue: CellValueGetter): number {
  if (token.kind === "CELL_REF") {
    return parseFloat(getCellValue(token.value)) || 0;
  }
  return parseFloat(token.value) || 0;
}

/** Collect numeric args from tokens between parentheses, handling ranges. */
function collectFunctionArgs(
  tokens: Token[],
  startIdx: number,
  getCellValue: CellValueGetter,
): { args: number[]; endIdx: number } {
  const args: number[] = [];
  let i = startIdx;

  // expect OPEN_PAREN
  if (tokens[i]?.kind !== "OPEN_PAREN") return { args, endIdx: i };
  i++; // skip "("

  while (i < tokens.length && tokens[i].kind !== "CLOSE_PAREN") {
    const t = tokens[i];
    if (t.kind === "COMMA") {
      i++;
      continue;
    }
    if (t.kind === "RANGE") {
      const ids = expandRange(t.value);
      for (const id of ids) {
        args.push(parseFloat(getCellValue(id)) || 0);
      }
      i++;
      continue;
    }
    args.push(resolveNumeric(t, getCellValue));
    i++;
  }
  // skip ")"
  if (tokens[i]?.kind === "CLOSE_PAREN") i++;

  return { args, endIdx: i };
}

/* ────────────────────── Arithmetic evaluator (shunting-yard) ──── */

const PRECEDENCE: Record<string, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
};

function evaluateArithmetic(
  tokens: Token[],
  getCellValue: CellValueGetter,
): number {
  const output: number[] = [];
  const ops: string[] = [];

  const applyOp = () => {
    const op = ops.pop()!;
    const b = output.pop() ?? 0;
    const a = output.pop() ?? 0;
    switch (op) {
      case "+": output.push(a + b); break;
      case "-": output.push(a - b); break;
      case "*": output.push(a * b); break;
      case "/": output.push(b !== 0 ? a / b : 0); break;
    }
  };

  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];

    if (t.kind === "NUMBER" || t.kind === "CELL_REF") {
      output.push(resolveNumeric(t, getCellValue));
      i++;
      continue;
    }

    if (t.kind === "FUNCTION") {
      const strategy = strategyRegistry[t.value];
      i++; // move past function name
      const { args, endIdx } = collectFunctionArgs(tokens, i, getCellValue);
      i = endIdx;
      if (strategy) {
        output.push(strategy.evaluate(args));
      } else {
        output.push(0);
      }
      continue;
    }

    if (t.kind === "OPEN_PAREN") {
      ops.push("(");
      i++;
      continue;
    }

    if (t.kind === "CLOSE_PAREN") {
      while (ops.length > 0 && ops[ops.length - 1] !== "(") {
        applyOp();
      }
      ops.pop(); // remove "("
      i++;
      continue;
    }

    if (t.kind === "OPERATOR") {
      while (
        ops.length > 0 &&
        ops[ops.length - 1] !== "(" &&
        (PRECEDENCE[ops[ops.length - 1]] ?? 0) >= (PRECEDENCE[t.value] ?? 0)
      ) {
        applyOp();
      }
      ops.push(t.value);
      i++;
      continue;
    }

    // RANGE in arithmetic context – expand and sum
    if (t.kind === "RANGE") {
      const ids = expandRange(t.value);
      let sum = 0;
      for (const id of ids) sum += parseFloat(getCellValue(id)) || 0;
      output.push(sum);
      i++;
      continue;
    }

    i++;
  }

  while (ops.length > 0) applyOp();

  return output[0] ?? 0;
}

/* ────────────────────── Public API ────────────────────────────── */

/**
 * Evaluate a formula string and return its computed display value.
 *
 * @param raw           The raw cell value, e.g. "=SUM(A1,A2)"
 * @param getCellValue  Callback to resolve another cell's computed value
 * @returns             String representation of the result
 */
export function evaluateFormula(
  raw: string,
  getCellValue: CellValueGetter,
): string {
  if (!isFormula(raw)) return raw;

  try {
    const expr = raw.trim().slice(1); // strip leading "="
    const tokens = tokenise(expr);

    if (tokens.length === 0) return "";

    // Simple case: starts with a FUNCTION token  e.g. =SUM(...)
    if (tokens[0].kind === "FUNCTION") {
      const strategy = strategyRegistry[tokens[0].value];
      if (strategy) {
        const { args } = collectFunctionArgs(tokens, 1, getCellValue);
        const result = strategy.evaluate(args);
        return formatNumber(result);
      }
    }

    // General arithmetic / mixed expression
    const result = evaluateArithmetic(tokens, getCellValue);
    return formatNumber(result);
  } catch {
    return "#ERROR";
  }
}

function formatNumber(n: number): string {
  if (Number.isNaN(n) || !Number.isFinite(n)) return "#ERROR";
  // Remove trailing zeroes for cleaner display
  return parseFloat(n.toFixed(10)).toString();
}
