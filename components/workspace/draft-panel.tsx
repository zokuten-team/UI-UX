"use client";

import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";

/* ── Placeholder: replace with lib/ai/claude.ts call ─────────────── */
async function callDraftAI(prompt: string, _context: string): Promise<string> {
  // TODO: Wire to /api/ai/draft route → Claude API
  // When ANTHROPIC_API_KEY is set, this sends the prompt + document context to Claude
  return `This frontend is ready to send that request with the open page and selected case files to the Advo AI backend.`;
}

type Props = {
  onCreateDraft: (instruction: string) => void;
  /** HTML of the currently open page, sent as context to the AI */
  activePageHtml?: string;
};

export function DraftPanel({ onCreateDraft, activePageHtml = "" }: Props) {
  const [messages, setMessages] = useState<Array<{ role: "ai" | "user"; text: string }>>([
    { role: "ai", text: "I can help draft, compare clauses, create a chronology or explain the open document." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const draft = (instruction: string) => {
    onCreateDraft(instruction);
    setMessages((current) => [
      ...current,
      { role: "user", text: instruction },
      { role: "ai", text: "I opened a new editable document and started the draft there." },
    ]);
    setInput("");
  };

  const send = async () => {
    if (!input.trim()) return;
    const prompt = input.trim();
    if (/\bdraft\b/i.test(prompt)) {
      draft(prompt);
      return;
    }
    setMessages((current) => [...current, { role: "user", text: prompt }]);
    setInput("");
    setLoading(true);
    try {
      const response = await callDraftAI(prompt, activePageHtml);
      setMessages((current) => [...current, { role: "ai", text: response }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-section chat-tool">
      <div className="quick-grid">
        <button onClick={() => setInput("Summarise the open page")}>Summarise</button>
        <button onClick={() => setInput("Extract key clauses")}>Key clauses</button>
        <button onClick={() => setInput("Create action items")}>Action items</button>
        <button onClick={() => draft("Draft a response to the open document")}>Draft in new document</button>
      </div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={m.role}>{m.text}</div>
        ))}
        {loading && <div className="ai loading">Thinking…</div>}
      </div>
      <div className="chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Advo AI about this matter…"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
        />
        <button onClick={send} disabled={loading}><ChevronRight /></button>
      </div>
    </div>
  );
}
