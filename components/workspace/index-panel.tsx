"use client";

import { useState, useMemo, RefObject } from "react";
import {
  ChevronDown, ClipboardList, FileText, GripVertical, Pencil, Plus,
  Printer, Settings2, Trash2, X, FilePlus2, RefreshCw
} from "lucide-react";
import type { IndexColumn, WorkspaceDoc, LinkedTableConfig } from "./types";
import { DEFAULT_INDEX_COLUMNS } from "./types";
import { uid } from "./workspace-store";
import { EditorCommands } from "@/utils/editor-commands";

type IndexRow = {
  docId: string;
  docName: string;
  pageCount: number;
  startPage: number;
  endPage: number;
  date: string;
  party: string;
  docType: string;
  remarks: string;
  custom: Record<string, string>;
};

type Props = {
  docs: WorkspaceDoc[];
  onReorderDocs: (from: number, to: number) => void;
  activeDocId: string;
  activePageId: string;
  addLinkedTable: (config: LinkedTableConfig) => void;
  updateLinkedTables: () => void;
  editorRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  updatePage: (id: string, html: string) => void;
};

export function IndexPanel({ 
  docs, onReorderDocs, activeDocId, activePageId, 
  addLinkedTable, updateLinkedTables, editorRefs, updatePage 
}: Props) {
  const [columns, setColumns] = useState<IndexColumn[]>(DEFAULT_INDEX_COLUMNS);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [rowData, setRowData] = useState<Record<string, Partial<IndexRow>>>({});
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [customColumnName, setCustomColumnName] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [insertWizard, setInsertWizard] = useState<"index" | "annexure" | null>(null);
  const [isLinked, setIsLinked] = useState(true);
  const [annexureStyle, setAnnexureStyle] = useState("Annexure A");

  const rows: IndexRow[] = useMemo(() => {
    let pageCounter = 1;
    return docs.map((doc) => {
      const startPage = pageCounter;
      const endPage = pageCounter + doc.pages.length - 1;
      pageCounter = endPage + 1;
      const custom = rowData[doc.id] ?? {};
      return {
        docId: doc.id,
        docName: custom.docName ?? doc.name,
        pageCount: doc.pages.length,
        startPage,
        endPage,
        date: (custom.date as string) ?? "",
        party: (custom.party as string) ?? "",
        docType: (custom.docType as string) ?? "",
        remarks: (custom.remarks as string) ?? "",
        custom: (custom.custom as Record<string, string>) ?? {},
      };
    });
  }, [docs, rowData]);

  const totalPages = rows.reduce((sum, r) => sum + r.pageCount, 0);
  const visibleCols = columns.filter((c) => c.visible);

  const updateRowField = (docId: string, field: string, value: string) => {
    setRowData((prev) => ({ ...prev, [docId]: { ...prev[docId], [field]: value } }));
  };

  const toggleColumn = (colId: string) => {
    setColumns((prev) => prev.map((c) => c.id === colId ? { ...c, visible: !c.visible } : c));
  };

  const addCustomColumn = () => {
    if (!customColumnName.trim()) return;
    const id = customColumnName.toLowerCase().replace(/\s+/g, "_");
    setColumns((prev) => [...prev, { id, label: customColumnName.trim(), visible: true, custom: true }]);
    setCustomColumnName("");
  };

  const removeColumn = (colId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== colId));
  };

  const renameColumn = (colId: string, newLabel: string) => {
    setColumns((prev) => prev.map((c) => c.id === colId ? { ...c, label: newLabel } : c));
  };

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== idx) {
      onReorderDocs(dragIndex, idx);
      setDragIndex(idx);
    }
  };

  const cellValue = (row: IndexRow, col: IndexColumn) => {
    switch (col.id) {
      case "sl": return "";
      case "description": return row.docName;
      case "date": return row.date;
      case "party": return row.party;
      case "type": return row.docType;
      case "pages": return `${row.startPage}–${row.endPage}`;
      case "remarks": return row.remarks;
      default: return row.custom[col.id] ?? "";
    }
  };

  const fieldKey = (col: IndexColumn): string => {
    switch (col.id) {
      case "description": return "docName";
      case "date": return "date";
      case "party": return "party";
      case "type": return "docType";
      case "remarks": return "remarks";
      default: return col.id;
    }
  };

  const getAnnexurePrefix = (style: string, index: number) => {
    switch (style) {
      case "Annexure A": return `Annexure ${String.fromCharCode(65 + index)}`;
      case "Annexure A-1": return `Annexure A-${index + 1}`;
      case "Annexure P-1": return `Annexure P-${index + 1}`;
      case "Annexure R-1": return `Annexure R-${index + 1}`;
      case "Exhibit 1": return `Exhibit ${index + 1}`;
      default: return `Annexure ${index + 1}`;
    }
  };

  const insertTableIntoDocument = () => {
    const tableId = uid();
    const type = insertWizard!;
    
    // Generate HTML
    let thead = '<tr>';
    visibleCols.forEach(col => {
      thead += `<th style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">${col.label === 'Sl. No.' && type === 'annexure' ? 'Annexure No.' : col.label}</th>`;
    });
    thead += '</tr>';

    let tbody = '';
    rows.forEach((row, idx) => {
      tbody += `<tr data-doc-id="${row.docId}" style="page-break-inside: avoid; break-inside: avoid;">`;
      visibleCols.forEach(col => {
        let val = col.id === "sl" ? (idx + 1).toString() : cellValue(row, col);
        if (col.id === "sl" && type === "annexure") {
          val = getAnnexurePrefix(annexureStyle, idx);
        }
        tbody += `<td style="border: 1px solid #ccc; padding: 8px;" data-col-id="${col.id}">${val || '<br>'}</td>`;
      });
      tbody += '</tr>';
    });

    const caption = type === 'index' ? '<strong>INDEX</strong>' : `<strong>${annexureStyle.split(' ')[0]} LIST</strong>`;

    const html = `
      <p style="text-align: center;">${caption}</p>
      <table ${isLinked ? `data-linked-id="${tableId}"` : ''} style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; margin-bottom: 1em;">
        <thead style="display: table-header-group; background: #f8fafc;">${thead}</thead>
        <tbody>${tbody}</tbody>
      </table>
      <p><br></p>
    `;

    // Insert into editor
    const activeEditor = editorRefs.current.get(activePageId);
    if (activeEditor) {
      if (document.activeElement !== activeEditor) {
        activeEditor.focus();
      }
      EditorCommands.insertHTML(html);
      updatePage(activePageId, activeEditor.innerHTML);
    }

    // Save config if linked
    if (isLinked) {
      addLinkedTable({
        id: tableId,
        type,
        docId: activeDocId,
        pageId: activePageId,
        columns: visibleCols,
        numberingStyle: type === 'annexure' ? annexureStyle : undefined,
        includedDocIds: rows.map(r => r.docId)
      });
    }

    setInsertWizard(null);
  };

  return (
    <div className="tool-section index-full-panel">
      <div className="index-summary">
        <div><strong>{docs.length}</strong><span>documents</span></div>
        <div><strong>{totalPages}</strong><span>pages</span></div>
      </div>

      <div className="index-actions-bar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className="quiet-button" onClick={() => setShowColumnConfig((v) => !v)}>
          <Settings2 size={13} /> Columns <ChevronDown size={12} />
        </button>
        <button className="primary-button" onClick={() => setInsertWizard("index")}>
          <FilePlus2 size={13} /> Insert Index
        </button>
        <button className="quiet-button" onClick={() => setInsertWizard("annexure")}>
          <FilePlus2 size={13} /> Insert Annexure
        </button>
        <button className="quiet-button" onClick={updateLinkedTables}>
          <RefreshCw size={13} /> Update Tables
        </button>
      </div>

      {insertWizard && (
        <div className="index-column-config" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <h4>Insert {insertWizard === 'index' ? 'Index' : 'Annexure'} Table</h4>
          <p className="helper">Table will be inserted into the currently active document at your cursor position.</p>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', fontSize: '13px' }}>
            <input type="checkbox" checked={isLinked} onChange={(e) => setIsLinked(e.target.checked)} />
            <strong>Linked Table</strong> (Auto-updates when documents change)
          </label>

          {insertWizard === 'annexure' && (
            <div style={{ margin: '8px 0', fontSize: '13px' }}>
              <label>Numbering Style:</label>
              <select value={annexureStyle} onChange={(e) => setAnnexureStyle(e.target.value)} style={{ marginLeft: '8px', padding: '4px' }}>
                <option>Annexure A</option>
                <option>Annexure A-1</option>
                <option>Annexure P-1</option>
                <option>Annexure R-1</option>
                <option>Exhibit 1</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="primary-button" onClick={insertTableIntoDocument}>Confirm Insertion</button>
            <button className="quiet-button" onClick={() => setInsertWizard(null)}>Cancel</button>
          </div>
        </div>
      )}

      {showColumnConfig && (
        <div className="index-column-config">
          <p className="helper">Show, hide, rename or add custom columns.</p>
          {columns.map((col) => (
            <div key={col.id} className="col-config-row">
              <label>
                <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.id)} />
                <input
                  type="text"
                  value={col.label}
                  onChange={(e) => renameColumn(col.id, e.target.value)}
                  className="col-rename-input"
                />
              </label>
              {col.custom && <button onClick={() => removeColumn(col.id)} title="Remove"><Trash2 size={12} /></button>}
            </div>
          ))}
          <div className="col-config-add">
            <input
              type="text"
              value={customColumnName}
              onChange={(e) => setCustomColumnName(e.target.value)}
              placeholder="e.g. Exhibit No."
              onKeyDown={(e) => { if (e.key === "Enter") addCustomColumn(); }}
            />
            <button onClick={addCustomColumn}><Plus size={12} /> Add</button>
          </div>
        </div>
      )}

      <p className="helper">Drag rows to reorder. Page numbers update automatically. Click a cell to edit.</p>

      <div className="index-table">
        <table>
          <thead>
            <tr>
              <th style={{ width: 28 }} />
              {visibleCols.map((col) => (
                <th key={col.id}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.docId}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={() => setDragIndex(null)}
                className={editingRow === row.docId ? "editing" : ""}
              >
                <td className="drag-handle"><GripVertical size={12} /></td>
                {visibleCols.map((col) => (
                  <td key={col.id} onClick={() => setEditingRow(row.docId)}>
                    {col.id === "sl" ? idx + 1 : col.id === "pages" ? (
                      <span>{row.startPage}–{row.endPage} ({row.pageCount}p)</span>
                    ) : editingRow === row.docId ? (
                      <input
                        type="text"
                        value={cellValue(row, col)}
                        onChange={(e) => updateRowField(row.docId, fieldKey(col), e.target.value)}
                        onBlur={() => setEditingRow(null)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingRow(null); }}
                        autoFocus={visibleCols.indexOf(col) === 1}
                      />
                    ) : (
                      <span>{cellValue(row, col) || <em className="empty-cell">—</em>}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="panel-primary" onClick={() => window.print()}>
        <Printer size={14} /> Print index &amp; bundle
      </button>
    </div>
  );
}
