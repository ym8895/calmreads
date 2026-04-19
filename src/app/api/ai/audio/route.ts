import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json() as { text: string };

    if (!text || text.length < 10) {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }

    let zai;
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      zai = await ZAI.create();
    } catch (sdkErr) {
      console.error('[Audio API] SDK init error:', sdkErr);
      return NextResponse.json(
        { error: 'AI service is currently unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }

    // Use TTS to generate audio from the summary text
    const audioResponse = await zai.tts.create({
      input: text.slice(0, 3000), // Limit to ~10 minutes of speech
      voice: 'alloy',
    });

    // The SDK returns base64 audio data
    const audioBase64 = audioResponse.audio || audioResponse.data;

    if (!audioBase64) {
      throw new Error('No audio data received from TTS service');
    }

    // Return the base64 audio data as a data URL
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error('[Audio API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio. Please try again later.' },
      { status: 500 }
    );
  }
}
