import { NextResponse } from "next/server"

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || "http://localhost:8000"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const response = await fetch(`${SEARCH_SERVICE_URL}/search/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Search API Error:", error)
    return NextResponse.json(
      { error: "Failed to process search request" },
      { status: 500 }
    )
  }
} 