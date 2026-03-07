/**
 * Unit tests for components/dashboard/DocumentCard.tsx
 */

import React from "react";

/* Mock Next.js modules */
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return React.createElement("a", { href }, children);
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

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
}));

import { render, screen } from "@testing-library/react";
import DocumentCard from "@/components/dashboard/DocumentCard";

describe("DocumentCard", () => {
  const baseDoc = {
    id: "doc-123",
    title: "Budget 2024",
    ownerId: "user-1",
    ownerName: "Alice",
    createdAt: Date.now() - 3600000,
    lastModified: Date.now() - 60000, // 1 minute ago
  };

  it("renders the document title", () => {
    render(<DocumentCard doc={baseDoc} />);
    expect(screen.getByText("Budget 2024")).toBeInTheDocument();
  });

  it("renders the owner name", () => {
    render(<DocumentCard doc={baseDoc} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it("links to the document editor page", () => {
    render(<DocumentCard doc={baseDoc} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/document/doc-123");
  });

  it("shows 'just now' for documents modified < 60s ago", () => {
    const doc = { ...baseDoc, lastModified: Date.now() - 5000 };
    render(<DocumentCard doc={doc} />);
    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it("shows minutes for recent documents", () => {
    const doc = { ...baseDoc, lastModified: Date.now() - 120000 }; // 2 min
    render(<DocumentCard doc={doc} />);
    expect(screen.getByText(/2m ago/)).toBeInTheDocument();
  });

  it("shows hours for older documents", () => {
    const doc = { ...baseDoc, lastModified: Date.now() - 7200000 }; // 2h
    render(<DocumentCard doc={doc} />);
    expect(screen.getByText(/2h ago/)).toBeInTheDocument();
  });

  it("shows days for multi-day old documents", () => {
    const doc = { ...baseDoc, lastModified: Date.now() - 86400000 * 3 }; // 3d
    render(<DocumentCard doc={doc} />);
    expect(screen.getByText(/3d ago/)).toBeInTheDocument();
  });
});
