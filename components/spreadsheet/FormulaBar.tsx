/**
 * FormulaBar – shows the cell reference and raw value of the selected cell.
 * Double-clicking lets the user edit the raw formula directly.
 */

"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useSpreadsheetStore } from "@/store/useSpreadsheetStore";

export default function FormulaBar() {
  const selectedCell = useSpreadsheetStore((s) => s.selectedCell);
  const cell = useSpreadsheetStore((s) => s.cells[s.selectedCell]);
  const updateCellValue = useSpreadsheetStore((s) => s.updateCellValue);

  const rawValue = cell?.value ?? "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rawValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft when selected cell changes
  useEffect(() => {
    setDraft(rawValue);
    setEditing(false);
  }, [selectedCell, rawValue]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const commitEdit = () => {
    if (draft !== rawValue) {
      updateCellValue(selectedCell, draft);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitEdit();
    else if (e.key === "Escape") {
      setDraft(rawValue);
      setEditing(false);
    }
  };

  return (
    <div className="flex h-9 items-center border-b border-slate-200 bg-white px-2 text-sm shadow-sm z-10">
      {/* Cell reference badge */}
      <span className="flex h-6 w-14 items-center justify-center rounded border border-slate-300 bg-slate-100 text-xs font-semibold text-slate-700">
        {selectedCell}
      </span>

      <span className="mx-2 text-gray-300">|</span>

      {/* Formula / raw value */}
      {editing ? (
        <input
          ref={inputRef}
          className="flex-1 outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <div
          className="flex-1 cursor-text truncate text-gray-700"
          onClick={() => {
            setEditing(true);
            setDraft(rawValue);
          }}
        >
          {rawValue || <span className="text-gray-400">Empty</span>}
        </div>
      )}
    </div>
  );
}
