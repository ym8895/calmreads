'use client';

import OpenAI from 'openai';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const groq = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

interface TokenUsage {
  count: number;
  windowStart: number;
}

const TPM_WINDOW_MS = 60_000;

const tokenUsage: Record<string, TokenUsage> = {};

function getTPMLimit(provider: 'groq' | 'gemini'): number {
  if (provider === 'groq') return 80_000;
  return 1_000_000;
}

function isNearLimit(provider: 'groq' | 'gemini', tokens: number): boolean {
  const limit = getTPMLimit(provider);
  const usage = tokenUsage[provider] || { count: 0, windowStart: Date.now() };

  if (Date.now() - usage.windowStart > TPM_WINDOW_MS) {
    tokenUsage[provider] = { count: 0, windowStart: Date.now() };
    return false;
  }

  return usage.count + tokens >= limit * 0.95;
}

function recordTokens(provider: 'groq' | 'gemini', tokens: number): void {
  const now = Date.now();
  const usage = tokenUsage[provider] || { count: 0, windowStart: now };

  if (now - usage.windowStart > TPM_WINDOW_MS) {
    tokenUsage[provider] = { count: tokens, windowStart: now };
  } else {
    usage.count += tokens;
    tokenUsage[provider] = usage;
  }
}

function extractGeminiTokens(usage: { totalTokens?: number; promptTokens?: number; completionTokens?: number } | null | undefined): number {
  if (!usage) return 0;
  return (usage as { totalTokens?: number }).totalTokens || 0;
}

async function callGemini(model: string, messages: OpenAI.Chat.ChatCompletionMessageParam[], options: { temperature?: number; max_tokens?: number }) {
  const contents = messages
    .filter(m => m.content && typeof m.content === 'string')
    .map(m => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content as string }],
    }));

  const body = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.max_tokens ?? 2048,
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const errObj = errBody as { error?: { message?: string } } | null;
    throw Object.assign(new Error(errObj?.error?.message || `Gemini API error ${res.status}`), {
      status: res.status,
      isRateLimit: res.status === 429,
    });
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usage = data.usageMetadata || {};

  recordTokens('gemini', extractGeminiTokens(usage));

  return {
    choices: [{ message: { role: 'model', content: text } }],
    usage,
    raw: data,
  };
}

export async function chatWithFallback(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<{
  choices: { message: { role: string; content: string | null } }[];
  usage?: { totalTokens?: number };
  provider: 'groq' | 'gemini';
}> {
  const { model = 'llama-3.1-8b-instant', temperature = 0.7, max_tokens = 2000 } = options;

  const groqModel = model;
  const geminiModel = 'gemini-2.5-flash';

  if (!isNearLimit('groq', max_tokens)) {
    try {
      const completion = await groq.chat.completions.create({
        model: groqModel,
        messages,
        temperature,
        max_tokens,
      });

      const tokens = extractGeminiTokens(completion.usage as { totalTokens?: number });
      recordTokens('groq', tokens);

      return {
        choices: completion.choices,
        usage: completion.usage as { totalTokens?: number },
        provider: 'groq',
      };
    } catch (err: unknown) {
      const error = err as { status?: number; isRateLimit?: boolean };
      if (error.status === 429 || error.isRateLimit || error.status === 401) {
        console.warn(`[AI] Groq error (${error.status}), falling back to Gemini...`);
      } else {
        throw err;
      }
    }
  } else {
    console.warn('[AI] Groq TPM near limit, switching to Gemini...');
  }

  const result = await callGemini(geminiModel, messages, { temperature, max_tokens });
  return { ...result, provider: 'gemini' };
}

export function resetAI(): void {
  tokenUsage['groq'] = { count: 0, windowStart: Date.now() };
  tokenUsage['gemini'] = { count: 0, windowStart: Date.now() };
}