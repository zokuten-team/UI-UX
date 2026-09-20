"use client";

import { useEffect, useRef, useState } from "react";
import { FileWarning, Loader2 } from "lucide-react";
import { openPdf } from "@/utils/pdf";

type Props = {
  source: string;
  pageNumber: number;
  label: string;
};

export function PdfPage({ source, pageNumber, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | undefined;

    const render = async () => {
      try {
        setState("loading");
        const pdf = await openPdf(source);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas is not supported.");

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        renderTask = page.render({ canvas, canvasContext: context, viewport });
        await renderTask.promise;
        if (!cancelled) setState("ready");
      } catch (error) {
        if (!cancelled && (error as { name?: string }).name !== "RenderingCancelledException") {
          setState("error");
        }
      }
    };

    void render();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pageNumber, source]);

  return (
    <div className="pdf-page" aria-label={`${label}, page ${pageNumber}`}>
      {state === "loading" && <div className="pdf-page-state"><Loader2 className="spin" /> Loading page…</div>}
      {state === "error" && <div className="pdf-page-state error"><FileWarning /> This page could not be rendered.</div>}
      <canvas ref={canvasRef} className={state === "ready" ? "ready" : ""} />
    </div>
  );
}
