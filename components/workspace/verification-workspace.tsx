"use client";

import { X, Check, Search as SearchIcon, Type, Maximize } from "lucide-react";
import { useState } from "react";

type Props = {
  originalImageSrc: string;
  onClose: () => void;
  onVerified: () => void;
};

// Dummy OCR Data for the mock
const dummyOcrData = [
  { id: 1, text: "IN THE HIGH COURT OF KARNATAKA AT BENGALURU", confidence: 0.98, box: { top: '10%', left: '10%', width: '80%', height: '5%' } },
  { id: 2, text: "WRIT PETITION NO. ____ OF 2026", confidence: 0.95, box: { top: '16%', left: '30%', width: '40%', height: '4%' } },
  { id: 3, text: "BETWEEN:", confidence: 0.99, box: { top: '25%', left: '10%', width: '20%', height: '3%' } },
  { id: 4, text: "STATE OF KARNATAKA & OTHERS", confidence: 0.97, box: { top: '30%', left: '10%', width: '60%', height: '4%' } },
  { id: 5, text: "Vakalatnama filed by counsel.", confidence: 0.65, box: { top: '40%', left: '10%', width: '50%', height: '4%' } }, // low confidence example
];

export function VerificationWorkspace({ originalImageSrc, onClose, onVerified }: Props) {
  const [ocrText, setOcrText] = useState(dummyOcrData.map(d => d.text).join("\n\n"));
  const [activeBox, setActiveBox] = useState<number | null>(null);

  const handleVerify = () => {
    onVerified();
    onClose();
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1, 
      width: '100%', height: '100%', backgroundColor: '#fff'
    }}>
      {/* Header */}
      <header style={{ 
        minHeight: '48px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#f8fafc', gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, whiteSpace: 'nowrap' }}>
          <Maximize size={18} />
          Document Verification
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button className="quiet-button" title="Spell Check"><Type size={16} /> Check Spelling</button>
          <button className="quiet-button" title="Search"><SearchIcon size={16} /> Find/Replace</button>
          <button className="primary-button" onClick={handleVerify}><Check size={16} /> Approve & Save</button>
          <button className="quiet-button" onClick={onClose}><X size={16} /></button>
        </div>
      </header>

      {/* Split View */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#e2e8f0', gap: '1px' }}>
        
        {/* Left: Original Scan */}
        <div style={{ flex: 1, background: '#fff', position: 'relative', overflow: 'auto', padding: '24px' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', margin: '0 auto', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            
            {originalImageSrc.startsWith('data:application/pdf') ? (
              <iframe 
                src={`${originalImageSrc}#toolbar=0&navpanes=0&scrollbar=0`} 
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', minHeight: '600px' }} 
                title="Original PDF" 
              />
            ) : (
              <img src={originalImageSrc} alt="Original Scan" style={{ display: 'block', width: '100%', height: 'auto' }} />
            )}
            
            {/* Overlay bounding boxes (only if not pdf, or if pdf layout matches image) */}
            {!originalImageSrc.startsWith('data:application/pdf') && dummyOcrData.map(data => (
              <div 
                key={data.id}
                onMouseEnter={() => setActiveBox(data.id)}
                onMouseLeave={() => setActiveBox(null)}
                style={{
                  position: 'absolute',
                  top: data.box.top, left: data.box.left, width: data.box.width, height: data.box.height,
                  border: activeBox === data.id ? '2px solid #3b82f6' : data.confidence < 0.8 ? '2px dashed #ef4444' : '1px solid transparent',
                  backgroundColor: activeBox === data.id ? 'rgba(59, 130, 246, 0.1)' : data.confidence < 0.8 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title={data.confidence < 0.8 ? `Low Confidence: ${(data.confidence * 100).toFixed(1)}%` : `Confidence: ${(data.confidence * 100).toFixed(1)}%`}
              />
            ))}
          </div>
        </div>

        {/* Right: OCR Text / Editable Document */}
        <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px' }}>
            <span><span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', marginRight: '6px' }} />Low Confidence (Requires Review)</span>
            <span>Hover over text to highlight original scan region.</span>
          </div>
          <textarea 
            style={{ 
              flex: 1, width: '100%', padding: '24px', border: 'none', resize: 'none', 
              fontSize: '15px', lineHeight: '1.6', fontFamily: 'system-ui, sans-serif', outline: 'none'
            }}
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
          />
        </div>

      </div>
    </div>
  );
}
