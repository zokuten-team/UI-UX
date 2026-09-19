/* Shared workspace types used across all workspace components. */

export type ToolId = "digitise" | "analyse" | "research" | "advo" | "translate" | "calculator" | "indexing";

export type Page = {
  id: string;
  title: string;
  html: string;
  dirty?: boolean;
};

export type WorkspaceDoc = {
  id: string;
  name: string;
  pages: Page[];
  updated: string;
  /** "word" for rich-text documents, "pdf" for PDF files */
  kind?: "word" | "pdf";
  /** Base-64 encoded PDF data (only for kind === "pdf") */
  pdfData?: string;
};

export type Note = {
  id: string;
  docId: string;
  pageId: string;
  text: string;
  selectedText?: string;
  selectionRange?: { startOffset: number; endOffset: number };
  createdAt: number;
};

export type VersionEntry = {
  id: string;
  docId: string;
  timestamp: number;
  label?: string;
  snapshot: string; // JSON-serialised pages array
};

/** Columns available in the lawyer-style document index */
export type IndexColumn = {
  id: string;
  label: string;
  visible: boolean;
  custom?: boolean;
};

export const DEFAULT_INDEX_COLUMNS: IndexColumn[] = [
  { id: "sl", label: "Sl. No.", visible: true },
  { id: "description", label: "Document Description", visible: true },
  { id: "date", label: "Date", visible: true },
  { id: "party", label: "Party/Source", visible: true },
  { id: "type", label: "Document Type", visible: true },
  { id: "pages", label: "Page Nos.", visible: true },
  { id: "remarks", label: "Remarks", visible: true },
];

export type LinkedTableConfig = {
  id: string;
  type: "index" | "annexure";
  docId: string; // The document where the table is inserted
  pageId: string; // The page where the table was inserted
  columns: IndexColumn[];
  numberingStyle?: string; // e.g. "Annexure A", "Exhibit 1"
  includedDocIds: string[]; // which docs to include
};
