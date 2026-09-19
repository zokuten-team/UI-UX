"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";
import type { WorkspaceDoc } from "./types";

type Props = {
  docs: WorkspaceDoc[];
  openDocIds: string[];
  activeDocId: string;
  onSelect: (docId: string) => void;
  onClose: (docId: string) => "dirty" | "closed";
  onSaveAndClose: (docId: string) => void;
  onDiscardAndClose: (docId: string) => void;
};

export function DocumentTabs({ docs, openDocIds, activeDocId, onSelect, onClose, onSaveAndClose, onDiscardAndClose }: Props) {
  const [confirmClose, setConfirmClose] = useState<string | null>(null);
  const openDocs = openDocIds.map((id) => docs.find((d) => d.id === id)).filter(Boolean) as WorkspaceDoc[];

  const handleClose = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    const result = onClose(docId);
    if (result === "dirty") setConfirmClose(docId);
  };

  const dirtyDoc = confirmClose ? docs.find((d) => d.id === confirmClose) : null;

  return (
    <>
      <div className="document-tabs">
        {openDocs.map((doc) => (
          <button
            key={doc.id}
            className={`doc-tab ${doc.id === activeDocId ? "active" : ""}`}
            onClick={() => onSelect(doc.id)}
            title={doc.name}
          >
            <FileText size={13} />
            <span className="doc-tab-name">{doc.name}</span>
            {doc.pages.some((p) => p.dirty) && <span className="dot-dirty" />}
            <span className="tab-close" onClick={(e) => handleClose(e, doc.id)} title="Close document">
              <X size={12} />
            </span>
          </button>
        ))}
      </div>
      {confirmClose && dirtyDoc && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="unsaved-modal">
            <h3>Unsaved changes</h3>
            <p>&ldquo;{dirtyDoc.name}&rdquo; has unsaved changes. What would you like to do?</p>
            <div className="unsaved-actions">
              <button className="quiet-button" onClick={() => setConfirmClose(null)}>Cancel</button>
              <button className="quiet-button destructive" onClick={() => { onDiscardAndClose(confirmClose); setConfirmClose(null); }}>Discard</button>
              <button className="primary-button" onClick={() => { onSaveAndClose(confirmClose); setConfirmClose(null); }}>Save &amp; Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
