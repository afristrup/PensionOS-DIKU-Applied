import { NextResponse } from "next/server"

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || "http://localhost:8000"

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json()

    // Format context from search results
    const contextText = context.plans
      .map(
        (plan: any) => `
Plan: ${plan.company_name} (${plan.plan_type})
Description: ${plan.description}
${
  plan.documents
    ? `Related Documents: ${plan.documents
        .map((doc: any) => doc.content)
        .join("\n")}`
    : ""
}
`
      )
      .join("\n")

    const response = await fetch(`${SEARCH_SERVICE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: message,
        context: contextText,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to get chat response")
    }

    const data = await response.json()
    return NextResponse.json({
      response: data.response,
    })
  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
} 