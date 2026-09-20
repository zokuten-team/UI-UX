/* ── Sharing & Collaboration ──────────────────────────────────────
 *
 * Link-based sharing with optional live collaboration.
 *
 * For full real-time collaboration, a WebSocket server is needed
 * (e.g., Cloudflare Durable Objects). This module provides the
 * client-side logic and a localStorage fallback for share links.
 *
 * Usage:
 *   import { createShareLink, loadSharedWorkspace } from "@/lib/sharing/collab";
 * ────────────────────────────────────────────────────────────────── */

export type SharePermission = "view" | "edit" | "full";

export type ShareLink = {
  id: string;
  url: string;
  permission: SharePermission;
  createdAt: number;
  expiresAt?: number;
};

export type Collaborator = {
  id: string;
  name: string;
  color: string;
  cursorPosition?: { docId: string; pageId: string; offset: number };
  lastSeen: number;
};

/**
 * Generate a unique share ID.
 */
function generateShareId(): string {
  return `share_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a shareable link for the current workspace.
 * Stores workspace state in localStorage (or server when API is configured).
 */
export async function createShareLink(
  workspaceData: string,
  permission: SharePermission = "view",
): Promise<ShareLink> {
  const id = generateShareId();

  // TODO: When /api/share is connected to a backend:
  // const res = await fetch("/api/share", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ id, workspaceData, permission }),
  // });
  // return res.json();

  // localStorage fallback for development
  try {
    localStorage.setItem(`advohq_share_${id}`, workspaceData);
  } catch {
    // Storage quota exceeded — silently fail
  }

  const url = `${window.location.origin}?share=${id}`;
  const link: ShareLink = {
    id,
    url,
    permission,
    createdAt: Date.now(),
  };

  return link;
}

/**
 * Load a shared workspace from a share link ID.
 */
export async function loadSharedWorkspace(shareId: string): Promise<string | null> {
  // TODO: When /api/share is connected:
  // const res = await fetch(`/api/share?id=${shareId}`);
  // if (!res.ok) return null;
  // const data = await res.json();
  // return data.workspaceData;

  return localStorage.getItem(`advohq_share_${shareId}`);
}

/**
 * Copy text to clipboard with fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  }
}
