"use client";

import { X } from "lucide-react";
import { PdfPage } from "./pdf-page";

type Props = {
  originalSource: string;
  sourceKind: "pdf" | "image";
  pageNumber?: number;
  text: string;
  title: string;
  onClose: () => void;
  onTextChange: (text: string) => void;
};

export function VerificationWorkspace({ originalSource, sourceKind, pageNumber = 1, text, title, onClose, onTextChange }: Props) {
  return (
    <div className="verification-workspace">
      <header className="verification-header">
        <div><strong>Verify text</strong><span>{title}</span></div>
        <div>
          <button className="quiet-button icon-only" onClick={onClose} aria-label="Close verification"><X /></button>
        </div>
      </header>

      <div className="verification-body">
        <section className="verification-source" aria-label="Original page">
          {sourceKind === "pdf" ? (
            <PdfPage source={originalSource} pageNumber={pageNumber} label={title} />
          ) : (
            // Imported scans are local object/data URLs, so Next image optimisation does not apply.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={originalSource} alt={title} />
          )}
        </section>
        <section className="verification-text">
          <div><strong>Editable text</strong><span>Compare with the original, then approve.</span></div>
          <textarea value={text} onChange={(event) => onTextChange(event.target.value)} aria-label="Extracted document text" />
        </section>
      </div>
    </div>
  );
}
