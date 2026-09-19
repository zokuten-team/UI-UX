import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // TODO: In a production environment, this route would save the file to a temp dir
    // and spawn a python child_process to execute PaddleOCR, or forward the file buffer
    // to a dedicated PaddleOCR backend service via fetch().
    
    // For now, we return a mock successful response with dummy OCR data
    return NextResponse.json({
      success: true,
      message: "OCR processing completed",
      data: {
        text: "IN THE HIGH COURT OF KARNATAKA AT BENGALURU...",
        blocks: [
          { text: "IN THE HIGH COURT OF KARNATAKA", confidence: 0.98, bbox: [100, 100, 500, 150] }
        ]
      }
    });

  } catch (error) {
    console.error("OCR Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
