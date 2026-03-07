/**
 * Presence Zustand store – tracks all users active in the current document.
 */

"use client";

import { create } from "zustand";
import type { PresenceData } from "@/types";

interface PresenceState {
  users: PresenceData[];
  setUsers: (users: PresenceData[]) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  users: [],
  setUsers: (users) => set({ users }),
}));
