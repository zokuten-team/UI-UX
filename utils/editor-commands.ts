export type MultilevelListType = "1" | "a" | "A" | "i" | "I";

type FormatClipboardWindow = Window & { __copiedFormat?: string };

const BLOCK_SELECTOR = "p, h1, h2, h3, h4, blockquote, li, td, th";

function selectedBlocks() {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return [] as HTMLElement[];
  const range = selection.getRangeAt(0);
  const anchor = selection.anchorNode instanceof Element
    ? selection.anchorNode
    : selection.anchorNode?.parentElement;
  const editor = anchor?.closest<HTMLElement>("[contenteditable='true']");
  if (!editor) return [] as HTMLElement[];

  const blocks = [...editor.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)]
    .filter((block) => {
      try { return range.intersectsNode(block); } catch { return false; }
    });
  if (blocks.length) return blocks;

  const closest = anchor?.closest<HTMLElement>(BLOCK_SELECTOR);
  return closest && editor.contains(closest) ? [closest] : [];
}

function insertAtSelection(html: string) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const template = document.createElement("template");
  template.innerHTML = html;
  const lastNode = template.content.lastChild;
  range.insertNode(template.content);
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

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
    selectedBlocks().forEach((block) => { block.style.lineHeight = spacing; });
  },

  setAlignment: (alignment: "left" | "center" | "right" | "justify") => {
    const blocks = selectedBlocks();
    if (blocks.length) blocks.forEach((block) => { block.style.textAlign = alignment; });
  },

  changeIndent: (direction: "in" | "out") => {
    const blocks = selectedBlocks();
    if (!blocks.length) {
      document.execCommand(direction === "in" ? "indent" : "outdent", false);
      return;
    }
    blocks.forEach((block) => {
      if (block instanceof HTMLLIElement) return;
      const current = Number.parseFloat(block.style.marginLeft || "0") || 0;
      const next = Math.max(0, current + (direction === "in" ? 24 : -24));
      block.style.marginLeft = next ? `${next}px` : "";
    });
    if (blocks.some((block) => block instanceof HTMLLIElement)) {
      document.execCommand(direction === "in" ? "indent" : "outdent", false);
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
    let header = '<tr>';
    for (let c = 0; c < cols; c++) {
      header += `<th>Header ${c + 1}</th>`;
    }
    header += '</tr>';

    let tbody = '';
    for (let r = 0; r < Math.max(1, rows - 1); r++) {
      tbody += '<tr>';
      for (let c = 0; c < cols; c++) {
        tbody += `<td><br></td>`;
      }
      tbody += '</tr>';
    }

    const tableHTML = `
      <table style="width:100%;border-collapse:collapse;margin:18px 0">
        <thead>${header}</thead>
        <tbody>${tbody}</tbody>
      </table>
      <p><br></p>
    `;
    insertAtSelection(tableHTML);
  },

  insertHTML: (html: string) => {
    insertAtSelection(html);
  },

  insertHorizontalLine: () => {
    insertAtSelection('<hr style="border:0;border-top:1px solid #94a3b8;margin:20px 0"><p><br></p>');
  },

  insertPageBreak: () => {
    insertAtSelection('<div class="page-break" contenteditable="false"><span>Page break</span></div><p><br></p>');
  },

  copyFormat: () => {
    // Basic format painter: just copy the inline style of the current selection node
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    let node = sel.anchorNode as Node | null;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentNode;
    
    if (node instanceof HTMLElement) {
      (window as FormatClipboardWindow).__copiedFormat = node.style.cssText;
    }
  },

  pasteFormat: () => {
    const cssText = (window as FormatClipboardWindow).__copiedFormat;
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
