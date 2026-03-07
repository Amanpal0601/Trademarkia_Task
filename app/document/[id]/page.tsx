/**
 * Document Editor page – the main spreadsheet view.
 *
 * Sets up Firebase listeners for cells and presence, then renders
 * the toolbar, formula bar, and grid.
 */

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DocumentService } from "@/services/document.service";
import { PresenceService } from "@/services/presence.service";
import { useSpreadsheetStore } from "@/store/useSpreadsheetStore";
import { usePresenceStore } from "@/store/usePresenceStore";
import { useAuthStore } from "@/store/useAuthStore";
import Grid from "@/components/spreadsheet/Grid";
import Toolbar from "@/components/spreadsheet/Toolbar";
import FormulaBar from "@/components/spreadsheet/FormulaBar";
import UserPresenceBar from "@/components/shared/UserPresenceBar";
import type { SpreadsheetDocument } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentEditorPage({ params }: PageProps) {
  const { id: docId } = use(params);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const setDocId = useSpreadsheetStore((s) => s.setDocId);
  const setCells = useSpreadsheetStore((s) => s.setCells);
  const setPresenceUsers = usePresenceStore((s) => s.setUsers);
  const selectedCell = useSpreadsheetStore((s) => s.selectedCell);
  const [docMeta, setDocMeta] = useState<SpreadsheetDocument | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  // Load document metadata
  useEffect(() => {
    if (!docId) return;
    setDocId(docId);
    DocumentService.getDocument(docId).then((doc) => {
      if (!doc) {
        router.push("/");
        return;
      }
      setDocMeta(doc);
    });
  }, [docId, setDocId, router]);

  // Subscribe to cells
  useEffect(() => {
    if (!docId) return;
    const unsubscribe = DocumentService.subscribeToCells(docId, (cells) => {
      setCells(cells);
    });
    return () => unsubscribe();
  }, [docId, setCells]);

  // Subscribe to presence + join/leave
  useEffect(() => {
    if (!docId || !user) return;

    PresenceService.joinDocument(docId, user.uid, user.displayName);
    const unsubscribe = PresenceService.subscribeToPresence(
      docId,
      setPresenceUsers,
    );

    return () => {
      PresenceService.leaveDocument(docId, user.uid);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, user?.uid]);

  // Update presence active cell
  useEffect(() => {
    if (!docId || !user) return;
    PresenceService.updateActiveCell(docId, user.uid, selectedCell);
  }, [docId, user, selectedCell]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Top nav */}
      <header className="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white font-bold text-sm shadow-sm transition hover:bg-indigo-700 hover:shadow"
            title="Back to dashboard"
          >
            S
          </Link>
          <div className="mx-2 h-5 w-px bg-slate-200" />
          <h1 className="text-sm font-semibold text-slate-800">
            {docMeta?.title ?? "Untitled"}
          </h1>
        </div>
        <UserPresenceBar />
      </header>

      {/* Toolbar */}
      <Toolbar />

      {/* Formula bar */}
      <FormulaBar />

      {/* Spreadsheet grid */}
      <Grid />
    </div>
  );
}
