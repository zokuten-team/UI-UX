"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";

const SUPPORTED_LANGUAGES = [
  "Kannada", "Hindi", "Tamil", "Telugu", "Malayalam",
  "Marathi", "Bengali", "Gujarati", "Punjabi", "Urdu", "English",
];

const TERMINOLOGY_OPTIONS = [
  "Preserve English legal terms",
  "Translate where equivalent exists",
  "Plain-language translation",
];

/* ── Placeholder: replace with lib/translation/sarvam.ts call ────── */
async function translateText(
  _text: string,
  _targetLang: string,
  _options: { preserveLegalTerms: boolean },
): Promise<string> {
  // TODO: Wire to /api/translate route → Sarvam API
  // When SARVAM_API_KEY is set, this sends the text to Sarvam for translation
  return "";
}

type Props = {
  /** HTML content of the active page to translate */
  activePageHtml?: string;
  /** Callback to create a new document with translated content */
  onCreateTranslatedDoc?: (title: string, html: string) => void;
};

export function TranslationPanel({ activePageHtml = "", onCreateTranslatedDoc }: Props) {
  const [language, setLanguage] = useState("Kannada");
  const [terminology, setTerminology] = useState(TERMINOLOGY_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const runTranslation = async () => {
    if (!activePageHtml.trim()) {
      setError("No content on the active page to translate.");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const translated = await translateText(
        activePageHtml,
        language,
        { preserveLegalTerms: terminology === TERMINOLOGY_OPTIONS[0] },
      );
      if (translated) {
        setResult(translated);
      } else {
        // Sarvam API not yet configured — show placeholder
        setResult(`${language} translation queued. The translated page will appear beside the original when the Sarvam API key is configured.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-section">
      <p className="helper">Translate the open page while preserving headings, tables and paragraph structure.</p>
      <label>Target language
        <select value={language} onChange={(e) => { setLanguage(e.target.value); setResult(""); }}>
          {SUPPORTED_LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
      </label>
      <label>Legal terminology
        <select value={terminology} onChange={(e) => setTerminology(e.target.value)}>
          {TERMINOLOGY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <button className="panel-primary" onClick={runTranslation} disabled={loading}>
        {loading ? <><Loader2 className="spin" /> Translating…</> : <><Languages /> Translate open page</>}
      </button>
      {error && <div className="panel-error"><span>{error}</span></div>}
      {result && (
        <div className="ai-output">
          <strong>{language} translation {result.includes("queued") ? "queued" : "complete"}</strong>
          <p>{result}</p>
          {onCreateTranslatedDoc && !result.includes("queued") && (
            <button
              className="panel-secondary"
              onClick={() => onCreateTranslatedDoc(`Translated — ${language}`, result)}
            >
              Open as new document
            </button>
          )}
        </div>
      )}
    </div>
  );
}
