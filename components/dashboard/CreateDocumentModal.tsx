/**
 * CreateDocumentModal – lightweight modal to create a new spreadsheet.
 */

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DocumentService } from "@/services/document.service";
import { useAuthStore } from "@/store/useAuthStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateDocumentModal({ open, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  if (!open) return null;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setCreating(true);
    try {
      const id = await DocumentService.createDocument(
        title.trim(),
        user.uid,
        user.displayName,
      );
      router.push(`/document/${id}`);
    } catch {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">
          New Spreadsheet
        </h2>
        <form onSubmit={handleCreate} className="mt-4">
          <label
            htmlFor="doc-title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            id="doc-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Spreadsheet"
            autoFocus
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-inset ring-indigo-600 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
