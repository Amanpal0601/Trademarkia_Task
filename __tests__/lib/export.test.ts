/**
 * Unit tests for lib/utils/export.ts
 */

import { exportToCsv } from "@/lib/utils/export";
import type { CellMap } from "@/types";

// Mock DOM APIs used by exportToCsv
const mockClick = jest.fn();
const mockCreateObjectURL = jest.fn(() => "blob:mock-url");
const mockRevokeObjectURL = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  Object.defineProperty(global, "URL", {
    value: {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    },
    writable: true,
  });

  jest.spyOn(document, "createElement").mockReturnValue({
    href: "",
    download: "",
    click: mockClick,
  } as unknown as HTMLAnchorElement);

  global.Blob = jest.fn((parts: BlobPart[]) => ({
    content: parts,
    size: 0,
    type: "text/csv",
  })) as unknown as typeof Blob;
});

describe("exportToCsv", () => {
  it("creates a download link and triggers click", () => {
    const cells: CellMap = {
      A1: { value: "Hello", computed: "Hello" },
    };
    exportToCsv(cells, "test");
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it("uses default filename when not provided", () => {
    const cells: CellMap = {
      A1: { value: "10", computed: "10" },
    };
    exportToCsv(cells);
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it("handles empty cell map", () => {
    exportToCsv({}, "empty");
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it("includes correct number of rows and columns", () => {
    const cells: CellMap = {
      A1: { value: "1", computed: "1" },
      B2: { value: "2", computed: "2" },
      C3: { value: "3", computed: "3" },
    };
    exportToCsv(cells, "matrix");
    expect(global.Blob).toHaveBeenCalledTimes(1);
    const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0] as string;
    const rows = blobContent.split("\n");
    // header + 3 data rows
    expect(rows.length).toBe(4);
  });

  it("escapes double quotes in cell values", () => {
    const cells: CellMap = {
      A1: { value: 'say "hi"', computed: 'say "hi"' },
    };
    exportToCsv(cells, "quotes");
    const blobContent = (global.Blob as jest.Mock).mock.calls[0][0][0] as string;
    expect(blobContent).toContain('""hi""');
  });
});
