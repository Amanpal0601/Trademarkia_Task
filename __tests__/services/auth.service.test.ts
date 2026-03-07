/**
 * Unit tests for services/auth.service.ts
 *
 * Firebase is auto-mocked via __mocks__/firebase/auth.ts
 */

import { AuthService } from "@/services/auth.service";
import {
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AuthService", () => {
  describe("signInWithGoogle", () => {
    it("calls signInWithPopup and returns the user", async () => {
      const user = await AuthService.signInWithGoogle();
      expect(signInWithPopup).toHaveBeenCalledTimes(1);
      expect(user).toBeDefined();
      expect(user.uid).toBe("test-uid-123");
    });

    it("throws when signInWithPopup fails", async () => {
      (signInWithPopup as jest.Mock).mockRejectedValueOnce(
        new Error("Popup closed"),
      );
      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        "Popup closed",
      );
    });
  });

  describe("signOut", () => {
    it("calls firebase signOut", async () => {
      await AuthService.signOut();
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("setDisplayName", () => {
    it("calls updateProfile on the current user", async () => {
      await AuthService.setDisplayName("New Name");
      expect(updateProfile).toHaveBeenCalledWith(
        expect.anything(),
        { displayName: "New Name" },
      );
    });
  });

  describe("onAuthStateChanged", () => {
    it("subscribes to auth changes and returns unsubscribe function", () => {
      const callback = jest.fn();
      const unsub = AuthService.onAuthStateChanged(callback);
      expect(onAuthStateChanged).toHaveBeenCalledTimes(1);
      expect(typeof unsub).toBe("function");
      // callback should have been invoked by the mock
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ uid: "test-uid-123" }),
      );
    });
  });

  describe("currentUser", () => {
    it("returns the current user from auth", () => {
      const user = AuthService.currentUser;
      expect(user).toBeDefined();
      expect(user?.uid).toBe("test-uid-123");
    });
  });
});
