"use client";

import { useCallback, useEffect, useState, RefObject } from "react";
import { EditorCommands, MultilevelListType } from "@/utils/editor-commands";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold,
  Highlighter, IndentDecrease, IndentIncrease, Italic, 
  List, ListOrdered, Paintbrush, Scissors, Strikethrough, 
  Subscript, Superscript, Underline, Undo2, Redo2, Type, 
  Minus, FilePlus2, MoreHorizontal
} from "lucide-react";

type Props = {
  editorRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  activePageId: string;
  updatePage: (id: string, html: string) => void;
};

export function WordToolbar({ editorRefs, activePageId, updatePage }: Props) {
  const [formatPainterActive, setFormatPainterActive] = useState(false);
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});
  const [activeValues, setActiveValues] = useState<Record<string, string>>({});

  const updateActiveStates = useCallback(() => {
    const activeEditor = editorRefs.current.get(activePageId);
    if (!activeEditor || document.activeElement !== activeEditor) return;

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
      fontName: document.queryCommandValue("fontName")?.replace(/['"]/g, '') || "Georgia",
      fontSize: document.queryCommandValue("fontSize") || "3",
      formatBlock: document.queryCommandValue("formatBlock") || "p",
    });
  }, [editorRefs, activePageId]);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveStates);
    return () => document.removeEventListener("selectionchange", updateActiveStates);
  }, [updateActiveStates]);

  const runCommand = (action: () => void) => {
    const activeEditor = editorRefs.current.get(activePageId);
    if (activeEditor) {
      // Ensure focus before running command
      if (document.activeElement !== activeEditor) {
         activeEditor.focus();
      }
      action();
      updatePage(activePageId, activeEditor.innerHTML);
      updateActiveStates();
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
        // Prevent focus loss so the selection in the editor is maintained
        if ((e.target as HTMLElement).tagName !== "SELECT" && (e.target as HTMLElement).tagName !== "INPUT") {
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
        <select aria-label="Paragraph style" value={activeValues.formatBlock} onChange={(e) => command("formatBlock", e.target.value)}>
          <option value="p">Normal</option>
          <option value="h1">Title</option>
          <option value="h2">Heading 1</option>
          <option value="h3">Heading 2</option>
          <option value="h4">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        <select aria-label="Font Family" value={activeValues.fontName} onChange={(e) => command("fontName", e.target.value)}>
          <option>Georgia</option>
          <option>Arial</option>
          <option>Times New Roman</option>
          <option>Calibri</option>
          <option>Garamond</option>
        </select>
        <select aria-label="Font size" value={activeValues.fontSize} onChange={(e) => runCommand(() => EditorCommands.setFontSize(e.target.value))}>
          <option value="1">8</option>
          <option value="2">10</option>
          <option value="3">12</option>
          <option value="4">14</option>
          <option value="5">18</option>
          <option value="6">24</option>
          <option value="7">36</option>
          <option value="48px">48</option>
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
        <input 
          type="color" 
          title="Text Color" 
          onChange={(e) => runCommand(() => EditorCommands.setTextColor(e.target.value))} 
          defaultValue="#000000" 
        />
        <input 
          type="color" 
          title="Highlight Color" 
          onChange={(e) => runCommand(() => EditorCommands.setHighlight(e.target.value))} 
          defaultValue="#ffff00" 
        />
      </div>

      {/* Paragraph Alignment & Spacing */}
      <div className="ribbon-group">
        <button className={activeStates.justifyLeft ? "active" : ""} title="Align Left" onClick={() => command("justifyLeft")}><AlignLeft size={15} /></button>
        <button className={activeStates.justifyCenter ? "active" : ""} title="Align Center" onClick={() => command("justifyCenter")}><AlignCenter size={15} /></button>
        <button className={activeStates.justifyRight ? "active" : ""} title="Align Right" onClick={() => command("justifyRight")}><AlignRight size={15} /></button>
        <button className={activeStates.justifyFull ? "active" : ""} title="Justify" onClick={() => command("justifyFull")}><AlignJustify size={15} /></button>
        <select aria-label="Line Spacing" onChange={(e) => runCommand(() => EditorCommands.setLineSpacing(e.target.value))} defaultValue="normal" style={{ width: '60px', marginLeft: '4px' }}>
          <option value="normal">1.0</option>
          <option value="1.15">1.15</option>
          <option value="1.5">1.5</option>
          <option value="2.0">2.0</option>
        </select>
      </div>

      {/* Lists & Indents */}
      <div className="ribbon-group">
        <button title="Decrease Indent" onClick={() => command("outdent")}><IndentDecrease size={15} /></button>
        <button title="Increase Indent" onClick={() => command("indent")}><IndentIncrease size={15} /></button>
        <button className={activeStates.insertUnorderedList ? "active" : ""} title="Bullet List" onClick={() => runCommand(() => EditorCommands.toggleBulletList())}><List size={15} /></button>
        <button className={activeStates.insertOrderedList ? "active" : ""} title="Number List" onClick={() => runCommand(() => EditorCommands.toggleNumberList())}><ListOrdered size={15} /></button>
        <select aria-label="Multilevel List" onChange={(e) => runCommand(() => EditorCommands.applyMultilevelList(e.target.value as MultilevelListType))} defaultValue="" style={{ width: '80px', marginLeft: '4px' }}>
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
        <button title="Insert Table" onClick={() => {
          const r = parseInt(prompt("Number of rows?", "3") || "3", 10);
          const c = parseInt(prompt("Number of columns?", "3") || "3", 10);
          runCommand(() => EditorCommands.insertTable(r, c));
        }}><FilePlus2 size={15} /></button>
        <button title="Insert Horizontal Line" onClick={() => runCommand(() => EditorCommands.insertHorizontalLine())}><Minus size={15} /></button>
        <button title="Insert Page Break" onClick={() => runCommand(() => EditorCommands.insertPageBreak())}>PB</button>
      </div>

    </section>
  );
}
