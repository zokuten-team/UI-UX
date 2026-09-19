"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onClose: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
};

/** Floating search bar for in-document search (Ctrl/Cmd+F). */
export function DocumentSearch({ onClose, containerRef }: Props) {
  const [term, setTerm] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [current, setCurrent] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const clearHighlights = useCallback(() => {
    if (!containerRef.current) return;
    const marks = containerRef.current.querySelectorAll("mark.search-highlight");
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent ?? ""), mark);
        parent.normalize();
      }
    });
    setMatchCount(0);
    setCurrent(0);
  }, [containerRef]);

  const highlightMatches = useCallback((query: string) => {
    clearHighlights();
    if (!query.trim() || !containerRef.current) return;
    const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) textNodes.push(node as Text);

    const lowerQuery = query.toLowerCase();
    let count = 0;

    for (const textNode of textNodes) {
      const text = textNode.textContent ?? "";
      const lowerText = text.toLowerCase();
      let startIndex = 0;
      let idx: number;
      const fragments: (string | HTMLElement)[] = [];
      let lastEnd = 0;

      while ((idx = lowerText.indexOf(lowerQuery, startIndex)) !== -1) {
        if (idx > lastEnd) fragments.push(text.slice(lastEnd, idx));
        const mark = document.createElement("mark");
        mark.className = `search-highlight${count === 0 ? " active" : ""}`;
        mark.textContent = text.slice(idx, idx + query.length);
        fragments.push(mark);
        lastEnd = idx + query.length;
        startIndex = lastEnd;
        count++;
      }

      if (fragments.length > 0) {
        if (lastEnd < text.length) fragments.push(text.slice(lastEnd));
        const parent = textNode.parentNode;
        if (parent) {
          const span = document.createElement("span");
          for (const frag of fragments) {
            if (typeof frag === "string") span.appendChild(document.createTextNode(frag));
            else span.appendChild(frag);
          }
          parent.replaceChild(span, textNode);
        }
      }
    }

    setMatchCount(count);
    setCurrent(count > 0 ? 1 : 0);

    // scroll to first match
    const first = containerRef.current.querySelector("mark.search-highlight.active");
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [containerRef, clearHighlights]);

  const navigateMatch = useCallback((direction: 1 | -1) => {
    if (!containerRef.current || matchCount === 0) return;
    const marks = containerRef.current.querySelectorAll("mark.search-highlight");
    marks.forEach((m) => m.classList.remove("active"));
    const next = ((current - 1 + direction + matchCount) % matchCount);
    setCurrent(next + 1);
    marks[next]?.classList.add("active");
    marks[next]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [containerRef, matchCount, current]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) navigateMatch(-1);
      else navigateMatch(1);
    }
    if (e.key === "Escape") {
      clearHighlights();
      onClose();
    }
  };

  return (
    <div className="document-search-bar">
      <input
        ref={inputRef}
        type="text"
        value={term}
        onChange={(e) => { setTerm(e.target.value); highlightMatches(e.target.value); }}
        onKeyDown={handleKeyDown}
        placeholder="Search in document…"
      />
      <span className="search-count">{matchCount > 0 ? `${current}/${matchCount}` : "No results"}</span>
      <button onClick={() => navigateMatch(-1)} disabled={matchCount === 0} title="Previous (Shift+Enter)">↑</button>
      <button onClick={() => navigateMatch(1)} disabled={matchCount === 0} title="Next (Enter)">↓</button>
      <button onClick={() => { clearHighlights(); onClose(); }} title="Close (Esc)">✕</button>
    </div>
  );
}
