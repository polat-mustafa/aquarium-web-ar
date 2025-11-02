import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route for Image Transformation using Hugging Face
 * Keeps API key secret on server-side
 * Uses FREE Hugging Face Inference API
 */

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';

// Working Hugging Face models that support Inference API
// These models are confirmed to work with the Inference API
const STYLE_MODELS = {
  simpson: {
    model: 'stabilityai/stable-diffusion-2-1',
    prompt: 'cartoon style, The Simpsons TV show, yellow skin character, 2D animation, simple shapes, bold black outlines, Springfield style',
  },
  pixar: {
    model: 'stabilityai/stable-diffusion-2-1',
    prompt: 'Pixar 3D animation style, Disney Pixar character, soft lighting, expressive features, 3D rendered, computer animation',
  },
  anime: {
    model: 'stabilityai/stable-diffusion-2-1',
    prompt: 'anime style illustration, manga art, japanese animation style, vibrant colors, detailed anime character',
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
    const imageData = new Uint8Array(imageBuffer);

    // Call NEW Hugging Face Inference Providers API (Nov 2025 migration)
    // Migrated from deprecated api-inference.huggingface.co to router.huggingface.co
    const apiUrl = `https://router.huggingface.co/hf-inference/${modelConfig.model}`;

    const headers: Record<string, string> = {};

    // Only add authorization if API key is available
    if (HUGGINGFACE_API_KEY) {
      headers['Authorization'] = `Bearer ${HUGGINGFACE_API_KEY}`;
    }

    // Send the actual image bytes for transformation
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: imageData,
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
