import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/blob-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, playerIds, userId, sessionId } = body;

    if (!teamId || !playerIds) {
      return NextResponse.json(
        { error: 'Missing required fields: teamId, playerIds' },
        { status: 400 }
      );
    }

    const session = await createSession(teamId, playerIds, userId, sessionId);

    return NextResponse.json({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
