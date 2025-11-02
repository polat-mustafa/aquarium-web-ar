import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { generateAquariumPrompt } from '@/services/ReplicateVideoService';

export async function POST(request: NextRequest) {
  try {
    // Read token from environment at runtime
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

    console.log('🔍 Environment check:', {
      tokenExists: !!REPLICATE_API_TOKEN,
      tokenLength: REPLICATE_API_TOKEN?.length || 0,
      tokenPrefix: REPLICATE_API_TOKEN?.substring(0, 10) || 'undefined',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('REPLICATE')),
    });

    if (!REPLICATE_API_TOKEN) {
      console.error('❌ No REPLICATE_API_TOKEN found in environment');
      return NextResponse.json(
        {
          error: 'Replicate API token not configured',
          debug: 'Environment variable REPLICATE_API_TOKEN is missing. Please restart the dev server after setting .env.local'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { creatureName = 'sea creature', style = 'cinematic', photoDataUrl } = body;

    console.log(`🎬 Generating ${style} video for ${creatureName}...`);
    console.log(`📸 Photo provided: ${photoDataUrl ? 'Yes' : 'No'}`);

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    });

    // Generate prompt
    const prompt = generateAquariumPrompt(creatureName, style);

    console.log('📝 Prompt:', prompt);

    // Prepare input with photo as first frame
    const input: any = {
      prompt: prompt,
    };

    // Add photo as first frame if provided
    if (photoDataUrl) {
      input.first_frame_image = photoDataUrl;
      console.log('🖼️ Using captured photo as first frame');
    }

    // Run video generation
    const output = await replicate.run('minimax/video-01', {
      input,
    }) as any;

    console.log('✅ Video generation complete!');

    // Get video URL
    let videoUrl: string;
    if (typeof output === 'string') {
      videoUrl = output;
    } else if (output && typeof output.url === 'function') {
      videoUrl = output.url();
    } else if (output && output.url) {
      videoUrl = output.url;
    } else {
      throw new Error('Unexpected output format from Replicate');
    }

    console.log('🎥 Video URL:', videoUrl);

    return NextResponse.json({
      success: true,
      videoUrl: videoUrl,
      prompt: prompt,
      estimatedTime: 6, // 6 second video
    });
  } catch (error) {
    console.error('❌ Video generation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
