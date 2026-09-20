"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { analyseWithClaude, type AnalyseRequest } from "@/lib/ai/claude";

type Props = {
  html: string;
};

export function AnalysePanel({ html }: Props) {
  const [perspective, setPerspective] = useState("Petitioner");
  const [analysis, setAnalysis] = useState("");
  const [loadingMode, setLoadingMode] = useState<string | null>(null);

  const runAnalysis = async (mode: AnalyseRequest["mode"]) => {
    if (!html.trim()) {
      setAnalysis("No document open to analyse.");
      return;
    }

    setLoadingMode(mode);
    try {
      const response = await analyseWithClaude({ html, perspective, mode });
      setAnalysis(response.text);
    } catch (err) {
      // Fallback to placeholder if API fails or is unconfigured
      const textLength = html.replace(/<[^>]+>/g, " ").trim().length;
      setAnalysis(`[API Note: ${err instanceof Error ? err.message : "Analysis failed"}]\n\nFrom the ${perspective.toLowerCase()} perspective, the open page contains ${textLength} characters. Priority review: establish jurisdiction, identify each material fact and supporting annexure, test limitation, and connect every prayer to a pleaded ground. This preview is ready for a document-analysis backend.`);
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <div className="tool-section">
      <p className="helper">Choose whose case the review should strengthen or challenge.</p>
      <label>Perspective
        <select value={perspective} onChange={(e) => setPerspective(e.target.value)}>
          {["Complainant", "Plaintiff", "Petitioner", "Defendant", "Respondent", "Accused", "Appellant", "Prosecution", "Neutral reviewer", "Judge / tribunal"].map((v) => <option key={v}>{v}</option>)}
        </select>
      </label>
      <div className="quick-grid">
        <button onClick={() => runAnalysis("case_theory")} disabled={loadingMode !== null}>Case theory</button>
        <button onClick={() => runAnalysis("weak_points")} disabled={loadingMode !== null}>Weak points</button>
        <button onClick={() => runAnalysis("missing_evidence")} disabled={loadingMode !== null}>Missing evidence</button>
        <button onClick={() => runAnalysis("relief_check")} disabled={loadingMode !== null}>Relief check</button>
      </div>
      <button className="panel-primary" onClick={() => runAnalysis("full_analysis")} disabled={loadingMode !== null}>
        {loadingMode === "full_analysis" ? <><Loader2 className="spin" /> Analysing…</> : <><Sparkles /> Analyse open page</>}
      </button>
      
      {loadingMode && loadingMode !== "full_analysis" && (
        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", color: "#64748b" }}>
          <Loader2 className="spin" size={16} /> Generating {loadingMode.replace("_", " ")}...
        </div>
      )}
      
      {analysis && !loadingMode && (
        <div className="ai-output">
          <strong>{perspective} review</strong>
          <p style={{ whiteSpace: "pre-wrap" }}>{analysis}</p>
        </div>
      )}
    </div>
  );
}
