import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import {
  uploadAsset,
  createSession,
  updateSessionProgress,
  dataUrlToBuffer,
  getContentTypeFromDataUrl,
} from '@/lib/blob-storage';

/**
 * Compute MD5 hash of a buffer to generate a deterministic session ID
 */
function computeSessionId(buffer: Buffer): string {
  return createHash('md5').update(buffer).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetType, dataUrl, teamId, playerIds } = body;

    if (!assetType || !dataUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: assetType, dataUrl' },
        { status: 400 }
      );
    }

    if (!['selfie', 'pose1', 'pose2', 'video'].includes(assetType)) {
      return NextResponse.json(
        { error: 'Invalid assetType. Must be selfie, pose1, pose2, or video' },
        { status: 400 }
      );
    }

    // Convert data URL to buffer
    const buffer = dataUrlToBuffer(dataUrl);
    const contentType = getContentTypeFromDataUrl(dataUrl);

    // For selfie uploads, compute session ID from MD5 of the image
    // This ensures the same image always maps to the same session
    let sessionId: string;

    if (assetType === 'selfie') {
      sessionId = computeSessionId(buffer);

      // Create or get existing session with this ID
      // Pass teamId and playerIds if provided
      await createSession(
        teamId || 'unknown',
        playerIds || [],
        undefined, // userId
        sessionId
      );

      // Update session status
      await updateSessionProgress(sessionId, {
        status: 'uploading_selfie',
        progress: 5,
        teamId: teamId || 'unknown',
        playerIds: playerIds || [],
      });
    } else {
      // For other assets, sessionId must be provided in body
      sessionId = body.sessionId;
      if (!sessionId) {
        return NextResponse.json(
          { error: 'sessionId required for non-selfie uploads' },
          { status: 400 }
        );
      }
    }

    // Upload to Vercel Blob
    const url = await uploadAsset(sessionId, assetType as any, buffer, contentType);

    // Update session with the selfie URL
    if (assetType === 'selfie') {
      await updateSessionProgress(sessionId, {
        status: 'uploading_selfie',
        progress: 10,
        assets: {
          selfie: url,
        },
      });
    }

    return NextResponse.json({
      url,
      assetType,
      sessionId,
      // Flag to tell client this is a new session from MD5
      isNewSession: assetType === 'selfie',
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { error: 'Failed to upload asset', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
