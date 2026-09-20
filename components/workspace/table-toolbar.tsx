"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignCenter, Columns2, Grid3X3, Merge,
  Plus, RowsIcon, Split, Trash2, PaintBucket, Frame, BookOpen, Repeat
} from "lucide-react";

type Props = {
  editorRef: React.RefObject<HTMLElement | null>;
  onContentChange: () => void;
};

function getActiveCell(editor: HTMLElement | null): HTMLTableCellElement | null {
  const sel = window.getSelection();
  if (!sel?.anchorNode || !editor?.contains(sel.anchorNode)) return null;
  let node: Node | null = sel.anchorNode;
  while (node && node !== editor) {
    if (node instanceof HTMLTableCellElement) return node;
    node = node.parentNode;
  }
  return null;
}

function getActiveTable(cell: HTMLTableCellElement): HTMLTableElement | null {
  let node: HTMLElement | null = cell;
  while (node) {
    if (node instanceof HTMLTableElement) return node;
    node = node.parentElement;
  }
  return null;
}

function getCellIndex(cell: HTMLTableCellElement) {
  const row = cell.parentElement as HTMLTableRowElement | null;
  if (!row) return { rowIdx: -1, colIdx: -1 };
  return { rowIdx: row.rowIndex, colIdx: cell.cellIndex };
}

type CellLocation = { tableIndex: number; rowIndex: number; cellIndex: number };

function resolveActiveCell(
  editor: HTMLElement | null,
  current: HTMLTableCellElement | null,
  location: CellLocation | null,
) {
  if (current?.isConnected) return current;
  if (!editor || !location) return null;
  const table = editor.querySelectorAll("table")[location.tableIndex];
  return table?.rows[location.rowIndex]?.cells[location.cellIndex] ?? null;
}

export function TableToolbar({ editorRef, onContentChange }: Props) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const activeCellRef = useRef<HTMLTableCellElement | null>(null);
  const activeCellLocation = useRef<CellLocation | null>(null);
  const toolbarInteraction = useRef(false);

  const checkSelection = useCallback(() => {
    if (toolbarInteraction.current || toolbarRef.current?.contains(document.activeElement)) return;
    const cell = getActiveCell(editorRef.current);
    if (cell) {
      const rect = cell.getBoundingClientRect();
      const editorRect = editorRef.current!.getBoundingClientRect();
      setPosition({ top: rect.top - editorRect.top - 44, left: rect.left - editorRect.left });
      activeCellRef.current = cell;
      const table = getActiveTable(cell);
      activeCellLocation.current = table ? {
        tableIndex: [...editorRef.current!.querySelectorAll("table")].indexOf(table),
        rowIndex: cell.parentElement instanceof HTMLTableRowElement ? cell.parentElement.rowIndex : 0,
        cellIndex: cell.cellIndex,
      } : null;
    } else {
      setPosition(null);
      activeCellRef.current = null;
      activeCellLocation.current = null;
    }
  }, [editorRef]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.addEventListener("click", checkSelection);
    editor.addEventListener("keyup", checkSelection);
    document.addEventListener("selectionchange", checkSelection);
    return () => {
      editor.removeEventListener("click", checkSelection);
      editor.removeEventListener("keyup", checkSelection);
      document.removeEventListener("selectionchange", checkSelection);
    };
  }, [editorRef, checkSelection]);

  const insertRow = useCallback((above: boolean) => {
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!activeCell) return;
    const table = getActiveTable(activeCell);
    if (!table) return;
    const { rowIdx } = getCellIndex(activeCell);
    const row = table.rows[rowIdx];
    const newRow = table.insertRow(above ? rowIdx : rowIdx + 1);
    for (let i = 0; i < row.cells.length; i++) {
      const td = newRow.insertCell();
      td.innerHTML = "<br>";
      td.style.padding = "8px";
    }
    onContentChange();
  }, [editorRef, onContentChange]);

  const deleteRow = useCallback(() => {
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!activeCell) return;
    const table = getActiveTable(activeCell);
    if (!table) return;
    if (table.rows.length <= 1) return;
    const { rowIdx } = getCellIndex(activeCell);
    table.deleteRow(rowIdx);
    activeCellRef.current = null;
    setPosition(null);
    onContentChange();
  }, [editorRef, onContentChange]);

  const insertCol = useCallback((left: boolean) => {
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!activeCell) return;
    const table = getActiveTable(activeCell);
    if (!table) return;
    const { colIdx } = getCellIndex(activeCell);
    const insertIdx = left ? colIdx : colIdx + 1;
    for (let r = 0; r < table.rows.length; r++) {
      const cell = table.rows[r].insertCell(insertIdx);
      cell.innerHTML = "<br>";
      cell.style.padding = "8px";
      if (table.rows[r].cells[0]?.tagName === "TH" && r === 0) {
        const th = document.createElement("th");
        th.innerHTML = "Heading";
        th.style.padding = "8px";
        cell.replaceWith(th);
      }
    }
    onContentChange();
  }, [editorRef, onContentChange]);

  const deleteCol = useCallback(() => {
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!activeCell) return;
    const table = getActiveTable(activeCell);
    if (!table) return;
    const { colIdx } = getCellIndex(activeCell);
    if (table.rows[0]?.cells.length <= 1) return;
    for (let r = 0; r < table.rows.length; r++) {
      table.rows[r].deleteCell(colIdx);
    }
    activeCellRef.current = null;
    setPosition(null);
    onContentChange();
  }, [editorRef, onContentChange]);

  const deleteTable = useCallback(() => {
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!activeCell) return;
    const table = getActiveTable(activeCell);
    if (!table) return;
    table.remove();
    activeCellRef.current = null;
    setPosition(null);
    onContentChange();
  }, [editorRef, onContentChange]);

  const mergeCells = useCallback(() => {
    const sel = window.getSelection();
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!sel || !activeCell) return;
    const table = getActiveTable(activeCell);
    if (!table) return;
    const { rowIdx, colIdx } = getCellIndex(activeCell);
    const row = table.rows[rowIdx];
    if (colIdx + 1 < row.cells.length) {
      const nextCell = row.cells[colIdx + 1];
      const currentSpan = activeCell.colSpan || 1;
      activeCell.colSpan = currentSpan + (nextCell.colSpan || 1);
      activeCell.innerHTML += " " + nextCell.innerHTML;
      nextCell.remove();
      onContentChange();
    }
  }, [editorRef, onContentChange]);

  const splitCell = useCallback(() => {
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!activeCell || !activeCell.colSpan || activeCell.colSpan <= 1) return;
    const table = getActiveTable(activeCell);
    if (!table) return;
    const { rowIdx, colIdx } = getCellIndex(activeCell);
    const span = activeCell.colSpan;
    activeCell.colSpan = 1;
    const row = table.rows[rowIdx];
    for (let i = 1; i < span; i++) {
      const newCell = row.insertCell(colIdx + i);
      newCell.innerHTML = "<br>";
      newCell.style.padding = "8px";
    }
    onContentChange();
  }, [editorRef, onContentChange]);

  const distributeRowsEvenly = useCallback(() => {
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!activeCell) return;
    const table = getActiveTable(activeCell);
    if (!table) return;
    const rows = table.rows;
    const height = Math.max(...[...rows].map((row) => row.getBoundingClientRect().height));
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < rows[i].cells.length; j++) {
        rows[i].cells[j].style.height = `${Math.max(32, height)}px`;
      }
    }
    onContentChange();
  }, [editorRef, onContentChange]);

  const distributeColsEvenly = useCallback(() => {
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!activeCell) return;
    const table = getActiveTable(activeCell);
    if (!table) return;
    const cols = table.rows[0].cells;
    for (let i = 0; i < table.rows.length; i++) {
      for (let j = 0; j < table.rows[i].cells.length; j++) {
        table.rows[i].cells[j].style.width = `${100 / cols.length}%`;
      }
    }
    onContentChange();
  }, [editorRef, onContentChange]);

  const setCellColor = useCallback((color: string) => {
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!activeCell) return;
    activeCell.style.backgroundColor = color;
    onContentChange();
  }, [editorRef, onContentChange]);

  const setTableBorderColor = useCallback((color: string) => {
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!activeCell) return;
    const table = getActiveTable(activeCell);
    if (!table) return;
    table.style.borderColor = color;
    for (let i = 0; i < table.rows.length; i++) {
      for (let j = 0; j < table.rows[i].cells.length; j++) {
        table.rows[i].cells[j].style.borderColor = color;
      }
    }
    onContentChange();
  }, [editorRef, onContentChange]);

  const togglePreventRowSplit = useCallback(() => {
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!activeCell) return;
    const table = getActiveTable(activeCell);
    if (!table) return;
    for (let i = 0; i < table.rows.length; i++) {
      // Toggle page-break-inside: avoid
      const current = table.rows[i].style.pageBreakInside;
      table.rows[i].style.pageBreakInside = current === "avoid" ? "auto" : "avoid";
      table.rows[i].style.breakInside = current === "avoid" ? "auto" : "avoid";
    }
    onContentChange();
  }, [editorRef, onContentChange]);

  const toggleRepeatHeader = useCallback(() => {
    const activeCell = resolveActiveCell(editorRef.current, activeCellRef.current, activeCellLocation.current);
    activeCellRef.current = activeCell;
    if (!activeCell) return;
    const table = getActiveTable(activeCell);
    if (!table) return;
    const thead = table.querySelector("thead");
    if (thead) {
      // Toggle display: table-header-group
      const current = thead.style.display;
      thead.style.display = current === "table-header-group" ? "none" : "table-header-group";
    } else if (table.rows.length > 0) {
      // Wrap first row in thead if it doesn't exist
      const newThead = document.createElement("thead");
      newThead.style.display = "table-header-group";
      newThead.appendChild(table.rows[0]);
      table.insertBefore(newThead, table.firstChild);
    }
    onContentChange();
  }, [editorRef, onContentChange]);

  if (!position) return null;

  return (
    <div
      ref={toolbarRef}
      className="table-toolbar"
      style={{ top: `${Math.max(0, position.top)}px`, left: `${position.left}px`, display: 'flex', gap: '4px', background: '#fff', border: '1px solid #ccc', padding: '4px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flexWrap: 'wrap', maxWidth: '400px', position: 'absolute', zIndex: 100 }}
      onMouseDown={(e) => {
        toolbarInteraction.current = true;
        e.stopPropagation();
        if ((e.target as HTMLElement).tagName !== "INPUT") e.preventDefault();
      }}
      onMouseUp={() => { toolbarInteraction.current = false; }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) toolbarInteraction.current = false;
      }}
    >
      <button title="Insert row above" onClick={() => insertRow(true)}><Plus size={12} /><RowsIcon size={12} />↑</button>
      <button title="Insert row below" onClick={() => insertRow(false)}><Plus size={12} /><RowsIcon size={12} />↓</button>
      <button title="Delete row" onClick={deleteRow}><Trash2 size={12} /><RowsIcon size={12} /></button>
      <button title="Delete table" onClick={deleteTable}><Trash2 size={12} /><Grid3X3 size={12} /></button>
      <span className="table-toolbar-sep" style={{ borderRight: '1px solid #ccc', margin: '0 4px' }} />
      <button title="Insert column left" onClick={() => insertCol(true)}><Plus size={12} /><Columns2 size={12} />←</button>
      <button title="Insert column right" onClick={() => insertCol(false)}><Plus size={12} /><Columns2 size={12} />→</button>
      <button title="Delete column" onClick={deleteCol}><Trash2 size={12} /><Columns2 size={12} /></button>
      <span className="table-toolbar-sep" style={{ borderRight: '1px solid #ccc', margin: '0 4px' }} />
      <button title="Merge cells" onClick={mergeCells}><Merge size={12} /></button>
      <button title="Split cell" onClick={splitCell}><Split size={12} /></button>
      <span className="table-toolbar-sep" style={{ borderRight: '1px solid #ccc', margin: '0 4px' }} />
      <button title="Distribute rows" onClick={distributeRowsEvenly}><AlignCenter size={12} />↕</button>
      <button title="Distribute columns" onClick={distributeColsEvenly}><AlignCenter size={12} />↔</button>
      <span className="table-toolbar-sep" style={{ borderRight: '1px solid #ccc', margin: '0 4px' }} />
      <button title="Prevent row splitting" onClick={togglePreventRowSplit}><BookOpen size={12} /></button>
      <button title="Repeat header row" onClick={toggleRepeatHeader}><Repeat size={12} /></button>
      <span className="table-toolbar-sep" style={{ borderRight: '1px solid #ccc', margin: '0 4px' }} />
      <label title="Cell Color" style={{ display: 'flex', alignItems: 'center' }}><PaintBucket size={12} /><input type="color" onChange={(e) => setCellColor(e.target.value)} style={{ width: '16px', height: '16px', padding: 0, border: 0 }} /></label>
      <label title="Border Color" style={{ display: 'flex', alignItems: 'center' }}><Frame size={12} /><input type="color" onChange={(e) => setTableBorderColor(e.target.value)} style={{ width: '16px', height: '16px', padding: 0, border: 0 }} /></label>
    </div>
  );
}
