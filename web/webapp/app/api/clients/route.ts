import { NextResponse } from "next/server"

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || "http://localhost:8000"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const skip = searchParams.get('skip') || '0'
    const limit = searchParams.get('limit') || '10'

    const response = await fetch(`${SEARCH_SERVICE_URL}/clients/?skip=${skip}&limit=${limit}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Clients API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const response = await fetch(`${SEARCH_SERVICE_URL}/clients/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.detail || "Failed to create client")
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Clients API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create client" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('id')
    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      )
    }

    const body = await req.json()
    const response = await fetch(`${SEARCH_SERVICE_URL}/clients/${clientId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.detail || "Failed to update client")
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Clients API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update client" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('id')
    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      )
    }

    const response = await fetch(`${SEARCH_SERVICE_URL}/clients/${clientId}`, {
      method: "DELETE",
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.detail || "Failed to delete client")
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("Clients API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete client" },
      { status: 500 }
    )
  }
} 