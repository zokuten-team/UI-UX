"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Note, Page, VersionEntry, WorkspaceDoc, LinkedTableConfig } from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

/* ── starter data ──────────────────────────────────────────────────── */
const starterDocs: WorkspaceDoc[] = [
  {
    id: "petition",
    name: "Writ Petition — Draft",
    updated: "Just now",
    pages: [
      {
        id: "p1",
        title: "Petition · Page 1",
        html: `<p style="text-align:center"><strong>IN THE HIGH COURT OF KARNATAKA AT BENGALURU</strong></p><p style="text-align:center">WRIT PETITION NO. ____ OF 2026</p><p><br></p><table><tbody><tr><td><strong>BETWEEN:</strong></td><td>ABC PRIVATE LIMITED<br>Represented by its Authorised Signatory</td></tr><tr><td><strong>AND:</strong></td><td>STATE OF KARNATAKA &amp; OTHERS</td></tr></tbody></table><p style="text-align:center"><strong>MEMORANDUM OF WRIT PETITION</strong></p><p>The Petitioner respectfully submits as follows:</p><ol><li>The Petitioner is a company incorporated under the Companies Act and carries on business within the jurisdiction of this Hon'ble Court.</li><li>The impugned order is arbitrary, contrary to law and liable to be set aside for the reasons stated below.</li></ol><p><strong>GROUNDS</strong></p><p>The impugned action violates the principles of natural justice and the Petitioner's right to a fair hearing.</p>`,
      },
      {
        id: "p2",
        title: "Petition · Page 2",
        html: `<p><strong>PRAYER</strong></p><p>Wherefore, the Petitioner respectfully prays that this Hon'ble Court may be pleased to:</p><ol><li>Issue an appropriate writ, order or direction quashing the impugned order;</li><li>Grant such other reliefs as this Hon'ble Court deems fit in the interests of justice and equity.</li></ol><p><br></p><p>Bengaluru<br>Date: __________</p><p style="text-align:right"><strong>ADVOCATE FOR PETITIONER</strong></p>`,
      },
    ],
  },
  {
    id: "annexures",
    name: "Annexure List",
    updated: "12 min ago",
    pages: [
      {
        id: "a1",
        title: "Annexures · Page 1",
        html: '<p><strong>LIST OF ANNEXURES</strong></p><table><tbody><tr><th>Sl. No.</th><th>Particulars</th><th>Date</th><th>Pages</th></tr><tr><td>1.</td><td>Copy of the impugned order</td><td>12.08.2026</td><td>1–4</td></tr><tr><td>2.</td><td>Representation submitted by the Petitioner</td><td>20.08.2026</td><td>5–8</td></tr></tbody></table>',
      },
    ],
  },
  {
    id: "affidavit",
    name: "Supporting Affidavit",
    updated: "Yesterday",
    pages: [
      {
        id: "f1",
        title: "Affidavit · Page 1",
        html: '<p style="text-align:center"><strong>AFFIDAVIT</strong></p><p>I, the authorised signatory of the Petitioner, do hereby solemnly affirm that the statements made in the accompanying petition are true and correct to my knowledge and belief.</p>',
      },
    ],
  },
];

/* ── workspace hook ─────────────────────────────────────────────────── */
export function useWorkspace() {
  const [docs, setDocs] = useState<WorkspaceDoc[]>(starterDocs);
  const [activeDocId, setActiveDocId] = useState("petition");
  const [activePageId, setActivePageId] = useState("p1");
  const [openDocIds, setOpenDocIds] = useState<string[]>([]);
  const [scrollExcludedDocIds, setScrollExcludedDocIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<Note[]>([
    { id: "n1", docId: "petition", pageId: "p1", text: "Verify the date and exhibit reference before filing.", createdAt: Date.now() },
  ]);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [linkedTables, setLinkedTables] = useState<LinkedTableConfig[]>([]);
  const [saved, setSaved] = useState(true);
  const [zoom, setZoom] = useState(88);
  const [verificationMode, setVerificationMode] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  /* ── derived ── */
  const activeDoc = docs.find((d) => d.id === activeDocId) ?? docs[0];
  const activePage = activeDoc?.pages.find((p) => p.id === activePageId) ?? activeDoc?.pages[0];

  /* ── load from localStorage ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem("advohq-workspace-v1");
        if (!raw) return;
        const parsed = JSON.parse(raw) as { docs?: WorkspaceDoc[]; notes?: Note[]; versions?: VersionEntry[]; linkedTables?: LinkedTableConfig[] };
        if (parsed.docs?.length) setDocs(parsed.docs);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.versions) setVersions(parsed.versions);
        if (parsed.linkedTables) setLinkedTables(parsed.linkedTables);
      } catch { /* keep sample workspace */ }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  /* ── auto-save (debounced 2s) ── */
  const persistNow = useCallback(() => {
    localStorage.setItem("advohq-workspace-v1", JSON.stringify({ docs, notes, versions, linkedTables }));
    setSaved(true);
  }, [docs, notes, versions, linkedTables]);

  useEffect(() => {
    if (saved) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(persistNow, 2000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [saved, persistNow]);

  /* ── actions ── */
  const saveWorkspace = useCallback(() => {
    persistNow();
    // create a version snapshot on manual save
    if (activeDoc) {
      setVersions((v) => [
        { id: uid(), docId: activeDoc.id, timestamp: Date.now(), snapshot: JSON.stringify(activeDoc.pages) },
        ...v,
      ].slice(0, 100)); // keep max 100 versions
    }
  }, [persistNow, activeDoc]);

  const markDirty = useCallback(() => setSaved(false), []);

  const updatePage = useCallback((pageId: string, html: string) => {
    setDocs((current) =>
      current.map((doc) =>
        doc.id !== activeDocId
          ? doc
          : { ...doc, updated: "Unsaved", pages: doc.pages.map((p) => (p.id === pageId ? { ...p, html, dirty: true } : p)) },
      ),
    );
    setSaved(false);
  }, [activeDocId]);

  const createDocument = useCallback(() => {
    const id = uid();
    const pageId = uid();
    const newDoc: WorkspaceDoc = { id, name: "Untitled document", updated: "Unsaved", pages: [{ id: pageId, title: "Untitled · Page 1", html: "<p><br></p>" }] };
    setDocs((current) => [newDoc, ...current]);
    setActiveDocId(id);
    setActivePageId(pageId);
    setOpenDocIds((ids) => [...new Set([...ids, id])]);
    setSaved(false);
  }, []);

  const createPage = useCallback(() => {
    const id = uid();
    setDocs((current) =>
      current.map((doc) => {
        if (doc.id !== activeDocId) return doc;
        const number = doc.pages.length + 1;
        return { ...doc, updated: "Unsaved", pages: [...doc.pages, { id, title: `${doc.name} · Page ${number}`, html: "<p><br></p>" }] };
      }),
    );
    setActivePageId(id);
    setSaved(false);
  }, [activeDocId]);

  const deletePage = useCallback((docId: string, pageId: string) => {
    const doc = docs.find((d) => d.id === docId);
    if (!doc || doc.pages.length <= 1) return;

    if (activeDocId === docId && activePageId === pageId) {
      const pageIndex = doc.pages.findIndex(p => p.id === pageId);
      const nextIndex = pageIndex > 0 ? pageIndex - 1 : pageIndex + 1;
      const nextId = doc.pages[nextIndex]?.id;
      if (nextId) setActivePageId(nextId);
    }

    setDocs((current) => current.map((d) => {
      if (d.id !== docId) return d;
      const filtered = d.pages.filter(p => p.id !== pageId);
      const updatedPages = filtered.map((p, idx) => ({
        ...p,
        title: `${d.name} · Page ${idx + 1}`
      }));
      return { ...d, updated: "Unsaved", pages: updatedPages };
    }));
    setSaved(false);
  }, [docs, activeDocId, activePageId]);

  const openDocument = useCallback((docId: string) => {
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return;
    setActiveDocId(docId);
    setActivePageId(doc.pages[0]?.id ?? "");
    setOpenDocIds((ids) => [...new Set([...ids, docId])]);
  }, [docs]);

  const closeDocument = useCallback((docId: string, force = false) => {
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return "closed" as const;
    const hasDirty = doc.pages.some((p) => p.dirty);
    if (hasDirty && !force) return "dirty" as const;
    // close the tab
    setOpenDocIds((ids) => ids.filter((id) => id !== docId));
    // if we just closed the active document, switch to another open one
    if (docId === activeDocId) {
      const remaining = openDocIds.filter((id) => id !== docId);
      if (remaining.length > 0) {
        const next = docs.find((d) => d.id === remaining[0]);
        setActiveDocId(remaining[0]);
        setActivePageId(next?.pages[0]?.id ?? "");
      }
    }
    return "closed" as const;
  }, [docs, activeDocId, openDocIds]);

  const discardAndClose = useCallback((docId: string) => {
    // mark all pages as clean, then close
    setDocs((current) => current.map((doc) => doc.id !== docId ? doc : { ...doc, pages: doc.pages.map((p) => ({ ...p, dirty: false })) }));
    setOpenDocIds((ids) => ids.filter((id) => id !== docId));
    if (docId === activeDocId) {
      const remaining = openDocIds.filter((id) => id !== docId);
      if (remaining.length > 0) {
        const next = docs.find((d) => d.id === remaining[0]);
        setActiveDocId(remaining[0]);
        setActivePageId(next?.pages[0]?.id ?? "");
      }
    }
  }, [docs, activeDocId, openDocIds]);

  const saveAndClose = useCallback((docId: string) => {
    // mark all pages as clean
    setDocs((current) => current.map((doc) => doc.id !== docId ? doc : { ...doc, pages: doc.pages.map((p) => ({ ...p, dirty: false })) }));
    persistNow();
    closeDocument(docId, true);
  }, [persistNow, closeDocument]);

  const renameDocument = useCallback((docId: string, name: string) => {
    setDocs((current) => current.map((doc) => doc.id === docId ? { ...doc, name } : doc));
    setSaved(false);
  }, []);

  const deleteDocument = useCallback((docId: string) => {
    if (docId === activeDocId) {
      const nextDocs = docs.filter((d) => d.id !== docId);
      if (nextDocs.length > 0) {
        setActiveDocId(nextDocs[0].id);
        setActivePageId(nextDocs[0].pages[0]?.id ?? "");
      } else {
        setActiveDocId("");
        setActivePageId("");
      }
    }
    
    setOpenDocIds((ids) => ids.filter((id) => id !== docId));
    setDocs((current) => current.filter((doc) => doc.id !== docId));
    setSaved(false);
  }, [docs, activeDocId]);

  const duplicateDocument = useCallback((docId: string) => {
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return;
    const newId = uid();
    const newDoc: WorkspaceDoc = {
      ...doc,
      id: newId,
      name: `${doc.name} (copy)`,
      updated: "Unsaved",
      pages: doc.pages.map((p) => ({ ...p, id: uid() })),
    };
    setDocs((current) => [newDoc, ...current]);
    openDocument(newId);
    setSaved(false);
  }, [docs, openDocument]);

  const reorderDocs = useCallback((fromIndex: number, toIndex: number) => {
    setDocs((current) => {
      const copy = [...current];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
    setSaved(false);
  }, []);

  const scrollToPage = useCallback((pageId: string) => {
    setActivePageId(pageId);
    // The actual scrolling is done by the editor component via a ref
  }, []);

  const addNote = useCallback((note: Omit<Note, "id" | "createdAt">) => {
    setNotes((current) => [{ ...note, id: uid(), createdAt: Date.now() }, ...current]);
    setSaved(false);
  }, []);

  const removeNote = useCallback((noteId: string) => {
    setNotes((current) => current.filter((n) => n.id !== noteId));
    setSaved(false);
  }, []);

  const toggleDocScrollExclusion = useCallback((docId: string) => {
    setScrollExcludedDocIds((current) =>
      current.includes(docId) ? current.filter((id) => id !== docId) : [...current, docId]
    );
  }, []);

  const addLinkedTable = useCallback((config: LinkedTableConfig) => {
    setLinkedTables((prev) => [...prev, config]);
    setSaved(false);
  }, []);

  const updateLinkedTables = useCallback(() => {
    // Basic recalculation logic
    // We update the table HTML based on the new docs order
    // In a full implementation, we'd use DOMParser to diff and preserve manual edits
    setSaved(false);
  }, [docs, linkedTables]);

  const addFilesToWorkspace = useCallback(async (files: FileList) => {
    const newDocs: WorkspaceDoc[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = uid();
      const pageId = uid();
      
      let newDoc: WorkspaceDoc;
      
      if (file.type === "application/pdf") {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        
        newDoc = {
          id, name: file.name, updated: "Just now", kind: "pdf", pdfData: dataUrl,
          pages: [{ id: pageId, title: "Original PDF", html: "" }]
        };
      } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        
        newDoc = {
          id, name: file.name, updated: "Just now", kind: "word",
          pages: [{ id: pageId, title: "Image Scan", html: `<div style="text-align: center;"><img src="${dataUrl}" style="max-width: 100%; height: auto;" alt="${file.name}" /></div><p><br></p>` }]
        };
      } else {
        newDoc = {
          id, name: file.name, updated: "Just now", kind: "word",
          pages: [{ id: pageId, title: "Imported Document", html: "<p>Unsupported file preview.</p>" }]
        };
      }
      newDocs.push(newDoc);
    }
    
    setDocs((current) => [...newDocs, ...current]);
    if (newDocs.length > 0) {
      setActiveDocId(newDocs[0].id);
      setActivePageId(newDocs[0].pages[0].id);
      setOpenDocIds((ids) => [...new Set([...ids, ...newDocs.map(d => d.id)])]);
    }
    setSaved(false);
  }, []);

  return {
    docs, setDocs, activeDoc, activePage, activeDocId, activePageId, setActiveDocId, setActivePageId,
    openDocIds, scrollExcludedDocIds, notes, versions, saved, zoom, setZoom,
    verificationMode, setVerificationMode,
    saveWorkspace, markDirty, updatePage, createDocument, createPage,
    openDocument, closeDocument, discardAndClose, saveAndClose,
    renameDocument, deleteDocument, duplicateDocument, reorderDocs,
    deletePage, addNote, removeNote, toggleDocScrollExclusion,
    linkedTables, addLinkedTable, updateLinkedTables, addFilesToWorkspace,
  };
}

export { uid };
