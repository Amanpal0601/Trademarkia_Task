/**
 * Unit tests for components/dashboard/CreateDocumentModal.tsx
 */

import React from "react";

/* Mock Firebase and Next.js */
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
}));
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: "u1", displayName: "Test", email: "t@t.com" } })),
}));
jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(),
  set: jest.fn(() => Promise.resolve()),
  push: jest.fn(() => ({ key: "new-doc-id" })),
  update: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => 123),
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/",
}));

import { render, screen, fireEvent } from "@testing-library/react";
import CreateDocumentModal from "@/components/dashboard/CreateDocumentModal";
import { useAuthStore } from "@/store/useAuthStore";
import { act } from "@testing-library/react";

beforeEach(() => {
  jest.clearAllMocks();
  act(() => {
    useAuthStore.getState().setUser({ uid: "u1", displayName: "Test User", email: "test@test.com" });
  });
});

describe("CreateDocumentModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <CreateDocumentModal open={false} onClose={jest.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal content when open", () => {
    render(<CreateDocumentModal open={true} onClose={jest.fn()} />);
    expect(screen.getByText("New Spreadsheet")).toBeInTheDocument();
  });

  it("renders a title input field", () => {
    render(<CreateDocumentModal open={true} onClose={jest.fn()} />);
    const input = screen.getByPlaceholderText("Untitled Spreadsheet");
    expect(input).toBeInTheDocument();
  });

  it("renders Create and Cancel buttons", () => {
    render(<CreateDocumentModal open={true} onClose={jest.fn()} />);
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = jest.fn();
    render(<CreateDocumentModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("allows typing in the title input", () => {
    render(<CreateDocumentModal open={true} onClose={jest.fn()} />);
    const input = screen.getByPlaceholderText("Untitled Spreadsheet") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "My Sheet" } });
    expect(input.value).toBe("My Sheet");
  });
});
