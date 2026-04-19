import { NextRequest, NextResponse } from 'next/server';

// Groq doesn't have TTS - return a flag to use browser TTS
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json() as { text: string };
    if (!text || text.length < 10) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    // Groq doesn't support TTS, return text for browser TTS
    return NextResponse.json({ 
      useBrowserTts: true,
      text: text.slice(0, 3000) 
    });
  } catch (error) {
    console.error('[Audio API] Error:', error);
    return NextResponse.json({ error: 'Failed to prepare audio. Please try again later.' }, { status: 500 });
  }
}
