/**
 * DocumentCard – renders a single document entry on the dashboard.
 */

"use client";

import Link from "next/link";
import type { SpreadsheetDocument } from "@/types";

function timeAgo(epoch: number): string {
  const seconds = Math.floor((Date.now() - epoch) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface Props {
  doc: SpreadsheetDocument;
}

export default function DocumentCard({ doc }: Props) {
  return (
    <Link
      href={`/document/${doc.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md"
    >
      {/* Grid icon + title */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 10h18M3 6h18M3 14h18M3 18h18"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1 py-1">
          <h3 className="truncate text-base font-semibold text-slate-900">
            {doc.title}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            by {doc.ownerName} · <span className="text-slate-400">{timeAgo(doc.lastModified)}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
