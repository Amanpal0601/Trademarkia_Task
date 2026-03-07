/**
 * Grid – the scrollable spreadsheet grid.
 *
 * Renders lettered column headers, numbered row headers, and a matrix
 * of Cell components.  Handles keyboard navigation between cells.
 */

"use client";

import { useCallback, useEffect, useRef } from "react";
import { columnToLetter, parseCellRef, buildCellId } from "@/lib/utils/cell-helpers";
import { useSpreadsheetStore } from "@/store/useSpreadsheetStore";
import Cell from "./Cell";

const NUM_ROWS = 100;
const NUM_COLS = 26; // A–Z

export default function Grid() {
  const selectCell = useSpreadsheetStore((s) => s.selectCell);
  const selectedCell = useSpreadsheetStore((s) => s.selectedCell);
  const gridRef = useRef<HTMLDivElement>(null);

  /** Navigate from `fromCellId` in a given direction. */
  const handleNavigate = useCallback(
    (fromCellId: string, direction: string) => {
      const ref = parseCellRef(fromCellId);
      if (!ref) return;

      let { col, row } = ref;
      switch (direction) {
        case "up":    row = Math.max(0, row - 1); break;
        case "down":  row = Math.min(NUM_ROWS - 1, row + 1); break;
        case "left":  col = Math.max(0, col - 1); break;
        case "right": col = Math.min(NUM_COLS - 1, col + 1); break;
      }

      const nextId = buildCellId(col, row);
      selectCell(nextId);

      // Focus the new cell element
      requestAnimationFrame(() => {
        const el = gridRef.current?.querySelector(
          `[data-cellid="${nextId}"]`,
        ) as HTMLElement | null;
        el?.focus();
        el?.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    },
    [selectCell],
  );

  // Focus A1 on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = gridRef.current?.querySelector(
        `[data-cellid="A1"]`,
      ) as HTMLElement | null;
      el?.focus();
    });
  }, []);

  // Focus cell when selectedCell changes (e.g., from formula bar click)
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = gridRef.current?.querySelector(
        `[data-cellid="${selectedCell}"]`,
      ) as HTMLElement | null;
      el?.focus();
    });
  }, [selectedCell]);

  return (
    <div ref={gridRef} className="flex-1 overflow-auto bg-white" role="grid">
      <table className="border-collapse">
        {/* Column headers */}
        <thead className="sticky top-0 z-10 shadow-sm">
          <tr>
            {/* Corner cell */}
            <th className="sticky left-0 z-20 h-8 w-12 border border-slate-300 bg-slate-100" />
            {Array.from({ length: NUM_COLS }, (_, c) => (
              <th
                key={c}
                className="h-8 min-w-[100px] border border-slate-300 bg-slate-100/80 text-center text-xs font-semibold text-slate-700 backdrop-blur-sm"
              >
                {columnToLetter(c)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: NUM_ROWS }, (_, r) => (
            <tr key={r}>
              {/* Row header */}
              <td className="sticky left-0 z-10 h-8 w-12 border border-slate-300 bg-slate-100/80 text-center text-xs font-semibold text-slate-700 backdrop-blur-sm shadow-[1px_0_0_0_rgb(203,213,225)]">
                {r + 1}
              </td>
              {Array.from({ length: NUM_COLS }, (_, c) => {
                const id = buildCellId(c, r);
                return (
                  <td key={c} className="p-0">
                    <Cell cellId={id} onNavigate={handleNavigate} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
