"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive, Bot, Calculator, ChevronDown, ChevronRight, ClipboardList,
  Cloud, FilePlus2, FileText, Languages, MessageSquareText,
  PanelRightClose, PanelRightOpen, Plus, Printer,
  Save, Scale, Search, ScanLine, Share2, Sparkles,
  Upload, X, ZoomIn, ZoomOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Page, ToolId, WorkspaceDoc } from "@/components/workspace/types";
import { useWorkspace } from "@/components/workspace/workspace-store";
import { NotesPanel, InlineNoteAdder } from "@/components/workspace/notes-panel";
import { DocumentSearch } from "@/components/workspace/document-search";
import { TableToolbar } from "@/components/workspace/table-toolbar";
import { IndexPanel } from "@/components/workspace/index-panel";
import { WordToolbar } from "@/components/workspace/word-toolbar";
import { AnalysePanel } from "@/components/workspace/analyse-panel";
import { DigitisePanel } from "@/components/workspace/digitise-panel";
import { VerificationWorkspace } from "@/components/workspace/verification-workspace";
import { ResearchPanel } from "@/components/workspace/research-panel";
import { DraftPanel } from "@/components/workspace/draft-panel";
import { TranslationPanel } from "@/components/workspace/translation-panel";
import { TemplatesPanel } from "@/components/workspace/templates-panel";
import { SharingPanel } from "@/components/workspace/sharing-panel";
import { PrintDialog, PrintStack } from "@/components/workspace/print-dialog";
import { PdfPage } from "@/components/workspace/pdf-page";

/* ── Tools catalogue ──────────────────────────────────────────────── */
const tools: Array<{ id: ToolId; label: string; icon: LucideIcon }> = [
  { id: "digitise", label: "Document Digitisation", icon: ScanLine },
  { id: "analyse", label: "Analyse AI", icon: Sparkles },
  { id: "research", label: "Research & Case Law AI", icon: Search },
  { id: "advo", label: "Draft AI", icon: Bot },
  { id: "translate", label: "Translation AI", icon: Languages },
  { id: "calculator", label: "Suit Calculator", icon: Calculator },
  { id: "indexing", label: "Indexing", icon: ClipboardList },
  { id: "templates", label: "Legal Templates", icon: FileText },
];



const plainTextToHtml = (text: string) => text
  .split(/\n{2,}/)
  .map((paragraph) => `<p>${paragraph
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\n", "<br>")}</p>`)
  .join("");

const htmlToPlainText = (html: string) => html
  .replace(/<br\s*\/?>/gi, "\n")
  .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/[ \t]+/g, " ")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

/* ── Main workspace ──────────────────────────────────────────────── */
export default function LegalWorkspace() {
  const ws = useWorkspace();
  const {
    docs, activeDoc, activePage, activeDocId, activePageId, setActivePageId, setActiveDocId,
    notes, saved, zoom, setZoom,
    verificationMode, setVerificationMode,
    saveWorkspace, updatePage, createDocument, createDocumentFromHtml, createPage,
    openDocument,
    renameDocument, deleteDocument, reorderDocs,
    deletePage, addNote, removeNote, scrollExcludedDocIds, toggleDocScrollExclusion,
    addLinkedTable, updateLinkedTables, addFilesToWorkspace,
  } = ws;

  const [panel, setPanel] = useState<ToolId | "notes" | null>(null);
  const [toolMenu, setToolMenu] = useState(false);
  const [isCaseFilesOpen, setIsCaseFilesOpen] = useState(true);
  const [printOpen, setPrintOpen] = useState(false);
  const [printPageSelection, setPrintPageSelection] = useState<string[]>(["p1", "p2", "a1"]);
  const [pageNumberPosition, setPageNumberPosition] = useState<"top" | "bottom">("bottom");
  const [startNumber, setStartNumber] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  const [printPageRange, setPrintPageRange] = useState("");
  const [printOrientation, setPrintOrientation] = useState<"portrait" | "landscape">("portrait");
  const [printSided, setPrintSided] = useState<"single" | "double">("single");
  const [printIncludeNotes, setPrintIncludeNotes] = useState(false);
  const [printIncludeIndex, setPrintIncludeIndex] = useState(false);
  const [pageSize, setPageSize] = useState<"a4" | "green">("a4");
  const [verificationDraft, setVerificationDraft] = useState("");
  const [verificationSourceDocId, setVerificationSourceDocId] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isContinuousScroll = true;
  const [collapsedDocs, setCollapsedDocs] = useState<string[]>([]);
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [dragOverDocId, setDragOverDocId] = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<"top" | "bottom" | null>(null);

  const togglePanel = (next: ToolId | "notes") => { setPanel((old) => old === next ? null : next); setToolMenu(false); };

  const openVerification = useCallback((text: string) => {
    const fallback = activePage?.extractedText || htmlToPlainText(activePage?.html || "");
    if (text.trim() || !verificationDraft.trim()) setVerificationDraft(text.trim() || fallback);
    setVerificationSourceDocId(activeDocId);
    setVerificationMode(true);
  }, [activeDocId, activePage, setVerificationMode, verificationDraft]);

  const approveVerification = useCallback(() => {
    if (!verificationDraft.trim()) return;
    const source = docs.find((doc) => doc.id === verificationSourceDocId) ?? activeDoc;
    if (!source) return;
    createDocumentFromHtml(`${source.name.replace(/\.[^.]+$/, "")} — Approved text`, plainTextToHtml(verificationDraft), source.id);
    setVerificationMode(false);
  }, [activeDoc, createDocumentFromHtml, docs, setVerificationMode, verificationDraft, verificationSourceDocId]);

  const createAiDraft = useCallback((instruction: string) => {
    const subject = instruction.replace(/^draft\s*/i, "").trim() || "Legal response";
    const draftText = `DRAFT — ${subject}\n\nPrepared from the instruction: ${instruction}\n\nBackground\nSet out the relevant facts, dates and parties here.\n\nSubmissions\n1. State the principal legal grounds.\n2. Connect each ground to the supporting facts and documents.\n3. Address the likely response from the opposing party.\n\nRelief requested\nSet out the precise orders or relief sought.`;
    createDocumentFromHtml(`AI Draft — ${subject.slice(0, 48)}`, plainTextToHtml(draftText), activeDocId);
  }, [activeDocId, createDocumentFromHtml]);

  /* ── execCommand helper ── */
  const command = useCallback((name: string, value?: string) => {
    const activeEditor = editorRefs.current.get(activePageId);
    activeEditor?.focus();
    document.execCommand(name, false, value);
    if (activeEditor) updatePage(activePageId, activeEditor.innerHTML);
  }, [activePageId, updatePage]);

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
          <div className="tool-launcher-wrap">
            <button className="primary-button" onClick={() => setToolMenu((o) => !o)}><Sparkles size={16} /> AI & Tools <ChevronDown size={14} /></button>
            {toolMenu && <div className="tool-launcher">
              <div className="tool-launcher-title">Workspace tools</div>
              {tools.map((item) => <button key={item.id} onClick={() => togglePanel(item.id)}><span className="tool-icon"><item.icon size={17} /></span><strong>{item.label}</strong><ChevronRight size={15} /></button>)}
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
              originalSource={activeDoc.kind === "pdf" ? (activeDoc.pdfData || "") : (activePage?.html.match(/src=["']([^"']+)["']/)?.[1] || "")}
              sourceKind={activeDoc.kind === "pdf" ? "pdf" : "image"}
              pageNumber={activePage?.pdfPageNumber}
              text={verificationDraft}
              title={activePage?.title || activeDoc.name}
              onClose={() => setVerificationMode(false)}
              onTextChange={setVerificationDraft}
            />
          ) : (
            <>
          <div className="editor-statusbar">
            <span><FileText size={14} /> {activePage?.title} · Page {(activeDoc?.pages.findIndex((p) => p.id === activePageId) ?? 0) + 1} of {activeDoc?.pages.length ?? 0}</span>
            <div>
              <label className="page-size-control">Page
                <select value={pageSize} onChange={(event) => setPageSize(event.target.value as "a4" | "green")}>
                  <option value="a4">A4</option>
                  <option value="green">Green sheet / Legal</option>
                </select>
              </label>
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
                        <FileText size={15} /> <strong>{doc.name}</strong>
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
                        <article className={`paper page-size-${pageSize} ${doc.kind === "pdf" ? "pdf-paper" : ""}`} style={{ width: `${zoom}%` }}>
                          {doc.kind === 'pdf' ? (
                            <PdfPage source={doc.pdfData ?? ""} pageNumber={page.pdfPageNumber ?? index + 1} label={doc.name} />
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
              <h2>{panel === "notes" ? "Notes" : tools.find((t) => t.id === panel)?.label}</h2>
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
              {panel === "digitise" && (
                <DigitisePanel
                  activeDoc={activeDoc}
                  activePage={activePage}
                  updatePage={updatePage}
                  onChooseFile={() => fileInputRef.current?.click()}
                  onOpenVerification={openVerification}
                  onApprove={approveVerification}
                  canApprove={Boolean(verificationDraft.trim())}
                  verificationText={verificationDraft}
                  onTextChange={setVerificationDraft}
                />
              )}
              {panel === "analyse" && <AnalysePanel html={activePage?.html ?? ""} />}
              {panel === "research" && <ResearchPanel />}
              {panel === "advo" && <DraftPanel onCreateDraft={createAiDraft} activePageHtml={activePage?.html} />}
              {panel === "translate" && <TranslationPanel activePageHtml={activePage?.html} onCreateTranslatedDoc={(title, html) => {
                createDocumentFromHtml(title, html, activeDocId);
              }} />}
              {panel === "templates" && <TemplatesPanel onCreateTemplateDoc={(title, html) => {
                createDocumentFromHtml(title, html, activeDocId);
              }} />}
              {panel === "sharing" && <SharingPanel workspaceData={JSON.stringify(docs)} />}
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

      <button className="floating-panel-toggle" onClick={() => setPanel(panel ? null : "research")} title="Toggle tools">{panel ? <PanelRightClose /> : <PanelRightOpen />}</button>

      {/* ── Print dialog ── */}
      {printOpen && (
        <PrintDialog
          docs={docs}
          selectedPages={printPageSelection}
          setSelectedPages={setPrintPageSelection}
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
      <PrintStack docs={docs} selectedPages={printPageSelection} position={pageNumberPosition} start={startNumber} />
    </main>
  );
}


