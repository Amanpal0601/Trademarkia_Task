/**
 * Unit tests for components/shared/UserPresenceBar.tsx
 */

import React from "react";

/* Mock Firebase before any imports */
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
  get: jest.fn(),
  push: jest.fn(),
  remove: jest.fn(),
  onValue: jest.fn(() => jest.fn()),
  onDisconnect: jest.fn(() => ({ remove: jest.fn() })),
  serverTimestamp: jest.fn(),
}));

import { render, screen } from "@testing-library/react";
import UserPresenceBar from "@/components/shared/UserPresenceBar";
import { usePresenceStore } from "@/store/usePresenceStore";
import { useAuthStore } from "@/store/useAuthStore";
import { act } from "@testing-library/react";

beforeEach(() => {
  act(() => {
    usePresenceStore.getState().setUsers([]);
    useAuthStore.getState().setUser({ uid: "me", displayName: "Me", email: "me@test.com" });
  });
});

describe("UserPresenceBar", () => {
  it("renders nothing when no other users are present", () => {
    const { container } = render(<UserPresenceBar />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when only the current user is present", () => {
    act(() => {
      usePresenceStore.getState().setUsers([
        { uid: "me", displayName: "Me", color: "#4285F4", activeCell: "A1", lastActive: 1 },
      ]);
    });
    const { container } = render(<UserPresenceBar />);
    expect(container.firstChild).toBeNull();
  });

  it("renders avatar for another user", () => {
    act(() => {
      usePresenceStore.getState().setUsers([
        { uid: "me", displayName: "Me", color: "#4285F4", activeCell: "A1", lastActive: 1 },
        { uid: "other", displayName: "Alice", color: "#EA4335", activeCell: "B2", lastActive: 2 },
      ]);
    });
    render(<UserPresenceBar />);
    expect(screen.getByTitle("Alice")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders multiple other users", () => {
    act(() => {
      usePresenceStore.getState().setUsers([
        { uid: "me", displayName: "Me", color: "#4285F4", activeCell: "A1", lastActive: 1 },
        { uid: "u1", displayName: "Alice", color: "#EA4335", activeCell: "B1", lastActive: 2 },
        { uid: "u2", displayName: "Bob", color: "#34A853", activeCell: "C1", lastActive: 3 },
      ]);
    });
    render(<UserPresenceBar />);
    expect(screen.getByTitle("Alice")).toBeInTheDocument();
    expect(screen.getByTitle("Bob")).toBeInTheDocument();
  });

  it("filters out users without displayName", () => {
    act(() => {
      usePresenceStore.getState().setUsers([
        { uid: "me", displayName: "Me", color: "#4285F4", activeCell: "A1", lastActive: 1 },
        { uid: "broken", displayName: "", color: "#EA4335", activeCell: "B1", lastActive: 2 },
      ]);
    });
    const { container } = render(<UserPresenceBar />);
    expect(container.firstChild).toBeNull();
  });

  it("shows first letter of user name uppercased", () => {
    act(() => {
      usePresenceStore.getState().setUsers([
        { uid: "me", displayName: "Me", color: "#4285F4", activeCell: "A1", lastActive: 1 },
        { uid: "u1", displayName: "alice", color: "#EA4335", activeCell: "B1", lastActive: 2 },
      ]);
    });
    render(<UserPresenceBar />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
