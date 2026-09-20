import { NextResponse } from "next/server";
import { type DraftRequest } from "@/lib/ai/claude";

export async function POST(request: Request) {
  try {
    const req: DraftRequest = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 501 });
    }

    // TODO: Connect to Anthropic API
    // const response = await anthropic.messages.create({ ... });
    
    return NextResponse.json({ error: "Drafting API not fully implemented" }, { status: 501 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ configured: !!process.env.ANTHROPIC_API_KEY });
}
