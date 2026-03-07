/**
 * Cell – a single editable cell in the spreadsheet grid.
 *
 * When not being edited it renders the computed display value.
 * When focused / editing, it shows the raw formula / input.
 * Other users' presence is rendered as a coloured border.
 */

"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { useSpreadsheetStore } from "@/store/useSpreadsheetStore";
import { usePresenceStore } from "@/store/usePresenceStore";
import { useAuthStore } from "@/store/useAuthStore";
import type { CellStyle } from "@/types";

interface Props {
  cellId: string;
  onNavigate: (cellId: string, direction: string) => void;
}

export default function Cell({ cellId, onNavigate }: Props) {
  const cell = useSpreadsheetStore((s) => s.cells[cellId]);
  const selectedCell = useSpreadsheetStore((s) => s.selectedCell);
  const selectCell = useSpreadsheetStore((s) => s.selectCell);
  const updateCellValue = useSpreadsheetStore((s) => s.updateCellValue);
  const currentUid = useAuthStore((s) => s.user?.uid);
  const presenceUsers = usePresenceStore((s) => s.users);

  const isSelected = selectedCell === cellId;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = cell?.computed ?? cell?.value ?? "";
  const rawValue = cell?.value ?? "";
  const style: CellStyle = cell?.style ?? {};

  // Find if another user is focusing this cell
  const otherPresence = presenceUsers.find(
    (u) => u.uid !== currentUid && u.activeCell === cellId,
  );

  // When selected, focus the input
  useEffect(() => {
    if (isSelected && editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected, editing]);

  const handleClick = useCallback(() => {
    selectCell(cellId);
  }, [selectCell, cellId]);

  const handleDoubleClick = useCallback(() => {
    selectCell(cellId);
    setEditing(true);
    setDraft(rawValue);
  }, [selectCell, cellId, rawValue]);

  const commitEdit = useCallback(() => {
    if (draft !== rawValue) {
      updateCellValue(cellId, draft);
    }
    setEditing(false);
  }, [draft, rawValue, updateCellValue, cellId]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitEdit();
      onNavigate(cellId, "down");
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitEdit();
      onNavigate(cellId, e.shiftKey ? "left" : "right");
    } else if (e.key === "Escape") {
      setEditing(false);
    }
  };

  const handleKeyDownSelected = (e: KeyboardEvent<HTMLDivElement>) => {
    if (editing) return;

    if (e.key === "ArrowUp") { e.preventDefault(); onNavigate(cellId, "up"); }
    else if (e.key === "ArrowDown") { e.preventDefault(); onNavigate(cellId, "down"); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); onNavigate(cellId, "left"); }
    else if (e.key === "ArrowRight") { e.preventDefault(); onNavigate(cellId, "right"); }
    else if (e.key === "Tab") { e.preventDefault(); onNavigate(cellId, e.shiftKey ? "left" : "right"); }
    else if (e.key === "Enter") {
      setEditing(true);
      setDraft(rawValue);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      updateCellValue(cellId, "");
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      // Start typing immediately – prevent default so the key
      // doesn't also fire inside the newly mounted <input>
      e.preventDefault();
      setEditing(true);
      setDraft(e.key);
    }
  };

  // Border colour for presence
  const borderStyle = otherPresence
    ? `2px solid ${otherPresence.color}`
    : isSelected
      ? "2px solid #4f46e5" // indigo-600
      : "1px solid #cbd5e1"; // slate-300

  return (
    <div
      className="relative h-8 min-w-[100px] overflow-hidden bg-white hover:bg-slate-50 transition-colors"
      style={{
        border: borderStyle,
        fontWeight: style.bold ? 700 : 400,
        fontStyle: style.italic ? "italic" : "normal",
        color: style.color ?? undefined,
        backgroundColor: style.backgroundColor ?? undefined,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDownSelected}
      tabIndex={isSelected ? 0 : -1}
      role="gridcell"
      aria-selected={isSelected}
      data-cellid={cellId}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="h-full w-full px-1.5 text-sm outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span className="flex h-full items-center px-1.5 text-sm">
          {displayValue}
        </span>
      )}

      {/* Presence label */}
      {otherPresence && otherPresence.displayName && (
        <span
          className="absolute -top-4 left-0 rounded-t px-1 text-[10px] font-medium text-white"
          style={{ backgroundColor: otherPresence.color ?? "#888" }}
        >
          {otherPresence.displayName}
        </span>
      )}
    </div>
  );
}
