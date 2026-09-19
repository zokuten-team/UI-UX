"use client";

import { useState } from "react";
import {
  ChevronDown, Copy, Download, History, Pencil, Printer, Trash2,
} from "lucide-react";

type Props = {
  onRename: () => void;
  onDuplicate: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onVersionHistory: () => void;
  onDelete: () => void;
};

/** Labelled "More" dropdown replacing the unlabelled 3-dot icon button. */
export function MoreMenu({ onRename, onDuplicate, onDownload, onPrint, onVersionHistory, onDelete }: Props) {
  const [open, setOpen] = useState(false);

  const item = (icon: React.ReactNode, label: string, action: () => void, destructive = false) => (
    <button
      className={`more-menu-item ${destructive ? "destructive" : ""}`}
      onClick={() => { action(); setOpen(false); }}
    >
      {icon}<span>{label}</span>
    </button>
  );

  return (
    <div className="more-menu-wrap">
      <button
        className="quiet-button"
        onClick={() => setOpen((v) => !v)}
        title="More document actions"
      >
        More <ChevronDown size={13} />
      </button>
      {open && (
        <>
          <div className="more-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="more-menu">
            {item(<Pencil size={14} />, "Rename", onRename)}
            {item(<Copy size={14} />, "Duplicate", onDuplicate)}
            {item(<Download size={14} />, "Download as HTML", onDownload)}
            {item(<Printer size={14} />, "Print", onPrint)}
            {item(<History size={14} />, "Version history", onVersionHistory)}
            <div className="more-menu-sep" />
            {item(<Trash2 size={14} />, "Delete document", onDelete, true)}
          </div>
        </>
      )}
    </div>
  );
}
