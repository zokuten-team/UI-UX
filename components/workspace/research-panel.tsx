"use client";

import { useState } from "react";
import { Search } from "lucide-react";

/* ── Court list (expandable via OpenIndiaLaw adapter) ─────────────── */
export const courts = [
  "All Courts",
  "Supreme Court of India",
  "Allahabad High Court",
  "Andhra Pradesh High Court",
  "Bombay High Court",
  "Calcutta High Court",
  "Chhattisgarh High Court",
  "Delhi High Court",
  "Gauhati High Court",
  "Gujarat High Court",
  "Himachal Pradesh High Court",
  "Jharkhand High Court",
  "Karnataka High Court",
  "Kerala High Court",
  "Madhya Pradesh High Court",
  "Madras High Court",
  "Manipur High Court",
  "Meghalaya High Court",
  "Orissa High Court",
  "Patna High Court",
  "Punjab and Haryana High Court",
  "Rajasthan High Court",
  "Sikkim High Court",
  "Telangana High Court",
  "Tripura High Court",
  "Uttarakhand High Court",
];

/* ── Placeholder: replace with lib/research/open-india-law.ts call ── */
async function searchCaseLaw(_filters: {
  scope: string;
  court: string;
  term: string;
  fromDate?: string;
  toDate?: string;
  actTitle?: string;
  section?: string;
  party1?: string;
  party2?: string;
  judge?: string;
}) {
  // TODO: Wire to /api/research route → OpenIndiaLaw adapter
  return [
    {
      title: "Maneka Gandhi v. Union of India",
      meta: "Supreme Court of India · (1978) 1 SCC 248",
      note: "Fair procedure and natural justice form part of non-arbitrariness under Article 14.",
    },
    {
      title: "Canara Bank v. Debasis Das",
      meta: "Supreme Court of India · (2003) 4 SCC 557",
      note: "Explains the core rules of natural justice and the requirement of a fair hearing.",
    },
    {
      title: "Dharampal Satyapal Ltd. v. Dy. Commissioner",
      meta: "Supreme Court of India · (2015) 8 SCC 519",
      note: "Considers prejudice and the consequences of breach of natural justice.",
    },
  ];
}

export function ResearchPanel() {
  const [scope, setScope] = useState<"Judgements" | "Bare Acts" | "Tribunals">("Judgements");
  const [court, setCourt] = useState("Supreme Court of India");
  const [term, setTerm] = useState("principles of natural justice administrative order");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [actTitle, setActTitle] = useState("");
  const [section, setSection] = useState("");
  const [party1, setParty1] = useState("");
  const [party2, setParty2] = useState("");
  const [judge, setJudge] = useState("");
  const [searched, setSearched] = useState(true);
  const [results, setResults] = useState<Array<{ title: string; meta: string; note: string }>>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    setLoading(true);
    try {
      const hits = await searchCaseLaw({ scope, court, term, fromDate, toDate, actTitle, section, party1, party2, judge });
      setResults(hits);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-section research-panel">
      <div className="segmented">
        <button className={scope === "Judgements" ? "active" : ""} onClick={() => setScope("Judgements")}>Judgements</button>
        <button className={scope === "Bare Acts" ? "active" : ""} onClick={() => setScope("Bare Acts")}>Bare Acts</button>
        <button className={scope === "Tribunals" ? "active" : ""} onClick={() => setScope("Tribunals")}>Tribunals</button>
      </div>
      <div className="filter-grid">
        <label>Court<select value={court} onChange={(e) => setCourt(e.target.value)}>{courts.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Search preference<select><option>Exact phrase + semantic</option><option>Most cited</option><option>Latest first</option></select></label>
        <label className="span-two">Search term<textarea value={term} onChange={(e) => setTerm(e.target.value)} /></label>
        <label>From<input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label>
        <label>To<input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></label>
        <label>Act title<input placeholder="e.g. Constitution of India" value={actTitle} onChange={(e) => setActTitle(e.target.value)} /></label>
        <label>Section<input placeholder="Article / section" value={section} onChange={(e) => setSection(e.target.value)} /></label>
        <label>Party 1<input placeholder="Party name" value={party1} onChange={(e) => setParty1(e.target.value)} /></label>
        <label>Party 2<input placeholder="Opposite party" value={party2} onChange={(e) => setParty2(e.target.value)} /></label>
        <label className="span-two">Judge / advocate<input placeholder="Names, separated by commas" value={judge} onChange={(e) => setJudge(e.target.value)} /></label>
      </div>
      <button className="panel-primary" onClick={runSearch} disabled={loading}>
        <Search /> {loading ? "Searching…" : "Search with AI"}
      </button>
      {searched && results.length > 0 && (
        <div className="research-results">
          <div className="result-summary">
            <strong>{results.length} relevant authorities</strong>
            <span>AI-ranked preview</span>
          </div>
          {results.map((r, i) => (
            <article key={r.title}>
              <div className="result-rank">{i + 1}</div>
              <div>
                <h3>{r.title}</h3>
                <span>{r.meta}</span>
                <p>{r.note}</p>
                <div>
                  <button>Open</button>
                  <button>Add citation</button>
                  <button>Ask AI</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
