/**
 * Dashboard – lists the user's own spreadsheets and all shared spreadsheets.
 *
 * Each user sees their own created documents in "Your Spreadsheets",
 * and all other documents in "All Spreadsheets" for collaboration.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentService } from "@/services/document.service";
import { AuthService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import DocumentCard from "@/components/dashboard/DocumentCard";
import CreateDocumentModal from "@/components/dashboard/CreateDocumentModal";
import type { SpreadsheetDocument } from "@/types";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const router = useRouter();
  const [myDocs, setMyDocs] = useState<SpreadsheetDocument[]>([]);
  const [otherDocs, setOtherDocs] = useState<SpreadsheetDocument[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  // Load documents – split into user's own and others'
  useEffect(() => {
    if (!user) return;
    DocumentService.listDocuments().then((allDocs) => {
      const mine = allDocs.filter((d) => d.ownerId === user.uid);
      const others = allDocs.filter((d) => d.ownerId !== user.uid);
      setMyDocs(mine);
      setOtherDocs(others);
    });
  }, [user]);

  const handleSignOut = async () => {
    await AuthService.signOut();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-sm">
              S
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Sheets</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">
              {user.displayName}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* ─── Your Spreadsheets ─── */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-800">
            Your Spreadsheets
          </h2>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-inset ring-indigo-600 transition hover:bg-indigo-700 hover:shadow"
          >
            + New Spreadsheet
          </button>
        </div>

        {myDocs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
            <p className="text-sm text-gray-500">
              No spreadsheets yet. Create your first one!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myDocs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}

        {/* ─── All Spreadsheets (from other users) ─── */}
        {otherDocs.length > 0 && (
          <>
            <h2 className="mt-10 mb-4 text-sm font-medium text-gray-700">
              All Spreadsheets
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {otherDocs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          </>
        )}
      </main>

      <CreateDocumentModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
