/**
 * Unit tests for services/presence.service.ts
 *
 * Firebase is auto-mocked via __mocks__/firebase/database.ts
 */

import { PresenceService } from "@/services/presence.service";
import { set, update, remove, onValue, onDisconnect } from "firebase/database";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PresenceService", () => {
  describe("joinDocument", () => {
    it("sets presence data and registers onDisconnect", async () => {
      await PresenceService.joinDocument("doc-1", "user-1", "Alice");
      expect(set).toHaveBeenCalledTimes(1);
      const data = (set as jest.Mock).mock.calls[0][1];
      expect(data.uid).toBe("user-1");
      expect(data.displayName).toBe("Alice");
      expect(data.color).toBeDefined();
      expect(data.activeCell).toBe("");
      expect(typeof data.lastActive).toBe("number");
      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });

    it("assigns a colour from the predefined palette", async () => {
      await PresenceService.joinDocument("doc-2", "user-2", "Bob");
      const data = (set as jest.Mock).mock.calls[0][1];
      expect(data.color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe("leaveDocument", () => {
    it("removes presence data", async () => {
      await PresenceService.leaveDocument("doc-1", "user-1");
      expect(remove).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateActiveCell", () => {
    it("calls update (not set) with activeCell and lastActive", async () => {
      await PresenceService.updateActiveCell("doc-1", "user-1", "B2");
      expect(update).toHaveBeenCalledTimes(1);
      const data = (update as jest.Mock).mock.calls[0][1];
      expect(data.activeCell).toBe("B2");
      expect(typeof data.lastActive).toBe("number");
    });
  });

  describe("subscribeToPresence", () => {
    it("subscribes and returns unsubscribe", () => {
      const callback = jest.fn();
      const unsub = PresenceService.subscribeToPresence("doc-1", callback);
      expect(onValue).toHaveBeenCalledTimes(1);
      expect(typeof unsub).toBe("function");
    });

    it("returns empty array when snapshot does not exist", () => {
      const mockSnap = { exists: () => false, val: () => null };
      (onValue as jest.Mock).mockImplementationOnce((_ref, cb) => {
        cb(mockSnap);
        return jest.fn();
      });
      const callback = jest.fn();
      PresenceService.subscribeToPresence("doc-1", callback);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it("returns array of presence objects when data exists", () => {
      const mockSnap = {
        exists: () => true,
        val: () => ({
          "user-1": { uid: "user-1", displayName: "Alice", color: "#4285F4", activeCell: "A1", lastActive: 123 },
          "user-2": { uid: "user-2", displayName: "Bob", color: "#EA4335", activeCell: "B2", lastActive: 456 },
        }),
      };
      (onValue as jest.Mock).mockImplementationOnce((_ref, cb) => {
        cb(mockSnap);
        return jest.fn();
      });
      const callback = jest.fn();
      PresenceService.subscribeToPresence("doc-1", callback);
      const users = callback.mock.calls[0][0];
      expect(users).toHaveLength(2);
      expect(users[0].uid).toBe("user-1");
      expect(users[1].uid).toBe("user-2");
    });
  });

  describe("getSessionColor", () => {
    it("returns a valid hex colour string", () => {
      const color = PresenceService.getSessionColor();
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});
