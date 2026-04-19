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

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Use TTS to generate audio from the summary text
    const audioResponse = await zai.tts.create({
      input: text.slice(0, 3000), // Limit to ~10 minutes of speech
      voice: 'alloy',
    });

    // The SDK returns base64 audio data
    const audioBase64 = audioResponse.audio || audioResponse.data;

    if (!audioBase64) {
      throw new Error('No audio data received');
    }

    // Return the base64 audio data as a data URL
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error('Error generating audio:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio. Please try again later.' },
      { status: 500 }
    );
  }
}
