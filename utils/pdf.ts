"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";

const documentCache = new Map<string, Promise<PDFDocumentProxy>>();
let sharedPdfWorker: Worker | null = null;

async function getPdfJs() {
  if (typeof window === "undefined") {
    throw new Error("PDF processing is only available in the browser.");
  }

  const pdfjs = await import("pdfjs-dist");
  const workerUrl = "/pdf.worker.min.mjs";
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  if (!sharedPdfWorker) {
    sharedPdfWorker = new Worker(workerUrl, { type: "module" });
  }
  pdfjs.GlobalWorkerOptions.workerPort = sharedPdfWorker;
  return pdfjs;
}

function dataUrlToBytes(source: string) {
  const base64 = source.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function openPdf(source: string) {
  const cached = documentCache.get(source);
  if (cached) return cached;

  const promise = getPdfJs().then((pdfjs) =>
    pdfjs.getDocument({ data: dataUrlToBytes(source) }).promise,
  );
  documentCache.set(source, promise);
  return promise;
}

export async function openPdfBytes(bytes: ArrayBuffer) {
  const pdfjs = await getPdfJs();
  return pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
}

export async function extractPdfPageText(pdf: PDFDocumentProxy, pageNumber: number) {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function renderPdfPageToDataUrl(source: string, pageNumber: number) {
  const pdf = await openPdf(source);
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas rendering is not available in this browser.");
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/png");
}
