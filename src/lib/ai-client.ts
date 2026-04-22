import OpenAI from 'openai';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';

const groq = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const deepseek = new OpenAI({
  apiKey: DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

const mistral = new OpenAI({
  apiKey: MISTRAL_API_KEY,
  baseURL: 'https://api.mistral.ai/v1',
});

interface TokenUsage {
  count: number;
  windowStart: number;
}

const TPM_WINDOW_MS = 60_000;

const tokenUsage: Record<string, TokenUsage> = {};

function getTPMLimit(provider: 'groq' | 'deepseek' | 'gemini' | 'mistral'): number {
  if (provider === 'groq') return 80_000;
  if (provider === 'deepseek') return 200_000;
  if (provider === 'mistral') return 100_000;
  return 1_000_000;
}

function isNearLimit(provider: 'groq' | 'deepseek' | 'gemini' | 'mistral', tokens: number): boolean {
  const limit = getTPMLimit(provider);
  const usage = tokenUsage[provider] || { count: 0, windowStart: Date.now() };

  if (Date.now() - usage.windowStart > TPM_WINDOW_MS) {
    tokenUsage[provider] = { count: 0, windowStart: Date.now() };
    return false;
  }

  return usage.count + tokens >= limit * 0.95;
}

function recordTokens(provider: 'groq' | 'deepseek' | 'gemini' | 'mistral', tokens: number): void {
  const now = Date.now();
  const usage = tokenUsage[provider] || { count: 0, windowStart: now };

  if (now - usage.windowStart > TPM_WINDOW_MS) {
    tokenUsage[provider] = { count: tokens, windowStart: now };
  } else {
    usage.count += tokens;
    tokenUsage[provider] = usage;
  }
}

function extractTokens(usage: { total_tokens?: number; totalTokens?: number } | null | undefined): number {
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
      maxOutputTokens: options.max_tokens ?? 8192,
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

  recordTokens('gemini', extractTokens(usage as { totalTokens?: number }));

  return {
    choices: [{ message: { role: 'model', content: text } }],
    usage: usage as { totalTokens?: number },
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
  provider: 'groq' | 'deepseek' | 'mistral' | 'gemini';
}> {
  const { model = 'llama-3.1-8b-instant', temperature = 0.7, max_tokens = 4000 } = options;

  if (!isNearLimit('groq', max_tokens)) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens,
      });

      recordTokens('groq', extractTokens(completion.usage as { totalTokens?: number }));

      return {
        choices: completion.choices,
        usage: completion.usage as { totalTokens?: number },
        provider: 'groq',
      };
    } catch (err: unknown) {
      const error = err as { status?: number; isRateLimit?: boolean };
      console.warn(`[AI] Groq error (${error.status}), trying Deepseek...`);
      if (error.status !== 429 && error.status !== 401 && error.status !== 403 && error.status !== 402 && error.status !== undefined) {
        throw err;
      }
    }
  } else {
    console.warn('[AI] Groq TPM near limit, trying Deepseek...');
  }

  if (!isNearLimit('deepseek', max_tokens)) {
    try {
      const completion = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages,
        temperature,
        max_tokens,
      });

      recordTokens('deepseek', extractTokens(completion.usage as { totalTokens?: number }));

      return {
        choices: completion.choices,
        usage: completion.usage as { totalTokens?: number },
        provider: 'deepseek',
      };
    } catch (err: unknown) {
      const error = err as { status?: number; isRateLimit?: boolean };
      console.warn(`[AI] Deepseek error (${error.status}), trying Mistral...`);
      if (error.status !== 429 && error.status !== 401 && error.status !== 403 && error.status !== 402 && error.status !== undefined) {
        throw err;
      }
    }
  } else {
    console.warn('[AI] Deepseek TPM near limit, trying Mistral...');
  }

  if (!isNearLimit('mistral', max_tokens)) {
    try {
      const completion = await mistral.chat.completions.create({
        model: 'mistral-small-latest',
        messages,
        temperature,
        max_tokens,
      });

      recordTokens('mistral', extractTokens(completion.usage as { totalTokens?: number }));

      return {
        choices: completion.choices,
        usage: completion.usage as { totalTokens?: number },
        provider: 'mistral',
      };
    } catch (err: unknown) {
      const error = err as { status?: number; isRateLimit?: boolean };
      console.warn(`[AI] Mistral error (${error.status}), trying Gemini...`);
      if (error.status !== 429 && error.status !== 401 && error.status !== 403 && error.status !== 402 && error.status !== undefined) {
        throw err;
      }
    }
  } else {
    console.warn('[AI] Mistral TPM near limit, trying Gemini...');
  }

  const result = await callGemini('gemini-2.5-flash', messages, { temperature, max_tokens });
  return { ...result, provider: 'gemini' };
}

export function resetAI(): void {
  tokenUsage['groq'] = { count: 0, windowStart: Date.now() };
  tokenUsage['deepseek'] = { count: 0, windowStart: Date.now() };
  tokenUsage['mistral'] = { count: 0, windowStart: Date.now() };
  tokenUsage['gemini'] = { count: 0, windowStart: Date.now() };
}