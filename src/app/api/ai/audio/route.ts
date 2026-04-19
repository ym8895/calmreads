import { NextRequest, NextResponse } from 'next/server';
import { getAI } from '@/lib/ai-client';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json() as { text: string };
    if (!text || text.length < 10) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const zai = await getAI();

    const response = await zai.audio.tts.create({
      input: text.slice(0, 3000),
      voice: 'tongtong',
      speed: 1.0,
      response_format: 'wav',
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));
    const base64 = buffer.toString('base64');
    const audioUrl = `data:audio/wav;base64,${base64}`;

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error('[Audio API] Error:', error);
    return NextResponse.json({ error: 'Failed to generate audio. Please try again later.' }, { status: 500 });
  }
}
