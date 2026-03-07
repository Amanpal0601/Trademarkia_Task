/**
 * Formula parser – tokenises a raw formula string into an AST-like
 * token list that the evaluator can consume.
 *
 * Supported syntax:
 *   =SUM(A1, A2, B1:B5)
 *   =AVERAGE(A1:A10)
 *   =MIN(A1, A2)   =MAX(A1, A2)
 *   =A1+B1*2       (arithmetic with cell refs)
 *   =10+20/5
 */

export type TokenKind =
  | "NUMBER"
  | "CELL_REF"
  | "RANGE"
  | "FUNCTION"
  | "OPERATOR"
  | "OPEN_PAREN"
  | "CLOSE_PAREN"
  | "COMMA";

export interface Token {
  kind: TokenKind;
  value: string;
}

const WHITESPACE = /\s/;
const DIGIT_OR_DOT = /[\d.]/;
const ALPHA = /[A-Za-z]/;
const OPERATOR_CHARS = new Set(["+", "-", "*", "/"]);

/**
 * Tokenise a formula string (without the leading "=").
 *
 * @param raw  e.g. "SUM(A1,A2:A5)+10"
 * @returns    ordered token array
 */
export function tokenise(raw: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < raw.length) {
    const ch = raw[i];

    // skip whitespace
    if (WHITESPACE.test(ch)) {
      i++;
      continue;
    }

    // number literal
    if (DIGIT_OR_DOT.test(ch)) {
      let num = "";
      while (i < raw.length && DIGIT_OR_DOT.test(raw[i])) {
        num += raw[i++];
      }
      tokens.push({ kind: "NUMBER", value: num });
      continue;
    }

    // identifier: could be a FUNCTION name, CELL_REF, or RANGE
    if (ALPHA.test(ch)) {
      let id = "";
      while (i < raw.length && /[A-Za-z0-9]/.test(raw[i])) {
        id += raw[i++];
      }

      // check for range (e.g. A1:B5)
      if (raw[i] === ":") {
        i++; // consume ":"
        let end = "";
        while (i < raw.length && /[A-Za-z0-9]/.test(raw[i])) {
          end += raw[i++];
        }
        tokens.push({ kind: "RANGE", value: `${id}:${end}` });
        continue;
      }

      // followed by "("  →  function call
      if (raw[i] === "(") {
        tokens.push({ kind: "FUNCTION", value: id.toUpperCase() });
        continue; // don't consume "(", will be handled next iteration
      }

      // standalone cell ref or plain number-like string
      if (/^[A-Z]+\d+$/i.test(id)) {
        tokens.push({ kind: "CELL_REF", value: id.toUpperCase() });
      } else {
        // treat unknown identifiers as a literal (will error at eval time)
        tokens.push({ kind: "NUMBER", value: id });
      }
      continue;
    }

    if (ch === "(") {
      tokens.push({ kind: "OPEN_PAREN", value: "(" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ kind: "CLOSE_PAREN", value: ")" });
      i++;
      continue;
    }
    if (ch === ",") {
      tokens.push({ kind: "COMMA", value: "," });
      i++;
      continue;
    }
    if (OPERATOR_CHARS.has(ch)) {
      tokens.push({ kind: "OPERATOR", value: ch });
      i++;
      continue;
    }

    // unknown char – skip
    i++;
  }

  return tokens;
}

/** Returns true when `raw` starts with "=" indicating a formula. */
export function isFormula(raw: string): boolean {
  return raw.trimStart().startsWith("=");
}
