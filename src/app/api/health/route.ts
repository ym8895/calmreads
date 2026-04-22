import { NextResponse } from 'next/server';
import { chatWithFallback } from '@/lib/ai-client';

export async function GET() {
  try {
    const result = await chatWithFallback(
      [{ role: 'user', content: 'Say "ok" in one word.' }],
      { max_tokens: 5 }
    );
    return NextResponse.json({
      status: 'ok',
      provider: result.provider,
      response: result.choices[0]?.message?.content,
    });
  } catch (err: unknown) {
    const e = err as Error & { status?: number; message?: string };
    return NextResponse.json({
      status: 'error',
      error: e.message,
      code: e.status,
    }, { status: 500 });
  }
}