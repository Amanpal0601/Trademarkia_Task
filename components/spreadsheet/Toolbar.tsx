/**
 * Toolbar – cell formatting controls, sync indicator, and export button.
 * Sits at the top of the editor, below the nav bar.
 */

"use client";

import { useSpreadsheetStore } from "@/store/useSpreadsheetStore";
import { exportToCsv } from "@/lib/utils/export";

export default function Toolbar() {
  const selectedCell = useSpreadsheetStore((s) => s.selectedCell);
  const cell = useSpreadsheetStore((s) => s.cells[s.selectedCell]);
  const updateCellStyle = useSpreadsheetStore((s) => s.updateCellStyle);
  const syncStatus = useSpreadsheetStore((s) => s.syncStatus);
  const cells = useSpreadsheetStore((s) => s.cells);

  const isBold = cell?.style?.bold ?? false;
  const isItalic = cell?.style?.italic ?? false;

  const toggleBold = () =>
    updateCellStyle(selectedCell, { bold: !isBold });

  const toggleItalic = () =>
    updateCellStyle(selectedCell, { italic: !isItalic });

  const setTextColor = (color: string) =>
    updateCellStyle(selectedCell, { color });

  const handleExport = () => exportToCsv(cells);

  /* Sync status label */
  const syncLabel =
    syncStatus === "saving"
      ? "Saving…"
      : syncStatus === "synced"
        ? "Saved"
        : syncStatus === "error"
          ? "Error"
          : "";

  const syncDot =
    syncStatus === "saving"
      ? "bg-amber-400"
      : syncStatus === "synced"
        ? "bg-indigo-400"
        : syncStatus === "error"
          ? "bg-red-400"
          : "bg-slate-300";

  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-1.5">
      {/* Bold */}
      <button
        onClick={toggleBold}
        title="Bold"
        className={`flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold transition-colors ${
          isBold ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        B
      </button>

      {/* Italic */}
      <button
        onClick={toggleItalic}
        title="Italic"
        className={`flex h-7 w-7 items-center justify-center rounded-md text-sm italic transition-colors ${
          isItalic ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        I
      </button>

      {/* Text colour */}
      <div className="flex items-center gap-1 ml-2">
        <span className="text-xs text-slate-500 font-medium">Color:</span>
        <input
          type="color"
          defaultValue="#000000"
          onChange={(e) => setTextColor(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded border border-slate-300"
          title="Text color"
        />
      </div>

      <div className="mx-3 h-5 w-px bg-slate-200" />

      {/* Export */}
      <button
        onClick={handleExport}
        className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
      >
        Export CSV
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sync status */}
      {syncLabel && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <span className={`inline-block h-2 w-2 rounded-full ${syncDot}`} />
          {syncLabel}
        </div>
      )}
    </div>
  );
}
