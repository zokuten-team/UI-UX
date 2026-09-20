/* ── Claude AI Client ─────────────────────────────────────────────
 *
 * Wrapper for the Anthropic Claude API.
 * Set ANTHROPIC_API_KEY in .env.local to enable.
 *
 * Usage:
 *   import { draftWithClaude, analyseWithClaude } from "@/lib/ai/claude";
 * ────────────────────────────────────────────────────────────────── */

export type DraftRequest = {
  instruction: string;
  /** HTML content of the current document for context */
  documentContext: string;
  /** Optional template name to use as a starting point */
  templateName?: string;
};

export type AnalyseRequest = {
  html: string;
  perspective: string;
  mode: "case_theory" | "weak_points" | "missing_evidence" | "relief_check" | "full_analysis";
};

export type AIResponse = {
  text: string;
  model?: string;
  usage?: { inputTokens: number; outputTokens: number };
};

/**
 * Call Claude for drafting via the server-side API route.
 * The API route reads ANTHROPIC_API_KEY from env.
 */
export async function draftWithClaude(request: DraftRequest): Promise<AIResponse> {
  const res = await fetch("/api/ai/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Draft AI request failed");
  }

  return res.json();
}

/**
 * Call Claude for analysis via the server-side API route.
 */
export async function analyseWithClaude(request: AnalyseRequest): Promise<AIResponse> {
  const res = await fetch("/api/ai/analyse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Analysis AI request failed");
  }

  return res.json();
}

/**
 * Check whether the Claude API key is configured.
 * Useful for showing a "configure key" prompt in the UI.
 */
export async function isClaudeConfigured(): Promise<boolean> {
  try {
    const res = await fetch("/api/ai/status");
    const data = await res.json();
    return data.configured === true;
  } catch {
    return false;
  }
}
