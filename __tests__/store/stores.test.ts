/**
 * Unit tests for Zustand stores
 *
 * Covers: useAuthStore, useSpreadsheetStore, usePresenceStore
 */

/* ────────────── Mock Firebase modules before imports ────────────── */
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
}));

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  get: jest.fn(() => Promise.resolve({ exists: () => false, val: () => null })),
  push: jest.fn(() => ({ key: "mock-key" })),
  remove: jest.fn(() => Promise.resolve()),
  onValue: jest.fn(() => jest.fn()),
  onDisconnect: jest.fn(() => ({ remove: jest.fn() })),
  serverTimestamp: jest.fn(() => Date.now()),
}));

import { useAuthStore } from "@/store/useAuthStore";
import { useSpreadsheetStore } from "@/store/useSpreadsheetStore";
import { usePresenceStore } from "@/store/usePresenceStore";
import { act } from "@testing-library/react";

/* ──────────── useAuthStore ──────────── */
describe("useAuthStore", () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setLoading(true);
    });
  });

  it("initialises with null user and loading true", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(true);
  });

  it("setUser updates user and sets loading to false", () => {
    act(() => {
      useAuthStore.getState().setUser({
        uid: "u1",
        displayName: "Alice",
        email: "alice@test.com",
      });
    });

    const state = useAuthStore.getState();
    expect(state.user?.uid).toBe("u1");
    expect(state.user?.displayName).toBe("Alice");
    expect(state.loading).toBe(false);
  });

  it("setUser(null) clears user", () => {
    act(() => {
      useAuthStore.getState().setUser({
        uid: "u1",
        displayName: "Alice",
        email: "alice@test.com",
      });
    });

    act(() => {
      useAuthStore.getState().setUser(null);
    });

    expect(useAuthStore.getState().user).toBeNull();
  });

  it("setLoading toggles loading state", () => {
    act(() => {
      useAuthStore.getState().setLoading(false);
    });
    expect(useAuthStore.getState().loading).toBe(false);

    act(() => {
      useAuthStore.getState().setLoading(true);
    });
    expect(useAuthStore.getState().loading).toBe(true);
  });
});

/* ──────────── useSpreadsheetStore ──────────── */
describe("useSpreadsheetStore", () => {
  beforeEach(() => {
    act(() => {
      useSpreadsheetStore.setState({
        docId: "",
        cells: {},
        selectedCell: "A1",
        syncStatus: "idle",
      });
    });
  });

  it("initialises with empty cells and A1 selected", () => {
    const state = useSpreadsheetStore.getState();
    expect(state.cells).toEqual({});
    expect(state.selectedCell).toBe("A1");
    expect(state.syncStatus).toBe("idle");
  });

  it("setDocId updates the document id", () => {
    act(() => {
      useSpreadsheetStore.getState().setDocId("doc-123");
    });
    expect(useSpreadsheetStore.getState().docId).toBe("doc-123");
  });

  it("selectCell updates selectedCell", () => {
    act(() => {
      useSpreadsheetStore.getState().selectCell("C5");
    });
    expect(useSpreadsheetStore.getState().selectedCell).toBe("C5");
  });

  it("setCells replaces the entire cell map", () => {
    act(() => {
      useSpreadsheetStore.getState().setCells({
        A1: { value: "10", computed: "10" },
        B1: { value: "20", computed: "20" },
      });
    });

    const cells = useSpreadsheetStore.getState().cells;
    expect(Object.keys(cells)).toHaveLength(2);
    expect(cells.A1.computed).toBe("10");
  });

  it("updateCellValue performs optimistic update", () => {
    act(() => {
      useSpreadsheetStore.getState().setDocId("doc-1");
    });

    act(() => {
      useSpreadsheetStore.getState().updateCellValue("A1", "42");
    });

    const state = useSpreadsheetStore.getState();
    expect(state.cells.A1.value).toBe("42");
    expect(state.cells.A1.computed).toBe("42");
    expect(state.syncStatus).toBe("saving");
  });

  it("updateCellValue evaluates formulas", () => {
    act(() => {
      useSpreadsheetStore.getState().setCells({
        A1: { value: "10", computed: "10" },
        A2: { value: "20", computed: "20" },
      });
    });

    act(() => {
      useSpreadsheetStore.getState().updateCellValue("A3", "=SUM(A1,A2)");
    });

    expect(useSpreadsheetStore.getState().cells.A3.computed).toBe("30");
  });

  it("updateCellStyle merges style with existing cell", () => {
    act(() => {
      useSpreadsheetStore.getState().setDocId("doc-1");
      useSpreadsheetStore.getState().setCells({
        A1: { value: "hello", computed: "hello" },
      });
    });

    act(() => {
      useSpreadsheetStore.getState().updateCellStyle("A1", { bold: true });
    });

    const cell = useSpreadsheetStore.getState().cells.A1;
    expect(cell.style?.bold).toBe(true);
    expect(cell.value).toBe("hello");
  });

  it("updateCellStyle creates cell if it does not exist", () => {
    act(() => {
      useSpreadsheetStore.getState().setDocId("doc-1");
    });

    act(() => {
      useSpreadsheetStore.getState().updateCellStyle("B1", { italic: true });
    });

    const cell = useSpreadsheetStore.getState().cells.B1;
    expect(cell.style?.italic).toBe(true);
  });

  it("getCellComputed returns computed value", () => {
    act(() => {
      useSpreadsheetStore.getState().setCells({
        A1: { value: "=1+2", computed: "3" },
      });
    });

    expect(useSpreadsheetStore.getState().getCellComputed("A1")).toBe("3");
  });

  it("getCellComputed returns empty string for missing cell", () => {
    expect(useSpreadsheetStore.getState().getCellComputed("Z99")).toBe("");
  });

  it("setSyncStatus updates the sync indicator", () => {
    act(() => {
      useSpreadsheetStore.getState().setSyncStatus("error");
    });
    expect(useSpreadsheetStore.getState().syncStatus).toBe("error");
  });
});

/* ──────────── usePresenceStore ──────────── */
describe("usePresenceStore", () => {
  beforeEach(() => {
    act(() => {
      usePresenceStore.getState().setUsers([]);
    });
  });

  it("initialises with empty users array", () => {
    expect(usePresenceStore.getState().users).toEqual([]);
  });

  it("setUsers updates the users list", () => {
    act(() => {
      usePresenceStore.getState().setUsers([
        {
          uid: "u1",
          displayName: "Alice",
          color: "#4285F4",
          activeCell: "A1",
          lastActive: Date.now(),
        },
        {
          uid: "u2",
          displayName: "Bob",
          color: "#EA4335",
          activeCell: "B2",
          lastActive: Date.now(),
        },
      ]);
    });

    const users = usePresenceStore.getState().users;
    expect(users).toHaveLength(2);
    expect(users[0].displayName).toBe("Alice");
    expect(users[1].displayName).toBe("Bob");
  });

  it("setUsers replaces previous users", () => {
    act(() => {
      usePresenceStore.getState().setUsers([
        { uid: "u1", displayName: "Alice", color: "#4285F4", activeCell: "A1", lastActive: 1 },
      ]);
    });
    expect(usePresenceStore.getState().users).toHaveLength(1);

    act(() => {
      usePresenceStore.getState().setUsers([]);
    });
    expect(usePresenceStore.getState().users).toHaveLength(0);
  });
});
