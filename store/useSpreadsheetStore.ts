/**
 * Spreadsheet Zustand store – manages cell data, selection, and sync status.
 *
 * Implements optimistic updates: the UI reflects changes instantly while
 * a background write pushes them to Firebase.  The sync indicator lets
 * collaborators know whether a save is in-flight.
 */

"use client";

import { create } from "zustand";
import type { CellData, CellMap, SyncStatus, CellStyle } from "@/types";
import { evaluateFormula } from "@/lib/formula/evaluator";
import { DocumentService } from "@/services/document.service";

interface SpreadsheetState {
  docId: string;
  cells: CellMap;
  selectedCell: string;
  syncStatus: SyncStatus;

  /* actions */
  setDocId: (id: string) => void;
  setCells: (cells: CellMap) => void;
  selectCell: (cellId: string) => void;
  updateCellValue: (cellId: string, value: string) => void;
  updateCellStyle: (cellId: string, style: Partial<CellStyle>) => void;
  getCellComputed: (cellId: string) => string;
  setSyncStatus: (status: SyncStatus) => void;
}

/** Look up the computed / display value for a cell id. */
function resolveCellValue(cells: CellMap, cellId: string): string {
  const cell = cells[cellId];
  if (!cell) return "";
  return cell.computed ?? cell.value;
}

export const useSpreadsheetStore = create<SpreadsheetState>((set, get) => ({
  docId: "",
  cells: {},
  selectedCell: "A1",
  syncStatus: "idle",

  setDocId: (id) => set({ docId: id }),

  /** Bulk-replace the entire cell map (used by the Firebase listener). */
  setCells: (cells) => set({ cells }),

  selectCell: (cellId) => set({ selectedCell: cellId }),

  /**
   * Optimistic cell update:
   *  1. Compute the display value locally.
   *  2. Update the Zustand store immediately (fast UI).
   *  3. Persist to Firebase in background.
   *  4. Flip sync indicator accordingly.
   */
  updateCellValue: (cellId, value) => {
    const state = get();
    const existingCell = state.cells[cellId];

    // Evaluate formulas using current cell map for lookups
    const computed = evaluateFormula(value, (ref) =>
      resolveCellValue(state.cells, ref),
    );

    const cellData: CellData = {
      value,
      computed,
      style: existingCell?.style,
      lastEditedBy: undefined, // will be set by caller if needed
    };

    // Optimistic local update
    set({
      cells: { ...state.cells, [cellId]: cellData },
      syncStatus: "saving",
    });

    // Background persist
    if (state.docId) {
      DocumentService.updateCell(state.docId, cellId, cellData)
        .then(() => set({ syncStatus: "synced" }))
        .catch(() => set({ syncStatus: "error" }));
    }
  },

  /** Update style on a cell (bold/italic/colour). */
  updateCellStyle: (cellId, style) => {
    const state = get();
    const existing = state.cells[cellId] ?? { value: "", computed: "" };
    const merged: CellData = {
      ...existing,
      style: { ...existing.style, ...style },
    };

    set({
      cells: { ...state.cells, [cellId]: merged },
      syncStatus: "saving",
    });

    if (state.docId) {
      DocumentService.updateCell(state.docId, cellId, merged)
        .then(() => set({ syncStatus: "synced" }))
        .catch(() => set({ syncStatus: "error" }));
    }
  },

  /** Resolve a cell's display value (for formula bar / rendering). */
  getCellComputed: (cellId) => {
    return resolveCellValue(get().cells, cellId);
  },

  setSyncStatus: (status) => set({ syncStatus: status }),
}));
