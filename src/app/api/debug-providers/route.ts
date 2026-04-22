import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function GET() {
  const results: Record<string, unknown> = {};
  const testMessage = [{ role: 'user' as const, content: 'Say "ok" in one word.' }];

  // Test Groq
  if (GROQ_API_KEY) {
    try {
      const groq = new OpenAI({ apiKey: GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
      const res = await groq.chat.completions.create({ model: 'llama-3.1-8b-instant', messages: testMessage, max_tokens: 5 });
      results.groq = { status: 'ok', model: res.model, response: res.choices[0]?.message?.content };
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      results.groq = { status: 'error', error: e.message?.slice(0, 100), code: e.status };
    }
  } else {
    results.groq = { status: 'skipped', reason: 'No API key' };
  }

  // Test Deepseek
  if (DEEPSEEK_API_KEY) {
    try {
      const ds = new OpenAI({ apiKey: DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com' });
      const res = await ds.chat.completions.create({ model: 'deepseek-chat', messages: testMessage, max_tokens: 5 });
      results.deepseek = { status: 'ok', model: res.model, response: res.choices[0]?.message?.content };
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      results.deepseek = { status: 'error', error: e.message?.slice(0, 100), code: e.status };
    }
  } else {
    results.deepseek = { status: 'skipped', reason: 'No API key' };
  }

  // Test Mistral
  if (MISTRAL_API_KEY) {
    try {
      const ms = new OpenAI({ apiKey: MISTRAL_API_KEY, baseURL: 'https://api.mistral.ai/v1' });
      const res = await ms.chat.completions.create({ model: 'mistral-small-latest', messages: testMessage, max_tokens: 5 });
      results.mistral = { status: 'ok', model: res.model, response: res.choices[0]?.message?.content };
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      results.mistral = { status: 'error', error: e.message?.slice(0, 100), code: e.status };
    }
  } else {
    results.mistral = { status: 'skipped', reason: 'No API key' };
  }

  // Test Gemini
  if (GEMINI_API_KEY) {
    try {
      const body = {
        contents: [{ role: 'user', parts: [{ text: 'Say "ok" in one word.' }] }],
        generationConfig: { maxOutputTokens: 5 },
      };
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (res.ok) {
        results.gemini = { status: 'ok', response: data.candidates?.[0]?.content?.parts?.[0]?.text };
      } else {
        const errObj = data as { error?: { message?: string } } | null;
        results.gemini = { status: 'error', error: errObj?.error?.message?.slice(0, 100), code: res.status };
      }
    } catch (err: unknown) {
      const e = err as Error & { message?: string };
      results.gemini = { status: 'error', error: e.message?.slice(0, 100) };
    }
  } else {
    results.gemini = { status: 'skipped', reason: 'No API key' };
  }

  return NextResponse.json(results);
}