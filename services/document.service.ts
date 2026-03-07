/**
 * DocumentService – CRUD for spreadsheet documents and real-time cell sync.
 *
 * Uses Firebase Realtime Database for cell data (low-latency writes) and
 * a separate "documents" node for metadata (title, owner, timestamps).
 */

import {
  ref,
  set,
  get,
  push,
  update,
  onValue,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/database";
import { realtimeDb } from "@/lib/firebase";
import type { SpreadsheetDocument, CellData, CellMap } from "@/types";

export class DocumentService {
  /* ───────── Document metadata ───────── */

  /** Create a new spreadsheet document. Returns its generated id. */
  static async createDocument(
    title: string,
    ownerId: string,
    ownerName: string,
  ): Promise<string> {
    const listRef = ref(realtimeDb, "documents");
    const newRef = push(listRef);
    const id = newRef.key!;
    const now = Date.now();

    const doc: SpreadsheetDocument = {
      id,
      title,
      ownerId,
      ownerName,
      createdAt: now,
      lastModified: now,
    };

    await set(newRef, doc);
    return id;
  }

  /** Fetch all documents (for shared access / collaboration). */
  static async listDocuments(): Promise<SpreadsheetDocument[]> {
    const snap = await get(ref(realtimeDb, "documents"));
    if (!snap.exists()) return [];

    const data = snap.val() as Record<string, SpreadsheetDocument>;
    return Object.values(data).sort((a, b) => b.lastModified - a.lastModified);
  }

  /** Fetch only documents owned by a specific user. */
  static async listUserDocuments(uid: string): Promise<SpreadsheetDocument[]> {
    const allDocs = await this.listDocuments();
    return allDocs.filter((doc) => doc.ownerId === uid);
  }

  /** Fetch a single document by id. */
  static async getDocument(id: string): Promise<SpreadsheetDocument | null> {
    const snap = await get(ref(realtimeDb, `documents/${id}`));
    return snap.exists() ? (snap.val() as SpreadsheetDocument) : null;
  }

  /** Update the lastModified timestamp. */
  static async touchDocument(id: string): Promise<void> {
    await update(ref(realtimeDb, `documents/${id}`), {
      lastModified: serverTimestamp(),
    });
  }

  /* ───────── Cell data ───────── */

  /** Write a single cell value to the database. */
  static async updateCell(
    docId: string,
    cellId: string,
    data: CellData,
  ): Promise<void> {
    await set(ref(realtimeDb, `cells/${docId}/${cellId}`), data);
    // bump document timestamp
    await this.touchDocument(docId);
  }

  /** Subscribe to all cells for a document. Fires on every change. */
  static subscribeToCells(
    docId: string,
    callback: (cells: CellMap) => void,
  ): Unsubscribe {
    const cellsRef = ref(realtimeDb, `cells/${docId}`);
    return onValue(cellsRef, (snap) => {
      callback(snap.exists() ? (snap.val() as CellMap) : {});
    });
  }
}
