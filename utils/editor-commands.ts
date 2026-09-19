export type MultilevelListType = "1" | "a" | "A" | "i" | "I";

export const EditorCommands = {
  command: (name: string, value?: string) => {
    document.execCommand(name, false, value);
  },

  setFontSize: (size: string) => {
    document.execCommand("fontSize", false, size);
  },

  setTextColor: (color: string) => {
    document.execCommand("foreColor", false, color);
  },

  setHighlight: (color: string) => {
    if (document.queryCommandSupported('hiliteColor')) {
      document.execCommand("hiliteColor", false, color);
    } else {
      document.execCommand("backColor", false, color);
    }
  },

  setLineSpacing: (spacing: string) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    let node = sel.anchorNode as Node | null;
    while (node && node.nodeName !== 'P' && node.nodeName !== 'DIV') {
      node = node.parentNode;
    }
    if (node && node instanceof HTMLElement) {
      node.style.lineHeight = spacing;
    }
  },

  toggleBulletList: () => {
    document.execCommand("insertUnorderedList", false);
  },

  toggleNumberList: () => {
    document.execCommand("insertOrderedList", false);
  },

  applyMultilevelList: (type: MultilevelListType) => {
    document.execCommand("insertOrderedList", false);
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    
    // Find the closest <ol> that was just inserted and set its type
    let node = sel.anchorNode as Node | null;
    while (node && node.nodeName !== 'OL') {
      node = node.parentNode;
    }
    if (node && node instanceof HTMLOListElement) {
      node.type = type;
    }
  },

  insertTable: (rows = 3, cols = 3) => {
    let tbody = '';
    
    // Header row
    tbody += '<tr>';
    for (let c = 0; c < cols; c++) {
      tbody += `<th style="border: 1px solid #ccc; padding: 8px;">Header ${c + 1}</th>`;
    }
    tbody += '</tr>';

    // Body rows
    for (let r = 1; r < rows; r++) {
      tbody += '<tr>';
      for (let c = 0; c < cols; c++) {
        tbody += `<td style="border: 1px solid #ccc; padding: 8px;"><br></td>`;
      }
      tbody += '</tr>';
    }

    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; margin-bottom: 1em;">
        <thead style="display: table-header-group;"></thead>
        <tbody>
          ${tbody}
        </tbody>
      </table>
      <p><br></p>
    `;
    document.execCommand("insertHTML", false, tableHTML);
  },

  insertHTML: (html: string) => {
    document.execCommand("insertHTML", false, html);
  },

  insertHorizontalLine: () => {
    document.execCommand("insertHorizontalRule", false);
  },

  insertPageBreak: () => {
    document.execCommand("insertHTML", false, '<div style="page-break-after: always;"><hr style="border: 1px dashed #ccc; margin: 20px 0;" /></div><p><br></p>');
  },

  copyFormat: () => {
    // Basic format painter: just copy the inline style of the current selection node
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    let node = sel.anchorNode as Node | null;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode;
    
    if (node instanceof HTMLElement) {
      (window as any).__copiedFormat = node.style.cssText;
    }
  },

  pasteFormat: () => {
    const cssText = (window as any).__copiedFormat;
    if (!cssText) return;
    
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    
    const span = document.createElement('span');
    span.style.cssText = cssText;
    
    const range = sel.getRangeAt(0);
    const content = range.extractContents();
    span.appendChild(content);
    range.insertNode(span);
  }
};
