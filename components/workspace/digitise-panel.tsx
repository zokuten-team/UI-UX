"use client";

import { useState } from "react";
import { Page, WorkspaceDoc } from "./types";
import { ScanLine, Loader2, Image, RotateCw, Contrast, CheckCircle, Maximize } from "lucide-react";
import { VerificationWorkspace } from "./verification-workspace";
type Props = {
  activeDoc: WorkspaceDoc | undefined;
  activePage: Page | undefined;
  setVerificationMode: (v: boolean) => void;
};

export function DigitisePanel({ activeDoc, activePage, setVerificationMode }: Props) {
  const [status, setStatus] = useState<"idle" | "preparing" | "cleaning" | "ocr" | "verified" | "complete">("idle");

  // Check if the current page has an image scan or is a PDF
  const hasImage = activePage?.html.includes("<img") || activeDoc?.kind === "pdf";
  const imgSrc = activeDoc?.kind === "pdf" 
    ? (activeDoc.pdfData || "")
    : (activePage?.html.match(/src="([^"]+)"/)?.[1] || "");

  const runDigitisationFlow = async () => {
    setStatus("preparing");
    await new Promise(r => setTimeout(r, 1000));
    
    setStatus("cleaning");
    await new Promise(r => setTimeout(r, 1500));
    
    setStatus("ocr");
    // This is where we'd hit /api/ocr/route.ts in the future
    await new Promise(r => setTimeout(r, 2000));
    
    setVerificationMode(true);
    setStatus("verified");
  };

  return (
    <div className="tool-section">
      <div className="tool-header">
        <div className="icon-box"><ScanLine size={20} /></div>
        <p>Convert scanned legal records into searchable, structured documents.</p>
      </div>

      {!hasImage ? (
        <div className="empty-state" style={{ padding: '24px 16px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <Image size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>No scan detected</h4>
          <p className="helper">Please upload an image or PDF scan into this document to begin digitisation.</p>
        </div>
      ) : (
        <div className="digitise-controls" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Scan Improvement</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="quiet-button" style={{ flex: 1, justifyContent: 'center' }}><RotateCw size={14} /> Auto-Rotate</button>
              <button className="quiet-button" style={{ flex: 1, justifyContent: 'center' }}><Contrast size={14} /> Enhance</button>
            </div>
            <p className="helper" style={{ marginTop: '8px' }}>Adjusts skew, removes background noise and enhances contrast.</p>
          </div>

          <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Output Mode</h4>
            <select className="panel-select" style={{ width: '100%', padding: '6px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              <option>Searchable PDF Overlay</option>
              <option>Editable Word Document</option>
              <option>Structured Data (JSON)</option>
              <option>Extract Table/Index</option>
            </select>
          </div>

          <button 
            className="panel-primary" 
            onClick={runDigitisationFlow}
            disabled={status !== "idle" && status !== "verified"}
          >
            {status === "idle" && <><ScanLine size={16} /> Start Digitisation</>}
            {status === "preparing" && <><Loader2 size={16} className="spin" /> Preparing Pages...</>}
            {status === "cleaning" && <><Loader2 size={16} className="spin" /> Cleaning Scan...</>}
            {status === "ocr" && <><Loader2 size={16} className="spin" /> Running PaddleOCR...</>}
            {status === "verified" && <><CheckCircle size={16} /> Digitisation Complete</>}
          </button>

          {status === "verified" && (
            <button className="quiet-button" onClick={() => setVerificationMode(true)} style={{ justifyContent: 'center' }}>
              <Maximize size={14} /> Reopen Verification Workspace
            </button>
          )}

        </div>
      )}
    </div>
  );
}
