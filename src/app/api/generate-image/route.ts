import { NextRequest, NextResponse } from 'next/server';

const ZAI_API_KEY = process.env.ZAI_API_KEY || '';
const ZAI_API_URL = 'https://api.z.ai/api/paas/v4/images/generations';

export async function POST(request: NextRequest) {
  try {
    if (!ZAI_API_KEY) {
      return NextResponse.json(
        { error: 'Z.AI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt, quality = 'standard', size = '1024x1024' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('Generating image with Z.AI:', { prompt, quality, size });

    const response = await fetch(ZAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'cogView-4-250304',
        prompt,
        quality,
        size,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Z.AI API error:', errorData);
      return NextResponse.json(
        { error: errorData.message || `Z.AI API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Z.AI response:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Generate image error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
