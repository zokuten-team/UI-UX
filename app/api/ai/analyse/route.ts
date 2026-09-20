import { NextResponse } from "next/server";
import { type AnalyseRequest } from "@/lib/ai/claude";

export async function POST(request: Request) {
  try {
    const req: AnalyseRequest = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 501 });
    }

    // TODO: Connect to Anthropic API
    
    return NextResponse.json({ error: "Analysis API not fully implemented" }, { status: 501 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ configured: !!process.env.ANTHROPIC_API_KEY });
}
