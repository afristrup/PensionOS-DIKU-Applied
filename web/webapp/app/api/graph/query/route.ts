import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const response = await fetch(`${process.env.SEARCH_SERVICE_URL}/graph/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to query graph');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error querying graph:', error);
    return NextResponse.json(
      { error: 'Failed to query graph' },
      { status: 500 }
    );
  }
} 