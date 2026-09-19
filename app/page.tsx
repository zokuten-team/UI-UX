"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Archive, Bold,
  Bot, Calculator, Camera, ChevronDown, ChevronRight, ClipboardList,
  Cloud, FileDown, FilePlus2, FileText, FileUp, Highlighter, IndentDecrease,
  IndentIncrease, Italic, Languages, Link2, List, ListOrdered, MessageSquareText,
  PanelRightClose, PanelRightOpen, Plus, Printer, Quote,
  Redo2, Save, Scale, Search, ScanLine, Sparkles, Strikethrough, Table2, Underline,
  Undo2, Upload, X, ZoomIn, ZoomOut,
} from "lucide-react";

import type { Note, ToolId, Page, WorkspaceDoc } from "@/components/workspace/types";
import { useWorkspace, uid } from "@/components/workspace/workspace-store";
import { NotesPanel, InlineNoteAdder, PageNotes } from "@/components/workspace/notes-panel";
import { DocumentSearch } from "@/components/workspace/document-search";
import { TableToolbar } from "@/components/workspace/table-toolbar";
import { IndexPanel } from "@/components/workspace/index-panel";
import { WordToolbar } from "@/components/workspace/word-toolbar";
import { AnalysePanel } from "@/components/workspace/analyse-panel";
import { DigitisePanel } from "@/components/workspace/digitise-panel";
import { VerificationWorkspace } from "@/components/workspace/verification-workspace";

/* ── Tools catalogue ──────────────────────────────────────────────── */
const tools: Array<{ id: ToolId; label: string; description: string; icon: any }> = [
  { id: "digitise", label: "Document Digitisation", description: "Convert scans into searchable records", icon: ScanLine },
  { id: "analyse", label: "Analyse AI", description: "Review from a chosen legal perspective", icon: Sparkles },
  { id: "research", label: "Research & Case Law AI", description: "Search judgments and bare acts", icon: Search },
  { id: "advo", label: "Advo AI", description: "Draft, explain and refine", icon: Bot },
  { id: "translate", label: "Translation AI", description: "Translate the open document", icon: Languages },
  { id: "calculator", label: "Suit Calculator", description: "Valuation, court fee and jurisdiction", icon: Calculator },
  { id: "indexing", label: "Indexing", description: "Build a continuous document index", icon: ClipboardList },
];

const courts = ["All Courts", "Supreme Court of India", "Allahabad High Court", "Andhra Pradesh High Court", "Bombay High Court", "Calcutta High Court", "Delhi High Court", "Gujarat High Court", "Karnataka High Court", "Kerala High Court", "Madras High Court", "Telangana High Court"];

/* ── Main workspace ──────────────────────────────────────────────── */
export default function LegalWorkspace() {
  const ws = useWorkspace();
  const {
    docs, activeDoc, activePage, activeDocId, activePageId, setActivePageId, setActiveDocId,
    openDocIds, notes, saved, zoom, setZoom,
    verificationMode, setVerificationMode,
    saveWorkspace, updatePage, createDocument, createPage,
    openDocument, closeDocument, discardAndClose, saveAndClose,
    renameDocument, deleteDocument, duplicateDocument, reorderDocs,
    deletePage, addNote, removeNote, scrollExcludedDocIds, toggleDocScrollExclusion,
    addLinkedTable, updateLinkedTables, addFilesToWorkspace,
  } = ws;

  const [panel, setPanel] = useState<ToolId | "notes" | null>("research");
  const [toolMenu, setToolMenu] = useState(false);
  const [isCaseFilesOpen, setIsCaseFilesOpen] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);
  const [printSelection, setPrintSelection] = useState<string[]>(["petition", "annexures"]);
  const [pageNumberPosition, setPageNumberPosition] = useState<"top" | "bottom">("bottom");
  const [startNumber, setStartNumber] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  const [printPageRange, setPrintPageRange] = useState("");
  const [printOrientation, setPrintOrientation] = useState<"portrait" | "landscape">("portrait");
  const [printSided, setPrintSided] = useState<"single" | "double">("single");
  const [printIncludeNotes, setPrintIncludeNotes] = useState(false);
  const [printIncludeIndex, setPrintIncludeIndex] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isContinuousScroll, setIsContinuousScroll] = useState(true);
  const [collapsedDocs, setCollapsedDocs] = useState<string[]>([]);
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [dragOverDocId, setDragOverDocId] = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<"top" | "bottom" | null>(null);

  const togglePanel = (next: ToolId | "notes") => { setPanel((old) => old === next ? null : next); setToolMenu(false); };

  /* ── execCommand helper ── */
  const command = useCallback((name: string, value?: string) => {
    const activeEditor = editorRefs.current.get(activePageId);
    activeEditor?.focus();
    document.execCommand(name, false, value);
    if (activeEditor) updatePage(activePageId, activeEditor.innerHTML);
  }, [activePageId, updatePage]);

  const insertTable = () => command("insertHTML", `<table><tbody><tr><th>Heading</th><th>Heading</th><th>Heading</th></tr><tr><td>Text</td><td>Text</td><td>Text</td></tr><tr><td>Text</td><td>Text</td><td>Text</td></tr></tbody></table><p><br></p>`);
  const addLink = () => { const url = window.prompt("Paste the link URL"); if (url) command("createLink", url); };

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "s") { e.preventDefault(); saveWorkspace(); }
      if (mod && e.key === "f") { e.preventDefault(); setShowSearch(true); }
      if (mod && e.key === "b") { e.preventDefault(); command("bold"); }
      if (mod && e.key === "i") { e.preventDefault(); command("italic"); }
      if (mod && e.key === "u") { e.preventDefault(); command("underline"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveWorkspace, command]);

  /* ── Continuous scroll: track active page & doc via IntersectionObserver ── */
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            const pageId = entry.target.getAttribute("data-page-id");
            const docId = entry.target.getAttribute("data-doc-id");
            if (pageId && docId) {
              setActiveDocId(docId);
              setActivePageId(pageId);
            }
          }
        }
      },
      { root: scrollContainerRef.current, threshold: 0.3 },
    );
    const pages = scrollContainerRef.current.querySelectorAll("[data-page-id]");
    pages.forEach((p) => observer.observe(p));
    return () => observer.disconnect();
  }, [docs, isContinuousScroll, scrollExcludedDocIds, collapsedDocs, setActivePageId, setActiveDocId]);

  /* ── Navigate to note ── */
  const navigateToNote = useCallback((docId: string, pageId: string) => {
    if (docId !== activeDocId) openDocument(docId);
    setActivePageId(pageId);
    setTimeout(() => {
      const pageEl = scrollContainerRef.current?.querySelector(`[data-page-id="${pageId}"]`);
      pageEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [activeDocId, openDocument, setActivePageId]);

  /* ── Download active document as HTML ── */
  const downloadDocument = useCallback(() => {
    if (!activeDoc) return;
    const html = activeDoc.pages.map((p) => p.html).join("<hr style='page-break-after:always'>");
    const blob = new Blob([`<!DOCTYPE html><html><head><title>${activeDoc.name}</title></head><body>${html}</body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDoc.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeDoc]);

  /* ── All pages with doc info for notes ── */
  const allPagesWithDoc = useMemo(() =>
    docs.flatMap((doc) => doc.pages.map((page) => ({ ...page, docName: doc.name, docId: doc.id }))),
  [docs]);

  const handleDeleteDocument = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;
    const hasUnsaved = doc.pages.some(p => p.dirty);
    const warn = hasUnsaved ? "\n\nWARNING: This document has unsaved changes!" : "";
    if (window.confirm(`Delete this document and all its pages?${warn}`)) {
      deleteDocument(docId);
    }
  };

  const handleDeletePage = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    const doc = activeDoc;
    if (!doc) return;
    const page = doc.pages.find(p => p.id === pageId);
    if (!page) return;
    if (doc.pages.length <= 1) {
      alert("Cannot delete the only page in a document. Clear its contents or delete the document instead.");
      return;
    }
    const warn = page.dirty ? "\n\nWARNING: This page has unsaved changes!" : "";
    if (window.confirm(`Delete this page?${warn}`)) {
      deletePage(doc.id, pageId);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedDocId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedDocId === id) { setDragOverDocId(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isTop = e.clientY < rect.top + rect.height / 2;
    setDragOverDocId(id);
    setDragOverPos(isTop ? "top" : "bottom");
  };
  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggedDocId || draggedDocId === id) return;
    const fromIndex = docs.findIndex(d => d.id === draggedDocId);
    let toIndex = docs.findIndex(d => d.id === id);
    if (dragOverPos === "bottom") toIndex += 1;
    if (fromIndex < toIndex) toIndex -= 1;
    reorderDocs(fromIndex, toIndex);
    setDraggedDocId(null); setDragOverDocId(null); setDragOverPos(null);
  };

  return (
    <main className="legal-shell">
      {/* ── Top bar ── */}
      <header className="app-topbar">
        <div className="brand-mark"><Scale size={18} /><span>AdvoHQ</span></div>

        <div className="document-identity">
          <input
            value={activeDoc?.name ?? ""}
            onChange={(e) => renameDocument(activeDocId, e.target.value)}
            aria-label="Document name"
          />
          <span>{saved ? "Saved locally" : "Auto-saving…"}</span>
        </div>

        <div className="top-actions">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', marginRight: '16px', cursor: 'pointer' }}>
            <input type="checkbox" checked={isContinuousScroll} onChange={(e) => setIsContinuousScroll(e.target.checked)} style={{ width: '14px', height: '14px' }} />
            Continuous Scroll
          </label>
          <div className="tool-launcher-wrap">
            <button className="primary-button" onClick={() => setToolMenu((o) => !o)}><Sparkles size={16} /> AI & Tools <ChevronDown size={14} /></button>
            {toolMenu && <div className="tool-launcher">
              <div className="tool-launcher-title">Workspace tools</div>
              {tools.map((item) => <button key={item.id} onClick={() => togglePanel(item.id)}><span className="tool-icon"><item.icon size={17} /></span><span><strong>{item.label}</strong><small>{item.description}</small></span><ChevronRight size={15} /></button>)}
            </div>}
          </div>
          <button className={`quiet-button ${panel === "notes" ? "active" : ""}`} onClick={() => togglePanel("notes")}>
            <MessageSquareText size={16} /> <span>Notes</span>
          </button>
          <button className="quiet-button" onClick={saveWorkspace}><Save size={16} /> Save</button>
          <button className="quiet-button" onClick={() => setPrintOpen(true)}><Printer size={16} /> Print</button>
        </div>
      </header>

      {/* ── Search bar ── */}
      {showSearch && <DocumentSearch onClose={() => setShowSearch(false)} containerRef={scrollContainerRef} />}

      {/* ── Formatting ribbon ── */}
      <WordToolbar 
        editorRefs={editorRefs} 
        activePageId={activePageId} 
        updatePage={updatePage} 
      />

      {/* ── Workspace grid ── */}
      <div className={`workspace-grid ${panel ? "with-panel" : ""} ${!isCaseFilesOpen ? "sidebar-collapsed" : ""}`}>
        {/* Icon rail */}
        <nav className="icon-rail" aria-label="Workspace navigation">
          <button 
            className={isCaseFilesOpen ? "active" : ""} 
            title={isCaseFilesOpen ? "Collapse Case Files" : "Open Case Files"}
            aria-label={isCaseFilesOpen ? "Collapse Case Files" : "Open Case Files"}
            aria-expanded={isCaseFilesOpen}
            onClick={() => setIsCaseFilesOpen(v => !v)}
          >
            <FileText />
          </button>
          <button title="Search" onClick={() => setShowSearch(true)}><Search /></button>
          <button title="Archive"><Archive /></button>
          <span />
          <button title="Upload documents" onClick={() => fileInputRef.current?.click()}><Upload /></button>
        </nav>

        {/* File sidebar */}
        <aside className="file-sidebar">
          <div className="sidebar-heading">
            <span>CASE FILES</span>
          </div>

          {/* Scan Document */}
          <div className="new-doc-wrap">
            <button className="new-document" onClick={createDocument} style={{ marginBottom: 10 }}>
              <FilePlus2 size={15} /> New Blank Document
            </button>
            <button className="new-document" onClick={() => fileInputRef.current?.click()}>
              <ScanLine size={15} /> Scan Document
            </button>
          </div>

          <button className="upload-zone" onClick={() => fileInputRef.current?.click()}>
            <Cloud /><span>Drop files or browse</span><small>PDF, DOCX, images</small>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: "none" }} 
            multiple 
            accept=".pdf,image/*,.docx" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                addFilesToWorkspace(e.target.files);
              }
              // Reset so the same file can be uploaded again if needed
              e.target.value = "";
            }} 
          />

          <div className="file-list">
            {docs.map((doc) => {
              const isDragOver = dragOverDocId === doc.id;
              let dragClass = "";
              if (isDragOver && dragOverPos === "top") dragClass = "drag-over-top";
              if (isDragOver && dragOverPos === "bottom") dragClass = "drag-over-bottom";
              if (draggedDocId === doc.id) dragClass = "dragging";
              if (scrollExcludedDocIds.includes(doc.id)) dragClass += " opacity-50";

              return (
                <button
                  key={doc.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, doc.id)}
                  onDragOver={(e) => handleDragOver(e, doc.id)}
                  onDragLeave={() => { setDragOverDocId(null); setDragOverPos(null); }}
                  onDrop={(e) => handleDrop(e, doc.id)}
                  onDragEnd={() => { setDraggedDocId(null); setDragOverDocId(null); setDragOverPos(null); }}
                  className={`${doc.id === activeDocId ? "active" : ""} ${dragClass}`}
                  onClick={() => {
                    openDocument(doc.id);
                    if (isContinuousScroll) {
                       setTimeout(() => {
                         const el = scrollContainerRef.current?.querySelector(`[data-doc-id="${doc.id}"]`);
                         el?.scrollIntoView({ behavior: "smooth", block: "start" });
                       }, 100);
                    }
                  }}
                >
                  <FileText /><span><strong>{doc.name}</strong><small>{doc.pages.length} page{doc.pages.length === 1 ? "" : "s"} · {doc.updated}</small></span>
                  <span 
                    className="delete-item-btn" 
                    title="Delete document"
                    onClick={(e) => handleDeleteDocument(e, doc.id)}
                  >
                    <X size={14} />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Page thumbnails */}
          <div className="pages-heading"><span>PAGES</span></div>
          <div className="page-list">
            {activeDoc?.pages.map((page, index) => (
              <button
                key={page.id}
                className={page.id === activePageId ? "active" : ""}
                onClick={() => {
                  setActivePageId(page.id);
                  const el = scrollContainerRef.current?.querySelector(`[data-page-id="${page.id}"]`);
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <span className="page-thumb-number">{index + 1}</span>
                <p>{page.title}</p>
                <span 
                  className="delete-item-btn" 
                  title="Delete page"
                  onClick={(e) => handleDeletePage(e, page.id)}
                >
                  <X size={14} />
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Editor area: continuous scroll ── */}
        <section className="editor-area" style={{ position: 'relative' }}>
          
          {verificationMode && activeDoc ? (
            <VerificationWorkspace 
              originalImageSrc={
                activeDoc.kind === "pdf" ? (activeDoc.pdfData || "") : (activePage?.html.match(/src="([^"]+)"/)?.[1] || "")
              }
              onClose={() => setVerificationMode(false)}
              onVerified={() => setVerificationMode(false)}
            />
          ) : (
            <>
              <div className="editor-statusbar">
            <span><FileText size={14} /> {activePage?.title} · Page {(activeDoc?.pages.findIndex((p) => p.id === activePageId) ?? 0) + 1} of {activeDoc?.pages.length ?? 0}</span>
            <div>
              <button onClick={() => setZoom((v) => Math.max(60, v - 10))}><ZoomOut /></button>
              <span>{zoom}%</span>
              <button onClick={() => setZoom((v) => Math.min(130, v + 10))}><ZoomIn /></button>
            </div>
          </div>

          <div className="document-scroll" ref={scrollContainerRef}>
            {(isContinuousScroll ? docs.filter(d => !scrollExcludedDocIds.includes(d.id)) : (activeDoc ? [activeDoc] : [])).map((doc, docIndex) => {
              const isCollapsed = collapsedDocs.includes(doc.id);
              return (
                <div key={doc.id} className="continuous-doc-group">
                  {isContinuousScroll && (
                    <div className="continuous-doc-divider">
                      <span>
                        <button onClick={() => setCollapsedDocs(c => c.includes(doc.id) ? c.filter(id => id !== doc.id) : [...c, doc.id])} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>
                          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <FileText size={15} /> <strong>{doc.name}</strong> <small style={{ color: '#8b969e' }}>({doc.kind === 'pdf' ? 'PDF' : 'Rich Text'})</small>
                      </span>
                      <div className="doc-controls">
                        <button title="Exclude from scroll" onClick={() => toggleDocScrollExclusion(doc.id)}><Archive size={14} /></button>
                      </div>
                    </div>
                  )}

                  {!isCollapsed && doc.pages.map((page, index) => {
                    let bundleIndex = 0;
                    if (isContinuousScroll) {
                      for (let i = 0; i < docIndex; i++) {
                         const d = docs.filter(dx => !scrollExcludedDocIds.includes(dx.id))[i];
                         if (!collapsedDocs.includes(d.id)) bundleIndex += d.pages.length;
                      }
                      bundleIndex += index;
                    }
                    
                    return (
                      <div key={page.id} data-page-id={page.id} data-doc-id={doc.id} className="page-scroll-section progressive-render">
                        <article className="paper" style={{ width: `${zoom}%`, ...(doc.kind === 'pdf' ? { padding: 0, overflow: 'hidden' } : {}) }}>
                          {doc.kind === 'pdf' ? (
                            <iframe 
                              src={`${doc.pdfData}#toolbar=0&navpanes=0&scrollbar=0`} 
                              style={{ width: '100%', height: '85vh', border: 'none', display: 'block' }} 
                              title={doc.name} 
                            />
                          ) : (
                            <div
                              ref={(el) => { if (el) editorRefs.current.set(page.id, el); }}
                              className="rich-editor"
                              contentEditable={true}
                              suppressContentEditableWarning
                              dangerouslySetInnerHTML={{ __html: page.html }}
                              onInput={(e) => updatePage(page.id, e.currentTarget.innerHTML)}
                              onFocus={() => { setActiveDocId(doc.id); setActivePageId(page.id); }}
                              aria-label={`Editable page: ${page.title}`}
                            />
                          )}
                          {doc.kind !== 'pdf' && (
                            <TableToolbar
                              editorRef={{ current: editorRefs.current.get(page.id) ?? null }}
                              onContentChange={() => {
                                const el = editorRefs.current.get(page.id);
                                if (el) updatePage(page.id, el.innerHTML);
                              }}
                            />
                          )}
                          <footer>{doc.name} <span>Page {index + 1} {isContinuousScroll && `· Bundle Page ${bundleIndex + 1}`}</span></footer>
                        </article>

                        <InlineNoteAdder docId={doc.id} pageId={page.id} onAddNote={addNote} />
                      </div>
                    );
                  })}
                  {(!isContinuousScroll || doc.id === activeDocId) && !isCollapsed && doc.kind !== 'pdf' && (
                    <button className="canvas-add-page" onClick={() => { setActiveDocId(doc.id); createPage(); }}><Plus /> Add another page</button>
                  )}
                </div>
              );
            })}
          </div>
          </>
          )}
        </section>

        {/* ── Right panel ── */}
        {panel && (
          <aside className="right-panel">
            <div className="panel-top">
              <div><span className="eyebrow">PARALLEL VIEW</span><h2>{panel === "notes" ? "Notes" : tools.find((t) => t.id === panel)?.label}</h2></div>
              <button onClick={() => setPanel(null)} title="Close panel"><X /></button>
            </div>
            <div className="panel-content">
              {panel === "notes" && (
                <NotesPanel
                  pages={allPagesWithDoc}
                  notes={notes}
                  activeDocId={activeDocId}
                  activePageId={activePageId}
                  onAddNote={addNote}
                  onRemoveNote={removeNote}
                  onNavigateToNote={navigateToNote}
                />
              )}
              {panel === "digitise" && <DigitisePanel activeDoc={activeDoc} activePage={activePage} setVerificationMode={setVerificationMode} />}
              {panel === "analyse" && <AnalysePanel html={activePage?.html ?? ""} />}
              {panel === "research" && <ResearchPanel />}
              {panel === "advo" && <AdvoPanel />}
              {panel === "translate" && <TranslationPanel />}
              {panel === "calculator" && <div className="calculator-frame"><iframe title="Suit valuation calculator" src="/calculator" /></div>}
              {panel === "indexing" && (
                <IndexPanel 
                  docs={docs} 
                  onReorderDocs={reorderDocs} 
                  activeDocId={activeDocId}
                  activePageId={activePageId}
                  addLinkedTable={addLinkedTable}
                  updateLinkedTables={updateLinkedTables}
                  editorRefs={editorRefs}
                  updatePage={updatePage}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      <button className="floating-panel-toggle" onClick={() => setPanel(panel ? null : "research")} title="Toggle parallel panel">{panel ? <PanelRightClose /> : <PanelRightOpen />}</button>

      {/* ── Print dialog ── */}
      {printOpen && (
        <PrintDialog
          docs={docs}
          selected={printSelection}
          setSelected={setPrintSelection}
          position={pageNumberPosition}
          setPosition={setPageNumberPosition}
          start={startNumber}
          setStart={setStartNumber}
          pageRange={printPageRange}
          setPageRange={setPrintPageRange}
          orientation={printOrientation}
          setOrientation={setPrintOrientation}
          sided={printSided}
          setSided={setPrintSided}
          includeNotes={printIncludeNotes}
          setIncludeNotes={setPrintIncludeNotes}
          includeIndex={printIncludeIndex}
          setIncludeIndex={setPrintIncludeIndex}
          onClose={() => setPrintOpen(false)}
        />
      )}
      <PrintStack docs={docs.filter((d) => printSelection.includes(d.id))} position={pageNumberPosition} start={startNumber} />
    </main>
  );
}

/* ── Sub-panels (kept inline for simplicity) ──────────────────────── */

function AnalysePanel({ html }: { html: string }) {
  const [perspective, setPerspective] = useState("Petitioner");
  const [analysis, setAnalysis] = useState("");
  const textLength = html.replace(/<[^>]+>/g, " ").trim().length;
  const run = () => setAnalysis(`From the ${perspective.toLowerCase()} perspective, the open page contains ${textLength} characters. Priority review: establish jurisdiction, identify each material fact and supporting annexure, test limitation, and connect every prayer to a pleaded ground. This preview is ready for a document-analysis backend.`);
  return (
    <div className="tool-section">
      <p className="helper">Choose whose case the review should strengthen or challenge.</p>
      <label>Perspective
        <select value={perspective} onChange={(e) => setPerspective(e.target.value)}>
          {["Complainant", "Plaintiff", "Petitioner", "Defendant", "Respondent", "Accused", "Appellant", "Prosecution", "Neutral reviewer", "Judge / tribunal"].map((v) => <option key={v}>{v}</option>)}
        </select>
      </label>
      <div className="quick-grid">
        <button onClick={run}>Case theory</button><button onClick={run}>Weak points</button>
        <button onClick={run}>Missing evidence</button><button onClick={run}>Relief check</button>
      </div>
      <button className="panel-primary" onClick={run}><Sparkles /> Analyse open page</button>
      {analysis && <div className="ai-output"><strong>{perspective} review</strong><p>{analysis}</p></div>}
    </div>
  );
}

function ResearchPanel() {
  const [scope, setScope] = useState<"Judgements" | "Bare Acts">("Judgements");
  const [court, setCourt] = useState("Supreme Court of India");
  const [term, setTerm] = useState("principles of natural justice administrative order");
  const [searched, setSearched] = useState(true);
  return (
    <div className="tool-section research-panel">
      <div className="segmented"><button className={scope === "Judgements" ? "active" : ""} onClick={() => setScope("Judgements")}>Judgements</button><button className={scope === "Bare Acts" ? "active" : ""} onClick={() => setScope("Bare Acts")}>Bare Acts</button></div>
      <div className="filter-grid">
        <label>Court<select value={court} onChange={(e) => setCourt(e.target.value)}>{courts.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Search preference<select><option>Exact phrase + semantic</option><option>Most cited</option><option>Latest first</option></select></label>
        <label className="span-two">Search term<textarea value={term} onChange={(e) => setTerm(e.target.value)} /></label>
        <label>From<input type="date" /></label><label>To<input type="date" /></label>
        <label>Act title<input placeholder="e.g. Constitution of India" /></label><label>Section<input placeholder="Article / section" /></label>
        <label>Party 1<input placeholder="Party name" /></label><label>Party 2<input placeholder="Opposite party" /></label>
        <label className="span-two">Judge / advocate<input placeholder="Names, separated by commas" /></label>
      </div>
      <button className="panel-primary" onClick={() => setSearched(true)}><Search /> Search with AI</button>
      {searched && <div className="research-results"><div className="result-summary"><strong>3 relevant authorities</strong><span>AI-ranked preview</span></div>
        {[
          ["Maneka Gandhi v. Union of India", "Supreme Court of India · (1978) 1 SCC 248", "Fair procedure and natural justice form part of non-arbitrariness under Article 14."],
          ["Canara Bank v. Debasis Das", "Supreme Court of India · (2003) 4 SCC 557", "Explains the core rules of natural justice and the requirement of a fair hearing."],
          ["Dharampal Satyapal Ltd. v. Dy. Commissioner", "Supreme Court of India · (2015) 8 SCC 519", "Considers prejudice and the consequences of breach of natural justice."],
        ].map(([title, meta, note], i) => <article key={title}><div className="result-rank">{i + 1}</div><div><h3>{title}</h3><span>{meta}</span><p>{note}</p><div><button>Open</button><button>Add citation</button><button>Ask AI</button></div></div></article>)}
      </div>}
    </div>
  );
}

function AdvoPanel() {
  const [messages, setMessages] = useState<Array<{ role: "ai" | "user"; text: string }>>([{ role: "ai", text: "I can help draft, compare clauses, create a chronology or explain the open document." }]);
  const [input, setInput] = useState("");
  const send = () => { if (!input.trim()) return; const prompt = input.trim(); setMessages((c) => [...c, { role: "user", text: prompt }, { role: "ai", text: "This frontend is ready to send that request with the open page and selected case files to the Advo AI backend." }]); setInput(""); };
  return (
    <div className="tool-section chat-tool">
      <div className="quick-grid"><button onClick={() => setInput("Summarise the open page")}>Summarise</button><button onClick={() => setInput("Extract key clauses")}>Key clauses</button><button onClick={() => setInput("Create action items")}>Action items</button><button onClick={() => setInput("Draft a response")}>Draft response</button></div>
      <div className="chat-messages">{messages.map((m, i) => <div key={i} className={m.role}>{m.text}</div>)}</div>
      <div className="chat-input"><textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Advo AI about this matter…" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} /><button onClick={send}><ChevronRight /></button></div>
    </div>
  );
}

function TranslationPanel() {
  const [language, setLanguage] = useState("Kannada");
  const [done, setDone] = useState(false);
  return (
    <div className="tool-section">
      <p className="helper">Translate the open page while preserving headings, tables and paragraph structure.</p>
      <label>Target language<select value={language} onChange={(e) => { setLanguage(e.target.value); setDone(false); }}>{["Kannada", "Hindi", "Tamil", "Telugu", "Malayalam", "Marathi", "Bengali", "Gujarati", "Punjabi", "Urdu", "English"].map((l) => <option key={l}>{l}</option>)}</select></label>
      <label>Legal terminology<select><option>Preserve English legal terms</option><option>Translate where equivalent exists</option><option>Plain-language translation</option></select></label>
      <button className="panel-primary" onClick={() => setDone(true)}><Languages /> Translate open page</button>
      {done && <div className="ai-output"><strong>{language} translation queued</strong><p>The translated page will appear beside the original when the translation service is connected.</p></div>}
    </div>
  );
}

/* ── Print ──────────────────────────────────────────────────────────── */
type PrintDialogProps = {
  docs: WorkspaceDoc[]; selected: string[]; setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  position: "top" | "bottom"; setPosition: (v: "top" | "bottom") => void;
  start: number; setStart: (v: number) => void;
  pageRange: string; setPageRange: (v: string) => void;
  orientation: "portrait" | "landscape"; setOrientation: (v: "portrait" | "landscape") => void;
  sided: "single" | "double"; setSided: (v: "single" | "double") => void;
  includeNotes: boolean; setIncludeNotes: (v: boolean) => void;
  includeIndex: boolean; setIncludeIndex: (v: boolean) => void;
  onClose: () => void;
};

function PrintDialog({ docs, selected, setSelected, position, setPosition, start, setStart, pageRange, setPageRange, orientation, setOrientation, sided, setSided, includeNotes, setIncludeNotes, includeIndex, setIncludeIndex, onClose }: PrintDialogProps) {
  const count = docs.filter((d) => selected.includes(d.id)).reduce((s, d) => s + d.pages.length, 0);
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="print-dialog">
        <div className="modal-title"><div><span className="eyebrow">PRINT / EXPORT</span><h2>Configure print bundle</h2></div><button onClick={onClose}><X /></button></div>
        <div className="print-body">
          <section>
            <h3>Documents</h3>
            <div className="print-files">
              {docs.map((doc) => <label key={doc.id}><input type="checkbox" checked={selected.includes(doc.id)} onChange={(e) => setSelected((c) => e.target.checked ? [...c, doc.id] : c.filter((id) => id !== doc.id))} /><FileText /><span><strong>{doc.name}</strong><small>{doc.pages.length} page{doc.pages.length === 1 ? "" : "s"}</small></span></label>)}
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

function PrintStack({ docs, position, start }: { docs: WorkspaceDoc[]; position: "top" | "bottom"; start: number }) {
  const pages = docs.flatMap((d) => d.pages.map((p) => ({ ...p, docId: d.id })));
  return <div className="print-stack">{pages.map((page, i) => <article className="print-page" key={`${page.docId}-${page.id}`}><div className={`printed-number ${position}`}>{start + i}</div><div dangerouslySetInnerHTML={{ __html: page.html }} /></article>)}</div>;
}
