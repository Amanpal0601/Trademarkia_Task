/**
 * Export utility – converts the in-memory cell map to a CSV file
 * and triggers a browser download.
 */

import type { CellMap } from "@/types";
import { columnToLetter, parseCellRef } from "@/lib/utils/cell-helpers";

/**
 * Export the spreadsheet data as CSV.
 *
 * @param cells The cell map (e.g. { A1: { computed: "10" }, B3: { computed: "hello" } })
 * @param filename Download filename (without extension)
 */
export function exportToCsv(cells: CellMap, filename = "spreadsheet"): void {
  // Determine the bounding rectangle of filled cells
  let maxRow = 0;
  let maxCol = 0;

  for (const id of Object.keys(cells)) {
    const ref = parseCellRef(id);
    if (!ref) continue;
    if (ref.row > maxRow) maxRow = ref.row;
    if (ref.col > maxCol) maxCol = ref.col;
  }

  const rows: string[][] = [];

  // Header row (column letters)
  const header: string[] = [""];
  for (let c = 0; c <= maxCol; c++) header.push(columnToLetter(c));
  rows.push(header);

  // Data rows
  for (let r = 0; r <= maxRow; r++) {
    const row: string[] = [(r + 1).toString()];
    for (let c = 0; c <= maxCol; c++) {
      const cellId = `${columnToLetter(c)}${r + 1}`;
      const cell = cells[cellId];
      row.push(cell?.computed ?? "");
    }
    rows.push(row);
  }

  const csv = rows
    .map((row) =>
      row.map((v) => `"${v.replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
