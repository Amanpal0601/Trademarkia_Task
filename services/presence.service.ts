/**
 * PresenceService – tracks which users are active in a document.
 *
 * Uses Firebase Realtime Database's onDisconnect() to auto-clean stale
 * presence records when a tab/browser closes unexpectedly.
 */

import {
  ref,
  set,
  update,
  remove,
  onValue,
  onDisconnect,
  type Unsubscribe,
} from "firebase/database";
import { realtimeDb } from "@/lib/firebase";
import type { PresenceData } from "@/types";

/** One of 8 pre-defined colours assigned round-robin per session. */
const PRESENCE_COLORS = [
  "#4285F4", // blue
  "#EA4335", // red
  "#FBBC05", // yellow
  "#34A853", // green
  "#FF6D01", // orange
  "#46BDC6", // teal
  "#7B1FA2", // purple
  "#F06292", // pink
];

let colorIdx = Math.floor(Math.random() * PRESENCE_COLORS.length);

function nextColor(): string {
  return PRESENCE_COLORS[colorIdx++ % PRESENCE_COLORS.length];
}

export class PresenceService {
  private static sessionColor: string | null = null;

  /** Announce this user's arrival in a document. */
  static async joinDocument(
    docId: string,
    uid: string,
    displayName: string,
  ): Promise<void> {
    if (!this.sessionColor) this.sessionColor = nextColor();

    const presenceRef = ref(realtimeDb, `presence/${docId}/${uid}`);
    const data: PresenceData = {
      uid,
      displayName,
      color: this.sessionColor,
      activeCell: "",
      lastActive: Date.now(),
    };

    await set(presenceRef, data);
    // Automatically remove presence when the connection drops
    onDisconnect(presenceRef).remove();
  }

  /** Cleanly leave a document. */
  static async leaveDocument(docId: string, uid: string): Promise<void> {
    await remove(ref(realtimeDb, `presence/${docId}/${uid}`));
  }

  /** Update which cell the user is currently focused on. */
  static async updateActiveCell(
    docId: string,
    uid: string,
    cellId: string,
  ): Promise<void> {
    const presenceRef = ref(realtimeDb, `presence/${docId}/${uid}`);
    await update(presenceRef, {
      activeCell: cellId,
      lastActive: Date.now(),
    });
  }

  /** Subscribe to presence changes for a document. */
  static subscribeToPresence(
    docId: string,
    callback: (users: PresenceData[]) => void,
  ): Unsubscribe {
    const presenceRef = ref(realtimeDb, `presence/${docId}`);
    return onValue(presenceRef, (snap) => {
      if (!snap.exists()) {
        callback([]);
        return;
      }
      const raw = snap.val() as Record<string, PresenceData>;
      callback(Object.values(raw));
    });
  }

  /** Get this session's assigned colour. */
  static getSessionColor(): string {
    if (!this.sessionColor) this.sessionColor = nextColor();
    return this.sessionColor;
  }
}
