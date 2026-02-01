import { NextRequest, NextResponse } from 'next/server';
import { generateCompositeImage, retryWithBackoff } from '@/lib/fal-client';
import { uploadAsset, updateSessionProgress } from '@/lib/blob-storage';
import { generatePrompt, getPoseById } from '@/lib/pose-generator';

export const maxDuration = 300; // 5 minutes timeout for serverless function

export async function POST(request: NextRequest) {
  // Parse body once and store values for error handling
  const body = await request.json();
  const {
    sessionId,
    selfieUrl,
    playerImageUrls,
    teamName,
    playerNames,
    poseId,
    isInitialPose,
  } = body;

  try {

    // Validate required fields
    if (!sessionId || !selfieUrl || !teamName || !poseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get pose description
    const pose = getPoseById(poseId);
    if (!pose) {
      return NextResponse.json(
        { error: `Invalid pose ID: ${poseId}` },
        { status: 400 }
      );
    }

    // Generate prompt
    const prompt = generatePrompt(
      pose,
      teamName,
      playerNames || [],
      isInitialPose
    );

    console.log('Generating composite image with prompt:', prompt);

    // Update session progress
    const progressStatus = isInitialPose ? 'generating_pose1' : 'generating_pose2';
    await updateSessionProgress(sessionId, {
      status: progressStatus,
      progress: isInitialPose ? 20 : 50,
    });

    // Generate image with retry logic
    const imageUrl = await retryWithBackoff(
      () =>
        generateCompositeImage(
          {
            prompt,
            image_url: selfieUrl,
            image_size: {
              width: 1024,
              height: 576, // 16:9 aspect ratio
            },
            num_inference_steps: 28,
            guidance_scale: 3.5,
            num_images: 1,
            enable_safety_checker: true,
          },
          (update) => {
            console.log('Generation progress:', update.status);
          }
        ),
      3,
      2000
    );

    console.log('Generated image URL:', imageUrl);

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image');
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Upload to Vercel Blob
    const assetType = isInitialPose ? 'pose1' : 'pose2';
    const blobUrl = await uploadAsset(
      sessionId,
      assetType,
      imageBuffer,
      'image/png'
    );

    // Update session with generated image
    await updateSessionProgress(sessionId, {
      assets: {
        [assetType]: blobUrl,
      },
      progress: isInitialPose ? 35 : 65,
    });

    return NextResponse.json({
      success: true,
      imageUrl: blobUrl,
      assetType,
      poseId,
    });
  } catch (error) {
    console.error('Error generating composite image:', error);

    // Try to update session with error (using already-parsed sessionId)
    if (sessionId) {
      try {
        await updateSessionProgress(sessionId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastSuccessfulStep: isInitialPose ? 'selfie' : 'pose1',
        });
      } catch (updateError) {
        console.error('Failed to update session with error:', updateError);
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to generate composite image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
