import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdvoHQ Legal Workspace",
  description: "Legal document editing, research, AI tools, indexing and deterministic suit valuation in one workspace.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased">{children}</body></html>;
}
