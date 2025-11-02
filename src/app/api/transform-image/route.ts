import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route for Image Transformation using Hugging Face
 * Keeps API key secret on server-side
 * Uses FREE Hugging Face Inference API
 */

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';

// Free Hugging Face models for each style
const STYLE_MODELS = {
  simpson: {
    model: 'ogkalu/Comic-Diffusion',
    prompt: 'cartoon style, The Simpsons, yellow skin, 2D animation, simple shapes, bold outlines',
  },
  pixar: {
    model: 'nitrosocke/mo-di-diffusion',
    prompt: 'modern disney style, pixar, 3D rendered, soft lighting, expressive features, animation quality',
  },
  anime: {
    model: 'Linaqruf/anything-v3.0',
    prompt: 'anime style, manga, japanese animation, vibrant colors, detailed',
  },
} as const;

export async function POST(request: NextRequest) {
  try {
    // Check if running in browser (shouldn't happen, but just in case)
    if (!HUGGINGFACE_API_KEY) {
      console.warn('⚠️ No Hugging Face API key found, using public inference');
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const style = formData.get('style') as 'simpson' | 'pixar' | 'anime';

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    if (!style || !STYLE_MODELS[style]) {
      return NextResponse.json(
        { error: 'Invalid style specified' },
        { status: 400 }
      );
    }

    const modelConfig = STYLE_MODELS[style];

    console.log(`🎨 Transforming image with ${style} style using ${modelConfig.model}`);

    // Convert image to buffer
    const imageBuffer = await imageFile.arrayBuffer();

    // Call Hugging Face Inference API
    const apiUrl = `https://api-inference.huggingface.co/models/${modelConfig.model}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add authorization if API key is available
    if (HUGGINGFACE_API_KEY) {
      headers['Authorization'] = `Bearer ${HUGGINGFACE_API_KEY}`;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: modelConfig.prompt,
        parameters: {
          negative_prompt: 'blurry, low quality, distorted, ugly',
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!response.ok) {
      // Handle model loading state
      if (response.status === 503) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error && errorData.error.includes('loading')) {
          return NextResponse.json(
            {
              error: 'Model is loading. Please try again in 20-30 seconds.',
              retryAfter: 30,
            },
            { status: 503 }
          );
        }
      }

      const errorText = await response.text();
      console.error('Hugging Face API error:', response.status, errorText);

      return NextResponse.json(
        {
          error: `Transformation failed: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    // Get the transformed image
    const imageBlob = await response.blob();

    console.log(`✅ ${style} transformation successful (${Math.round(imageBlob.size / 1024)}KB)`);

    // Return the transformed image
    return new NextResponse(imageBlob, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Transform image error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
