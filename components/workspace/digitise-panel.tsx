"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ScanLine } from "lucide-react";
import type { Page, WorkspaceDoc } from "./types";
import { renderPdfPageToDataUrl } from "@/utils/pdf";

type Props = {
  activeDoc: WorkspaceDoc | undefined;
  activePage: Page | undefined;
  updatePage: (id: string, html: string) => void;
  onChooseFile: () => void;
  onOpenVerification: (text: string) => void;
  onApprove: () => void;
  canApprove: boolean;
};

type Status = "idle" | "preparing" | "ocr" | "ready" | "error";

const textToHtml = (text: string) => text
  .split(/\n{2,}/)
  .map((paragraph) => `<p>${paragraph
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\n", "<br>")}</p>`)
  .join("");

export function DigitisePanel({ activeDoc, activePage, updatePage, onChooseFile, onOpenVerification, onApprove, canApprove }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const imageSource = useMemo(
    () => activePage?.html.match(/src=["']([^"']+)["']/)?.[1] ?? "",
    [activePage?.html],
  );
  const canDigitise = Boolean(activeDoc?.kind === "pdf" || imageSource);
  const embeddedText = activePage?.extractedText?.trim() ?? "";

  const runDigitisation = async () => {
    if (!activeDoc || !activePage || !canDigitise) return;
    setError("");
    setProgress(0);

    try {
      if (embeddedText) {
        updatePage(activePage.id, textToHtml(embeddedText));
        setStatus("ready");
        onOpenVerification(embeddedText);
        return;
      }

      setStatus("preparing");
      const source = activeDoc.kind === "pdf"
        ? await renderPdfPageToDataUrl(activeDoc.pdfData ?? "", activePage.pdfPageNumber ?? 1)
        : imageSource;

      setStatus("ocr");
      const { recognize } = await import("tesseract.js");
      const result = await recognize(source, "eng", {
        logger: (message) => {
          if (message.status === "recognizing text" && typeof message.progress === "number") {
            setProgress(Math.round(message.progress * 100));
          }
        },
      });
      const text = result.data.text.trim();
      if (!text) throw new Error("No readable text was found on this page.");

      updatePage(activePage.id, textToHtml(text));
      setStatus("ready");
      onOpenVerification(text);
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Digitisation failed. Please try again.");
    }
  };

  return (
    <div className="tool-section digitise-panel">
      {!canDigitise ? (
        <div className="panel-empty">
          <ScanLine />
          <strong>Select a PDF or scanned image</strong>
          <span>Upload a file to create an editable, searchable text layer.</span>
          <button className="panel-secondary" onClick={onChooseFile}>Choose file</button>
        </div>
      ) : (
        <>
          <div className="digitise-summary">
            <CheckCircle2 />
            <div>
              <strong>{embeddedText ? "Text layer detected" : "Scanned page detected"}</strong>
              <span>{embeddedText ? `${embeddedText.split(/\s+/).length} words ready to verify` : "OCR will create an editable text layer"}</span>
            </div>
          </div>

          {status !== "ready" && (
            <button className="panel-primary" onClick={runDigitisation} disabled={status === "preparing" || status === "ocr"}>
              {status === "preparing" && <><Loader2 className="spin" /> Preparing page…</>}
              {status === "ocr" && <><Loader2 className="spin" /> Reading text {progress ? `${progress}%` : ""}</>}
              {(status === "idle" || status === "error") && <><ScanLine /> {embeddedText ? "Review extracted text" : "Digitise this page"}</>}
            </button>
          )}

          {status === "ready" && (
            <div className="digitise-actions">
              <button className="panel-secondary" onClick={() => onOpenVerification(embeddedText)}>Open verification</button>
              <button className="panel-primary" onClick={onApprove} disabled={!canApprove}><CheckCircle2 /> Approve text</button>
              <small>Approval creates a new editable document directly below the source.</small>
            </div>
          )}
          {error && <div className="panel-error"><AlertCircle /> <span>{error}</span></div>}
        </>
      )}
    </div>
  );
}
