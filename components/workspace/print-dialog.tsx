"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Printer, X } from "lucide-react";
import type { WorkspaceDoc } from "./types";
import { PdfPage } from "./pdf-page";

/* ── Print Dialog Props ──────────────────────────────────────────── */
export type PrintDialogProps = {
  docs: WorkspaceDoc[];
  selectedPages: string[];
  setSelectedPages: React.Dispatch<React.SetStateAction<string[]>>;
  position: "top" | "bottom";
  setPosition: (v: "top" | "bottom") => void;
  start: number;
  setStart: (v: number) => void;
  pageRange: string;
  setPageRange: (v: string) => void;
  orientation: "portrait" | "landscape";
  setOrientation: (v: "portrait" | "landscape") => void;
  sided: "single" | "double";
  setSided: (v: "single" | "double") => void;
  includeNotes: boolean;
  setIncludeNotes: (v: boolean) => void;
  includeIndex: boolean;
  setIncludeIndex: (v: boolean) => void;
  onClose: () => void;
};

export function PrintDialog({ docs, selectedPages, setSelectedPages, position, setPosition, start, setStart, pageRange, setPageRange, orientation, setOrientation, sided, setSided, includeNotes, setIncludeNotes, includeIndex, setIncludeIndex, onClose }: PrintDialogProps) {
  const [expandedDocs, setExpandedDocs] = useState<string[]>([]);
  const count = docs.reduce((total, doc) => total + doc.pages.filter((page) => selectedPages.includes(page.id)).length, 0);
  const toggleDocument = (doc: WorkspaceDoc, checked: boolean) => {
    const pageIds = doc.pages.map((page) => page.id);
    setSelectedPages((current) => checked
      ? [...new Set([...current, ...pageIds])]
      : current.filter((pageId) => !pageIds.includes(pageId)));
  };
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="print-dialog">
        <div className="modal-title"><div><span className="eyebrow">PRINT / EXPORT</span><h2>Configure print bundle</h2></div><button onClick={onClose}><X /></button></div>
        <div className="print-body">
          <section>
            <h3>Documents</h3>
            <div className="print-files">
              {docs.map((doc) => {
                const selectedCount = doc.pages.filter((page) => selectedPages.includes(page.id)).length;
                const expanded = expandedDocs.includes(doc.id);
                return (
                  <div className="print-file-group" key={doc.id}>
                    <div className="print-file-row">
                      <label>
                        <input type="checkbox" checked={selectedCount === doc.pages.length} onChange={(event) => toggleDocument(doc, event.target.checked)} />
                        <FileText />
                        <span><strong>{doc.name}</strong><small>{selectedCount} of {doc.pages.length} pages selected</small></span>
                      </label>
                      <button aria-label={`Choose pages from ${doc.name}`} title="Choose pages" onClick={() => setExpandedDocs((current) => expanded ? current.filter((id) => id !== doc.id) : [...current, doc.id])}>
                        {expanded ? <ChevronDown /> : <ChevronRight />}
                      </button>
                    </div>
                    {expanded && (
                      <div className="print-page-choices">
                        {doc.pages.map((page, index) => (
                          <label key={page.id}>
                            <input
                              type="checkbox"
                              checked={selectedPages.includes(page.id)}
                              onChange={(event) => setSelectedPages((current) => event.target.checked ? [...new Set([...current, page.id])] : current.filter((id) => id !== page.id))}
                            />
                            <span>Page {index + 1}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <h3>Page range</h3>
            <input type="text" value={pageRange} onChange={(e) => setPageRange(e.target.value)} placeholder="All pages (e.g. 1-3, 5)" className="print-range-input" />
            <h3>Include</h3>
            <label className="print-toggle"><input type="checkbox" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} /> Notes & annotations</label>
            <label className="print-toggle"><input type="checkbox" checked={includeIndex} onChange={(e) => setIncludeIndex(e.target.checked)} /> Document index</label>
          </section>
          <section>
            <h3>Page numbers</h3>
            <div className="number-position"><button className={position === "top" ? "active" : ""} onClick={() => setPosition("top")}>Above / header</button><button className={position === "bottom" ? "active" : ""} onClick={() => setPosition("bottom")}>Below / footer</button></div>
            <label className="start-number">Start numbering at<input type="number" min="1" value={start} onChange={(e) => setStart(Math.max(1, Number(e.target.value)))} /></label>
            <h3>Layout</h3>
            <div className="number-position"><button className={orientation === "portrait" ? "active" : ""} onClick={() => setOrientation("portrait")}>Portrait</button><button className={orientation === "landscape" ? "active" : ""} onClick={() => setOrientation("landscape")}>Landscape</button></div>
            <div className="number-position" style={{ marginTop: 8 }}><button className={sided === "single" ? "active" : ""} onClick={() => setSided("single")}>Single-sided</button><button className={sided === "double" ? "active" : ""} onClick={() => setSided("double")}>Double-sided</button></div>
            <div className="page-number-preview"><div className={position === "top" ? "at-top" : "at-bottom"}>{start}</div><span>Page number preview</span></div>
            <p>{count} selected pages · numbered {start}–{Math.max(start, start + count - 1)}</p>
          </section>
        </div>
        <div className="modal-actions">
          <button className="quiet-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" disabled={!count} onClick={() => { onClose(); setTimeout(() => window.print(), 100); }}><Printer /> Print selected</button>
        </div>
      </div>
    </div>
  );
}

export function PrintStack({ docs, selectedPages, position, start }: { docs: WorkspaceDoc[]; selectedPages: string[]; position: "top" | "bottom"; start: number }) {
  const pages = docs.flatMap((doc) => doc.pages
    .filter((page) => selectedPages.includes(page.id))
    .map((page) => ({ page, doc })));
  return (
    <div className="print-stack">
      {pages.map(({ page, doc }, index) => (
        <article className="print-page" key={`${doc.id}-${page.id}`}>
          <div className={`printed-number ${position}`}>{start + index}</div>
          {doc.kind === "pdf" ? (
            <PdfPage source={doc.pdfData ?? ""} pageNumber={page.pdfPageNumber ?? index + 1} label={doc.name} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: page.html }} />
          )}
        </article>
      ))}
    </div>
  );
}
