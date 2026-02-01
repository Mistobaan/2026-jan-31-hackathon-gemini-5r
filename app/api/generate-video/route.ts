import { NextRequest, NextResponse } from 'next/server';
import { generateReferenceVideo, retryWithBackoff } from '@/lib/fal-client';
import { uploadAsset, updateSessionProgress } from '@/lib/blob-storage';
import { generateVideoPrompt } from '@/lib/pose-generator';

export const maxDuration = 300; // 5 minutes timeout for serverless function

export async function POST(request: NextRequest) {
  // Parse body once and store sessionId for error handling
  const body = await request.json();
  const {
    sessionId,
    pose1Url,
    pose2Url,
    initialPoseId,
    iconicPoseId,
    teamName,
  } = body;

  try {

    // Validate required fields
    if (!sessionId || !pose1Url || !teamName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Starting video generation for session:', sessionId);

    // Update session progress
    await updateSessionProgress(sessionId, {
      status: 'generating_video',
      progress: 70,
    });

    // Generate video prompt
    const prompt = `Professional cinematic sports video showing smooth transition from casual pose to dynamic celebration. NFL stadium setting with dramatic lighting. High-quality production. ${teamName} team atmosphere. Dynamic camera movement. 5 seconds.`;

    console.log('Generating video with prompt:', prompt);

    // Generate video with retry logic
    // Note: Using only the first image (pose1) as reference for Kling image-to-video
    const videoUrl = await retryWithBackoff(
      () =>
        generateReferenceVideo(
          {
            prompt,
            image_url: pose1Url,
            duration: '5',
            negative_prompt: 'blurry, distorted, low quality, static, frozen',
          },
          (update) => {
            console.log('Video generation progress:', update.status);

            // Update progress based on status
            if (update.status === 'IN_PROGRESS') {
              updateSessionProgress(sessionId, {
                progress: 85,
              }).catch(console.error);
            }
          }
        ),
      3,
      5000 // Longer initial delay for video generation
    );

    console.log('Generated video URL:', videoUrl);

    // Download the generated video
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to download generated video');
    }
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    // Upload to Vercel Blob
    const blobUrl = await uploadAsset(
      sessionId,
      'video',
      videoBuffer,
      'video/mp4'
    );

    // Update session with complete status
    await updateSessionProgress(sessionId, {
      status: 'complete',
      progress: 100,
      assets: {
        video: blobUrl,
      },
    });

    return NextResponse.json({
      success: true,
      videoUrl: blobUrl,
    });
  } catch (error) {
    console.error('Error generating video:', error);

    // Try to update session with error (using already-parsed sessionId)
    if (sessionId) {
      try {
        await updateSessionProgress(sessionId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastSuccessfulStep: 'pose2',
        });
      } catch (updateError) {
        console.error('Failed to update session with error:', updateError);
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to generate video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
