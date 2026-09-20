"use client";

import { useState } from "react";
import { Link, Copy, Check, Users, ShieldAlert, Loader2 } from "lucide-react";
import { createShareLink, copyToClipboard, type ShareLink, type SharePermission } from "@/lib/sharing/collab";

type Props = {
  workspaceData: string;
};

export function SharingPanel({ workspaceData }: Props) {
  const [permission, setPermission] = useState<SharePermission>("view");
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateLink = async () => {
    setGenerating(true);
    setError("");
    try {
      const link = await createShareLink(workspaceData, permission);
      setShareLink(link);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create share link");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareLink) return;
    const success = await copyToClipboard(shareLink.url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="tool-section">
      <p className="helper">Generate a shareable link to collaborate on this workspace.</p>
      
      <label>Link permissions
        <select value={permission} onChange={(e) => {
          setPermission(e.target.value as SharePermission);
          setShareLink(null); // Reset link when permission changes
        }}>
          <option value="view">Anyone with the link can view</option>
          <option value="edit">Anyone with the link can edit</option>
          <option value="full">Full access (can add/remove docs)</option>
        </select>
      </label>

      {!shareLink ? (
        <button 
          className="panel-primary" 
          onClick={handleGenerateLink} 
          disabled={generating}
        >
          {generating ? <><Loader2 className="spin" /> Generating link…</> : <><Link /> Create share link</>}
        </button>
      ) : (
        <div className="share-link-container">
          <div className="link-box">
            <input type="text" readOnly value={shareLink.url} />
            <button onClick={handleCopy} title="Copy link">
              {copied ? <Check className="success-icon" /> : <Copy />}
            </button>
          </div>
          {copied && <span className="copy-feedback">Copied to clipboard!</span>}
        </div>
      )}

      {error && <div className="panel-error"><span>{error}</span></div>}

      <div className="collaborator-list">
        <h4><Users size={16} /> Active Collaborators</h4>
        <div className="empty-state">No one else is currently viewing this workspace.</div>
        {/* TODO: Implement real-time WebSocket connection to show active users */}
      </div>

      <div className="share-disclaimer">
        <ShieldAlert size={16} />
        <p>Sharing is currently implemented using local storage for demonstration. For true real-time collaboration across different devices, a WebSocket backend must be deployed.</p>
      </div>
    </div>
  );
}
