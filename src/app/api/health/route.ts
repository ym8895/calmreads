import { NextResponse } from 'next/server';
import { chatWithFallback } from '@/lib/ai-client';

export async function GET() {
  const results: Record<string, unknown> = {};

  const providers = [
    { key: 'groq', skip: true },
    { key: 'deepseek', skip: false },
    { key: 'gemini', skip: false },
  ];

  for (const p of providers) {
    if (p.skip) continue;
    try {
      const result = await chatWithFallback(
        [{ role: 'user', content: 'Say "ok" in one word.' }],
        { max_tokens: 5, model: 'llama-3.1-8b-instant' }
      );
      results[p.key] = { status: 'ok', provider: result.provider, response: result.choices[0]?.message?.content };
    } catch (err: unknown) {
      const e = err as Error & { status?: number; message?: string };
      results[p.key] = { status: 'error', error: e.message, code: e.status };
    }
  }

  return NextResponse.json(results);
}