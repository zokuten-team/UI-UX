/* ── Sarvam AI Translation Client ─────────────────────────────────
 *
 * Wrapper for the Sarvam AI translation API.
 * Set SARVAM_API_KEY in .env.local to enable.
 *
 * Sarvam supports Indic language translation with legal terminology
 * preservation. Supported languages: Kannada, Hindi, Tamil, Telugu,
 * Malayalam, Marathi, Bengali, Gujarati, Punjabi, Urdu, English.
 *
 * Usage:
 *   import { translateWithSarvam } from "@/lib/translation/sarvam";
 * ────────────────────────────────────────────────────────────────── */

export type TranslateRequest = {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  preserveLegalTerms?: boolean;
};

export type TranslateResponse = {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
};

/** Language codes used by the Sarvam API */
export const SARVAM_LANGUAGE_CODES: Record<string, string> = {
  "English": "en",
  "Hindi": "hi",
  "Kannada": "kn",
  "Tamil": "ta",
  "Telugu": "te",
  "Malayalam": "ml",
  "Marathi": "mr",
  "Bengali": "bn",
  "Gujarati": "gu",
  "Punjabi": "pa",
  "Urdu": "ur",
};

/**
 * Translate text via the server-side API route.
 * The API route reads SARVAM_API_KEY from env.
 */
export async function translateWithSarvam(request: TranslateRequest): Promise<TranslateResponse> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Translation request failed");
  }

  return res.json();
}

/**
 * Check whether the Sarvam API key is configured.
 */
export async function isSarvamConfigured(): Promise<boolean> {
  try {
    const res = await fetch("/api/translate/status");
    const data = await res.json();
    return data.configured === true;
  } catch {
    return false;
  }
}
