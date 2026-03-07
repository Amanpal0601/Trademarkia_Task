/**
 * Core domain types for the collaborative spreadsheet.
 * Centralised here so every layer (services, stores, components) shares 
 * the same strict contracts.
 */

/* ──────────────────────── Cell ──────────────────────── */

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  color?: string;           // text colour hex
  backgroundColor?: string; // cell background hex
}

export interface CellData {
  value: string;      // raw user input (may be a formula like "=SUM(A1,A2)")
  computed: string;   // evaluated display value
  style?: CellStyle;
  lastEditedBy?: string; // uid of last editor
}

/** A flat map keyed by cell id, e.g. "A1", "B12" */
export type CellMap = Record<string, CellData>;

/* ──────────────────────── Document ──────────────────── */

export interface SpreadsheetDocument {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  createdAt: number;      // epoch ms
  lastModified: number;   // epoch ms
}

/* ──────────────────────── Presence ──────────────────── */

export interface PresenceData {
  uid: string;
  displayName: string;
  color: string;          // assigned avatar colour
  activeCell: string;     // currently focused cell id
  lastActive: number;     // epoch ms
}

/* ──────────────────────── Auth / User ────────────────── */

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

/* ──────────────────────── Sync state ────────────────── */

export type SyncStatus = "idle" | "saving" | "synced" | "error";
