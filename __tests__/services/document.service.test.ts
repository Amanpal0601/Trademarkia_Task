/**
 * Unit tests for services/document.service.ts
 *
 * Firebase is auto-mocked via __mocks__/firebase/database.ts
 */

import { DocumentService } from "@/services/document.service";
import { set, get, push, onValue } from "firebase/database";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("DocumentService", () => {
  describe("createDocument", () => {
    it("pushes a new document and returns its id", async () => {
      const id = await DocumentService.createDocument(
        "My Sheet",
        "user-1",
        "Alice",
      );
      expect(push).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledTimes(1);
      expect(id).toBe("new-doc-id-456");
    });

    it("sets correct metadata on the document", async () => {
      await DocumentService.createDocument("Budget", "user-2", "Bob");
      const setCall = (set as jest.Mock).mock.calls[0][1];
      expect(setCall.title).toBe("Budget");
      expect(setCall.ownerId).toBe("user-2");
      expect(setCall.ownerName).toBe("Bob");
      expect(setCall.id).toBe("new-doc-id-456");
      expect(typeof setCall.createdAt).toBe("number");
      expect(typeof setCall.lastModified).toBe("number");
    });
  });

  describe("listDocuments", () => {
    it("returns an empty array when no documents exist", async () => {
      const mockSnap = { exists: () => false, val: () => null };
      (get as jest.Mock).mockResolvedValueOnce(mockSnap);

      const docs = await DocumentService.listDocuments();
      expect(docs).toEqual([]);
    });

    it("returns documents sorted by lastModified descending", async () => {
      const mockSnap = {
        exists: () => true,
        val: () => ({
          a: { id: "a", title: "First", lastModified: 100 },
          b: { id: "b", title: "Second", lastModified: 200 },
        }),
      };
      (get as jest.Mock).mockResolvedValueOnce(mockSnap);

      const docs = await DocumentService.listDocuments();
      expect(docs[0].id).toBe("b"); // newer first
      expect(docs[1].id).toBe("a");
    });
  });

  describe("getDocument", () => {
    it("returns null for non-existent document", async () => {
      const mockSnap = { exists: () => false, val: () => null };
      (get as jest.Mock).mockResolvedValueOnce(mockSnap);

      const doc = await DocumentService.getDocument("nonexistent");
      expect(doc).toBeNull();
    });

    it("returns the document when it exists", async () => {
      const mockSnap = {
        exists: () => true,
        val: () => ({ id: "doc-1", title: "Test" }),
      };
      (get as jest.Mock).mockResolvedValueOnce(mockSnap);

      const doc = await DocumentService.getDocument("doc-1");
      expect(doc?.title).toBe("Test");
    });
  });

  describe("updateCell", () => {
    it("calls set with the cell data", async () => {
      await DocumentService.updateCell("doc-1", "A1", {
        value: "42",
        computed: "42",
      });
      expect(set).toHaveBeenCalledTimes(1);
    });
  });

  describe("subscribeToCells", () => {
    it("calls onValue and returns unsubscribe function", () => {
      const callback = jest.fn();
      const unsub = DocumentService.subscribeToCells("doc-1", callback);
      expect(onValue).toHaveBeenCalledTimes(1);
      expect(typeof unsub).toBe("function");
      // The mock auto-fires the callback
      expect(callback).toHaveBeenCalledWith({});
    });

    it("returns empty object when snapshot does not exist", () => {
      const mockSnap = { exists: () => false, val: () => null };
      (onValue as jest.Mock).mockImplementationOnce((_ref, cb) => {
        cb(mockSnap);
        return jest.fn();
      });

      const callback = jest.fn();
      DocumentService.subscribeToCells("doc-1", callback);
      expect(callback).toHaveBeenCalledWith({});
    });
  });
});
