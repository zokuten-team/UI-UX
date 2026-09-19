"use client";

import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import type { Note, Page } from "./types";

type Props = {
  pages: Array<Page & { docName: string; docId: string }>;
  notes: Note[];
  activeDocId: string;
  activePageId: string;
  onAddNote: (note: Omit<Note, "id" | "createdAt">) => void;
  onRemoveNote: (noteId: string) => void;
  onNavigateToNote: (docId: string, pageId: string) => void;
};

/** Side-panel notes view: create notes linked to any page + list all notes. */
export function NotesPanel({ pages, notes, activeDocId, activePageId, onAddNote, onRemoveNote, onNavigateToNote }: Props) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (!text.trim()) return;
    onAddNote({ docId: activeDocId, pageId: activePageId, text: text.trim() });
    setText("");
  };

  return (
    <div className="tool-section">
      <p className="helper">Add a note linked to the current page. Click any note to jump to its source.</p>
      <label>
        Note
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a fact check, drafting instruction or filing reminder…"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd(); }}
        />
      </label>
      <button className="panel-primary" onClick={handleAdd}>Add linked note</button>

      <div className="note-list">
        {notes.map((note) => {
          const page = pages.find((p) => p.id === note.pageId);
          return (
            <article key={note.id}>
              <div
                className="note-link-header"
                onClick={() => onNavigateToNote(note.docId, note.pageId)}
                title="Click to jump to linked page"
              >
                <MessageSquareText />
                <strong>{page?.title ?? "Linked page"}</strong>
                {note.selectedText && <em className="note-selected-text">&ldquo;{note.selectedText.slice(0, 60)}{note.selectedText.length > 60 ? "…" : ""}&rdquo;</em>}
              </div>
              <p>{note.text}</p>
              <div className="note-meta">
                <span>{new Date(note.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <button onClick={() => onRemoveNote(note.id)}>Remove</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/** Inline note adder rendered below each page in the continuous scroll view. */
export function InlineNoteAdder({ docId, pageId, onAddNote }: { docId: string; pageId: string; onAddNote: (note: Omit<Note, "id" | "createdAt">) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  if (!open) {
    return (
      <button className="inline-note-trigger" onClick={() => setOpen(true)}>
        <MessageSquareText size={13} /> Add note
      </button>
    );
  }

  return (
    <div className="inline-note-form">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a note linked to this page…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            if (text.trim()) {
              onAddNote({ docId, pageId, text: text.trim() });
              setText("");
              setOpen(false);
            }
          }
          if (e.key === "Escape") { setText(""); setOpen(false); }
        }}
      />
      <div>
        <button className="quiet-button" onClick={() => { setText(""); setOpen(false); }}>Cancel</button>
        <button className="primary-button" onClick={() => { if (text.trim()) { onAddNote({ docId, pageId, text: text.trim() }); setText(""); setOpen(false); } }}>Add</button>
      </div>
    </div>
  );
}

/** Compact note display rendered above a page in the continuous scroll view. */
export function PageNotes({ notes, onNavigateToNote, onRemoveNote }: { notes: Note[]; onNavigateToNote: (docId: string, pageId: string) => void; onRemoveNote: (noteId: string) => void }) {
  if (notes.length === 0) return null;
  return (
    <div className="page-notes-above">
      {notes.map((note) => (
        <div key={note.id} className="page-note-chip" onClick={() => onNavigateToNote(note.docId, note.pageId)}>
          <MessageSquareText size={11} />
          <span>{note.text.length > 80 ? note.text.slice(0, 80) + "…" : note.text}</span>
          <button onClick={(e) => { e.stopPropagation(); onRemoveNote(note.id); }} title="Remove note">&times;</button>
        </div>
      ))}
    </div>
  );
}
