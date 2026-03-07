/**
 * Pure utility helpers for spreadsheet cell addressing.
 *
 * Examples
 *   columnToLetter(0)  → "A"
 *   letterToColumn("C") → 2
 *   parseCellRef("AB12") → { col: 27, row: 11 }
 *   expandRange("A1:A3") → ["A1","A2","A3"]
 */

/** Convert a 0-based column index to its letter representation (A, B, … Z, AA, AB …). */
export function columnToLetter(col: number): string {
  let result = "";
  let n = col;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/** Convert a column letter (e.g. "AB") to its 0-based index. */
export function letterToColumn(letters: string): number {
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return col - 1; // 0-based
}

export interface CellRef {
  col: number; // 0-based
  row: number; // 0-based
}

const CELL_RE = /^([A-Z]+)(\d+)$/;

/** Parse "B12" → { col: 1, row: 11 }. Returns null for invalid ids. */
export function parseCellRef(cellId: string): CellRef | null {
  const m = cellId.toUpperCase().match(CELL_RE);
  if (!m) return null;
  return { col: letterToColumn(m[1]), row: parseInt(m[2], 10) - 1 };
}

/** Build a cell id from 0-based col/row. */
export function buildCellId(col: number, row: number): string {
  return `${columnToLetter(col)}${row + 1}`;
}

/**
 * Expand a range like "A1:C3" into an array of individual cell ids.
 * Walks column-first within each row.
 */
export function expandRange(range: string): string[] {
  const parts = range.split(":");
  if (parts.length !== 2) return [];

  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);
  if (!start || !end) return [];

  const ids: string[] = [];
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      ids.push(buildCellId(c, r));
    }
  }
  return ids;
}
