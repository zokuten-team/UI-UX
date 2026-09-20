import { NextResponse } from "next/server";
import { type TranslateRequest } from "@/lib/translation/sarvam";

export async function POST(request: Request) {
  try {
    const req: TranslateRequest = await request.json();
    const apiKey = process.env.SARVAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "SARVAM_API_KEY not configured" }, { status: 501 });
    }

    // TODO: Connect to Sarvam API
    // const response = await fetch("https://api.sarvam.ai/translate", { ... });
    
    return NextResponse.json({ error: "Translation API not fully implemented" }, { status: 501 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ configured: !!process.env.SARVAM_API_KEY });
}
