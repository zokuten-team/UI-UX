"use client";

import { useEffect, useRef, useState } from "react";
import { EditorCommands, MultilevelListType } from "@/utils/editor-commands";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold,
  Highlighter, IndentDecrease, IndentIncrease, Italic, 
  List, ListOrdered, Paintbrush, Strikethrough, 
  Subscript, Superscript, Underline, Undo2, Redo2, Type, 
  Minus, FilePlus2
} from "lucide-react";

type Props = {
  editorRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  activePageId: string;
  updatePage: (id: string, html: string) => void;
};

export function WordToolbar({ editorRefs, activePageId, updatePage }: Props) {
  const [formatPainterActive, setFormatPainterActive] = useState(false);
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});
  const [activeValues, setActiveValues] = useState<Record<string, string>>({ fontName: "Georgia", fontSize: "3", formatBlock: "p" });
  const [legalNumbering, setLegalNumbering] = useState("");
  const savedSelection = useRef<{ pageId: string; range: Range } | null>(null);

  const editorForNode = (node: Node | null) => {
    if (!node) return null;
    for (const [pageId, editor] of editorRefs.current.entries()) {
      if (editor === node || editor.contains(node)) return { pageId, editor };
    }
    return null;
  };

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const target = editorForNode(range.commonAncestorContainer);
    if (target) savedSelection.current = { pageId: target.pageId, range: range.cloneRange() };
  };

  useEffect(() => {
    const updateActiveStates = () => {
      const activeEditor = editorRefs.current.get(activePageId);
      const selection = window.getSelection();
      if (!activeEditor || !selection?.rangeCount || !activeEditor.contains(selection.anchorNode)) return;

      const range = selection.getRangeAt(0);
      savedSelection.current = { pageId: activePageId, range: range.cloneRange() };
      setActiveStates({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        subscript: document.queryCommandState("subscript"),
        superscript: document.queryCommandState("superscript"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
        justifyFull: document.queryCommandState("justifyFull"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      });
      setActiveValues({
        fontName: document.queryCommandValue("fontName")?.replace(/['"]/g, "") || "Georgia",
        fontSize: document.queryCommandValue("fontSize") || "3",
        formatBlock: document.queryCommandValue("formatBlock") || "p",
      });
    };
    document.addEventListener("selectionchange", updateActiveStates);
    return () => document.removeEventListener("selectionchange", updateActiveStates);
  }, [activePageId, editorRefs]);

  const runCommand = (action: () => void) => {
    const bookmark = savedSelection.current;
    const pageId = bookmark?.pageId ?? activePageId;
    const activeEditor = editorRefs.current.get(pageId);
    if (activeEditor) {
      activeEditor.focus({ preventScroll: true });
      if (bookmark && activeEditor.contains(bookmark.range.commonAncestorContainer)) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(bookmark.range);
      }
      action();
      updatePage(pageId, activeEditor.innerHTML);
      rememberSelection();
    }
  };

  const command = (name: string, value?: string) => {
    runCommand(() => EditorCommands.command(name, value));
  };

  const toggleFormatPainter = () => {
    if (!formatPainterActive) {
      runCommand(() => EditorCommands.copyFormat());
      setFormatPainterActive(true);
    } else {
      runCommand(() => EditorCommands.pasteFormat());
      setFormatPainterActive(false);
    }
  };

  return (
    <section 
      className="word-ribbon" 
      aria-label="Document formatting toolbar"
      onMouseDown={(e) => {
        rememberSelection();
        if ((e.target as HTMLElement).closest("button")) {
          e.preventDefault();
        }
      }}
    >
      
      {/* Undo/Redo & Painter */}
      <div className="ribbon-group">
        <button title="Undo (Ctrl+Z)" onClick={() => command("undo")}><Undo2 size={15} /></button>
        <button title="Redo (Ctrl+Shift+Z)" onClick={() => command("redo")}><Redo2 size={15} /></button>
        <button 
          title="Format Painter" 
          onClick={toggleFormatPainter} 
          className={formatPainterActive ? "active" : ""}
        >
          <Paintbrush size={15} />
        </button>
      </div>

      {/* Font & Style */}
      <div className="ribbon-group selectors">
        <select aria-label="Paragraph style" value={activeValues.formatBlock} onPointerDown={rememberSelection} onChange={(e) => command("formatBlock", e.target.value)}>
          <option value="p">Normal</option>
          <option value="h1">Title</option>
          <option value="h2">Heading 1</option>
          <option value="h3">Heading 2</option>
          <option value="h4">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        <select aria-label="Font Family" value={activeValues.fontName} onPointerDown={rememberSelection} onChange={(e) => command("fontName", e.target.value)}>
          <option>Georgia</option>
          <option>Arial</option>
          <option>Times New Roman</option>
          <option>Calibri</option>
          <option>Garamond</option>
        </select>
        <select aria-label="Font size" value={activeValues.fontSize} onPointerDown={rememberSelection} onChange={(e) => runCommand(() => EditorCommands.setFontSize(e.target.value))}>
          <option value="1">8</option>
          <option value="2">10</option>
          <option value="3">12</option>
          <option value="4">14</option>
          <option value="5">18</option>
          <option value="6">24</option>
          <option value="7">36</option>
        </select>
      </div>

      {/* Formatting toggles */}
      <div className="ribbon-group">
        <button className={activeStates.bold ? "active" : ""} title="Bold (Ctrl+B)" onClick={() => command("bold")}><Bold size={15} /></button>
        <button className={activeStates.italic ? "active" : ""} title="Italic (Ctrl+I)" onClick={() => command("italic")}><Italic size={15} /></button>
        <button className={activeStates.underline ? "active" : ""} title="Underline (Ctrl+U)" onClick={() => command("underline")}><Underline size={15} /></button>
        <button className={activeStates.strikeThrough ? "active" : ""} title="Strikethrough" onClick={() => command("strikeThrough")}><Strikethrough size={15} /></button>
        <button className={activeStates.subscript ? "active" : ""} title="Subscript" onClick={() => command("subscript")}><Subscript size={15} /></button>
        <button className={activeStates.superscript ? "active" : ""} title="Superscript" onClick={() => command("superscript")}><Superscript size={15} /></button>
        <button title="Clear Formatting" onClick={() => command("removeFormat")}><Type size={15} /></button>
      </div>

      {/* Colors */}
      <div className="ribbon-group">
        <label className="color-control" title="Text colour">
          <span>A</span>
          <input type="color" aria-label="Text colour" onPointerDown={rememberSelection} onChange={(e) => runCommand(() => EditorCommands.setTextColor(e.target.value))} defaultValue="#111827" />
        </label>
        <label className="color-control" title="Highlight selected text">
          <Highlighter size={15} />
          <input type="color" aria-label="Highlight colour" onPointerDown={rememberSelection} onChange={(e) => runCommand(() => EditorCommands.setHighlight(e.target.value))} defaultValue="#fff2a8" />
        </label>
      </div>

      {/* Paragraph Alignment & Spacing */}
      <div className="ribbon-group">
        <button className={activeStates.justifyLeft ? "active" : ""} title="Align Left" onClick={() => runCommand(() => EditorCommands.setAlignment("left"))}><AlignLeft size={15} /></button>
        <button className={activeStates.justifyCenter ? "active" : ""} title="Align Center" onClick={() => runCommand(() => EditorCommands.setAlignment("center"))}><AlignCenter size={15} /></button>
        <button className={activeStates.justifyRight ? "active" : ""} title="Align Right" onClick={() => runCommand(() => EditorCommands.setAlignment("right"))}><AlignRight size={15} /></button>
        <button className={activeStates.justifyFull ? "active" : ""} title="Justify" onClick={() => runCommand(() => EditorCommands.setAlignment("justify"))}><AlignJustify size={15} /></button>
        <select aria-label="Line Spacing" onPointerDown={rememberSelection} onChange={(e) => runCommand(() => EditorCommands.setLineSpacing(e.target.value))} defaultValue="normal" style={{ width: '60px', marginLeft: '4px' }}>
          <option value="normal">1.0</option>
          <option value="1.15">1.15</option>
          <option value="1.5">1.5</option>
          <option value="2.0">2.0</option>
        </select>
      </div>

      {/* Lists & Indents */}
      <div className="ribbon-group">
        <button title="Decrease Indent" onClick={() => runCommand(() => EditorCommands.changeIndent("out"))}><IndentDecrease size={15} /></button>
        <button title="Increase Indent" onClick={() => runCommand(() => EditorCommands.changeIndent("in"))}><IndentIncrease size={15} /></button>
        <button className={activeStates.insertUnorderedList ? "active" : ""} title="Bullet List" onClick={() => runCommand(() => EditorCommands.toggleBulletList())}><List size={15} /></button>
        <button className={activeStates.insertOrderedList ? "active" : ""} title="Number List" onClick={() => runCommand(() => EditorCommands.toggleNumberList())}><ListOrdered size={15} /></button>
        <select aria-label="Legal numbering" value={legalNumbering} onPointerDown={rememberSelection} onChange={(e) => {
          const value = e.target.value as MultilevelListType;
          setLegalNumbering(value);
          runCommand(() => EditorCommands.applyMultilevelList(value));
          setLegalNumbering("");
        }} style={{ width: '88px', marginLeft: '4px' }}>
          <option value="" disabled>Legal Num...</option>
          <option value="1">1. 2. 3.</option>
          <option value="a">a. b. c.</option>
          <option value="A">A. B. C.</option>
          <option value="i">i. ii. iii.</option>
          <option value="I">I. II. III.</option>
        </select>
      </div>

      {/* Insert */}
      <div className="ribbon-group">
        <button title="Insert 3 × 3 table" onClick={() => runCommand(() => EditorCommands.insertTable(3, 3))}><FilePlus2 size={15} /></button>
        <button title="Insert Horizontal Line" onClick={() => runCommand(() => EditorCommands.insertHorizontalLine())}><Minus size={15} /></button>
        <button title="Insert Page Break" onClick={() => runCommand(() => EditorCommands.insertPageBreak())}>PB</button>
      </div>

    </section>
  );
}
