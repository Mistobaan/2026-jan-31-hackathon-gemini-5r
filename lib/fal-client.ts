import { fal } from '@fal-ai/client';

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_KEY,
});

export interface FluxDevInput {
  prompt: string;
  image_size?: {
    width: number;
    height: number;
  };
  num_inference_steps?: number;
  guidance_scale?: number;
  num_images?: number;
  enable_safety_checker?: boolean;
  image_url?: string;
  sync_mode?: boolean;
}

export interface FluxDevOutput {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: Record<string, number>;
  seed: number;
  has_nsfw_concepts: boolean[];
  prompt: string;
}

export interface KlingVideoInput {
  prompt: string;
  image_url: string;
  duration?: '5' | '10';
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  negative_prompt?: string;
}

export interface KlingVideoOutput {
  video: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
}

export interface ProgressCallback {
  (update: any): void;
}

/**
 * Generate an image using fal.ai Flux Dev
 */
export async function generateCompositeImage(
  input: FluxDevInput,
  onProgress?: ProgressCallback
): Promise<string> {
  try {
    const result = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        ...input,
        sync_mode: false,
      },
      logs: true,
      onQueueUpdate: (update: any) => {
        if (onProgress) {
          onProgress(update);
        }
      },
    });

    const output = result.data as FluxDevOutput;

    if (!output.images || output.images.length === 0) {
      throw new Error('No images generated');
    }

    return output.images[0].url;
  } catch (error) {
    console.error('Error generating image with Flux Dev:', error);
    throw error;
  }
}

/**
 * Generate a video using fal.ai Kling 01 image-to-video
 */
export async function generateReferenceVideo(
  input: KlingVideoInput,
  onProgress?: ProgressCallback
): Promise<string> {
  try {
    const result = await fal.subscribe('fal-ai/kling-video/v1/standard/image-to-video', {
      input: {
        prompt: input.prompt,
        image_url: input.image_url,
        duration: input.duration || '5',
        negative_prompt: input.negative_prompt,
      },
      logs: true,
      onQueueUpdate: (update: any) => {
        if (onProgress) {
          onProgress(update);
        }
      },
    });

    const output = result.data as KlingVideoOutput;

    if (!output.video || !output.video.url) {
      throw new Error('No video generated');
    }

    return output.video.url;
  } catch (error) {
    console.error('Error generating video with Kling:', error);
    throw error;
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors (e.g., invalid input)
      if (isNonRetryableError(error)) {
        throw error;
      }

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('invalid input') ||
      message.includes('bad request') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    );
  }
  return false;
}
