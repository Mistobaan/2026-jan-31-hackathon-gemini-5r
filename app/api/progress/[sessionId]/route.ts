import { NextRequest } from 'next/server';
import { getSession } from '@/lib/blob-storage';

export const dynamic = 'force-dynamic';

// Maximum time to wait for session to be created (60 seconds)
const MAX_WAIT_TIME = 60000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  // Create a ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const startTime = Date.now();
      let notFoundCount = 0;

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Poll for session updates
      const pollInterval = setInterval(async () => {
        try {
          const session = await getSession(sessionId);

          if (!session) {
            notFoundCount++;
            const elapsed = Date.now() - startTime;

            // Send waiting status instead of immediately erroring
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'progress',
                  status: 'waiting',
                  progress: 0,
                  message: 'Waiting for session to initialize...'
                })}\n\n`
              )
            );

            // Only give up after MAX_WAIT_TIME
            if (elapsed > MAX_WAIT_TIME) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'error', error: 'Session not found after timeout' })}\n\n`
                )
              );
              clearInterval(pollInterval);
              controller.close();
            }
            return;
          }

          // Reset not found counter when session is found
          notFoundCount = 0;

          // Send progress update
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'progress',
                status: session.status,
                progress: session.progress,
                assets: session.assets,
                error: session.error,
              })}\n\n`
            )
          );

          // Close stream if complete or error
          if (session.status === 'complete' || session.status === 'error') {
            clearInterval(pollInterval);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'done', session })}\n\n`
              )
            );
            controller.close();
          }
        } catch (error) {
          console.error('Error polling session:', error);
          // Don't immediately close on error, keep trying
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'progress',
                status: 'waiting',
                progress: 0,
                message: 'Reconnecting...',
              })}\n\n`
            )
          );
        }
      }, 1000); // Poll every second

      // Clean up on stream close
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
