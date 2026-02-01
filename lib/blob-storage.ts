import { put, head, list, del } from '@vercel/blob';

// In-memory cache for metadata URLs to avoid 403 issues with Vercel Blob
// Note: This cache is per-serverless-instance and won't persist across invocations
const metadataUrlCache = new Map<string, string>();

export interface SessionMetadata {
  sessionId: string;
  userId?: string;
  teamId: string;
  playerIds: string[];
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'uploading_selfie' | 'generating_pose1' | 'generating_pose2' | 'generating_video' | 'complete' | 'error';
  progress: number;
  assets: {
    selfie?: string;
    pose1?: string;
    pose2?: string;
    video?: string;
  };
  error?: string;
  lastSuccessfulStep?: string;
}

/**
 * Create a new session with metadata
 */
export async function createSession(
  teamId: string,
  playerIds: string[],
  userId?: string,
  providedSessionId?: string
): Promise<SessionMetadata> {
  const sessionId = providedSessionId || generateSessionId();

  // Check if session already exists
  const existingSession = await getSession(sessionId);
  if (existingSession) {
    return existingSession;
  }

  const metadata: SessionMetadata = {
    sessionId,
    userId,
    teamId,
    playerIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'pending',
    progress: 0,
    assets: {},
  };

  await uploadMetadata(sessionId, metadata);
  return metadata;
}

/**
 * Upload an asset to Vercel Blob
 */
export async function uploadAsset(
  sessionId: string,
  assetType: 'selfie' | 'pose1' | 'pose2' | 'video',
  file: Buffer | Blob | File,
  contentType: string
): Promise<string> {
  const extension = contentType.includes('video') ? 'mp4' : contentType.includes('png') ? 'png' : 'jpg';
  const path = `sessions/${sessionId}/${assetType}.${extension}`;

  const blob = await put(path, file, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return blob.url;
}

/**
 * Get session metadata
 */
export async function getSession(sessionId: string): Promise<SessionMetadata | null> {
  try {
    // First try cached URL (from recent put() calls)
    const cachedUrl = metadataUrlCache.get(sessionId);
    if (cachedUrl) {
      const response = await fetch(cachedUrl, { cache: 'no-store' });
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const metadata = await response.json();
          return metadata as SessionMetadata;
        }
      }
      // Cache miss or stale, remove from cache
      metadataUrlCache.delete(sessionId);
    }

    // Fall back to list() to find the metadata blob
    const { blobs } = await list({
      prefix: `sessions/${sessionId}/metadata.json`,
    });

    if (blobs.length === 0) {
      console.log(`Session ${sessionId} not found`);
      return null;
    }

    const metadataBlob = blobs[0];
    const blobUrl = metadataBlob.url;

    // Cache this URL for future use
    metadataUrlCache.set(sessionId, blobUrl);

    // Fetch the actual content using the blob URL
    const response = await fetch(blobUrl, {
      cache: 'no-store',
    });

    // Check if response is OK and content-type is JSON
    if (!response.ok) {
      console.error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
      console.error(`URL attempted: ${blobUrl}`);
      console.error(`Blob info:`, JSON.stringify(metadataBlob, null, 2));
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.error(`Invalid content-type for metadata: ${contentType}`);
      // Try to read the body for debugging
      const text = await response.text();
      console.error(`Response body (first 200 chars): ${text.substring(0, 200)}`);
      return null;
    }

    const metadata = await response.json();
    return metadata as SessionMetadata;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Update session progress and metadata
 * If session doesn't exist, creates a new one with the provided updates
 */
export async function updateSessionProgress(
  sessionId: string,
  updates: Partial<SessionMetadata>
): Promise<void> {
  let currentMetadata = await getSession(sessionId);

  if (!currentMetadata) {
    // Session doesn't exist, create it with default values
    console.log(`Session ${sessionId} not found, creating new session...`);
    currentMetadata = {
      sessionId,
      teamId: updates.teamId || 'unknown',
      playerIds: updates.playerIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      progress: 0,
      assets: {},
    };
  }

  const updatedMetadata: SessionMetadata = {
    ...currentMetadata,
    ...updates,
    assets: {
      ...currentMetadata.assets,
      ...updates.assets,
    },
    updatedAt: new Date().toISOString(),
  };

  await uploadMetadata(sessionId, updatedMetadata);
}

/**
 * Upload session metadata to Blob
 * Note: We don't use addRandomSuffix for metadata so we can find it by exact path
 */
async function uploadMetadata(sessionId: string, metadata: SessionMetadata): Promise<string> {
  const path = `sessions/${sessionId}/metadata.json`;
  const content = JSON.stringify(metadata, null, 2);

  const result = await put(path, content, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  // Cache the URL returned from put() - this URL should always work
  metadataUrlCache.set(sessionId, result.url);
  return result.url;
}

/**
 * Get cached metadata URL
 */
export function getCachedMetadataUrl(sessionId: string): string | undefined {
  return metadataUrlCache.get(sessionId);
}

/**
 * Clean up old sessions (older than 7 days)
 */
export async function cleanupOldSessions(): Promise<number> {
  try {
    const { blobs } = await list({
      prefix: 'sessions/',
    });

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const blob of blobs) {
      const uploadedAt = new Date(blob.uploadedAt).getTime();
      if (uploadedAt < sevenDaysAgo) {
        await del(blob.url);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    return 0;
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Convert a data URL (base64) to a Buffer
 */
export function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(',')[1];
  return Buffer.from(base64, 'base64');
}

/**
 * Get the content type from a data URL
 */
export function getContentTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1] : 'image/png';
}

/**
 * Clear all sessions from blob storage
 */
export async function clearAllSessions(): Promise<{ deletedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let deletedCount = 0;

  try {
    const { blobs } = await list({
      prefix: 'sessions/',
    });

    console.log(`Found ${blobs.length} blobs to delete...`);

    for (const blob of blobs) {
      try {
        await del(blob.url);
        deletedCount++;
        console.log(`Deleted: ${blob.pathname}`);
      } catch (error) {
        const errorMsg = `Failed to delete ${blob.pathname}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return { deletedCount, errors };
  } catch (error) {
    console.error('Error clearing sessions:', error);
    errors.push(`Failed to list blobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { deletedCount, errors };
  }
}

/**
 * List all sessions
 */
export async function listAllSessions(): Promise<{ sessionId: string; createdAt: string; status: string }[]> {
  try {
    const { blobs } = await list({
      prefix: 'sessions/',
    });

    // Filter for metadata.json files only
    const metadataBlobs = blobs.filter(blob => blob.pathname.endsWith('metadata.json'));
    const sessions: { sessionId: string; createdAt: string; status: string }[] = [];

    for (const blob of metadataBlobs) {
      try {
        const response = await fetch(blob.url);

        // Check content-type before parsing
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) {
          console.error(`Failed to read metadata from ${blob.pathname}: Invalid response`);
          continue;
        }

        const metadata = await response.json() as SessionMetadata;
        sessions.push({
          sessionId: metadata.sessionId,
          createdAt: metadata.createdAt,
          status: metadata.status,
        });
      } catch (error) {
        // Skip invalid metadata files
        console.error(`Failed to read metadata from ${blob.pathname}:`, error);
      }
    }

    return sessions;
  } catch (error) {
    console.error('Error listing sessions:', error);
    return [];
  }
}
