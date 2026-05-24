import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { barcode } = await request.json();

    if (!barcode || typeof barcode !== "string") {
      return NextResponse.json(
        { error: "Valid barcode string is required" },
        { status: 400 }
      );
    }

    // Forward request to backend FastAPI server
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";
    const response = await fetch(`${backendUrl}/barcode/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ barcode }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Backend error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Barcode scan API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to process barcode scan",
      },
      { status: 500 }
    );
  }
}
