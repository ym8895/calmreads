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

interface ProviderConfig {
  name: 'groq' | 'deepseek' | 'mistral' | 'gemini';
  client: OpenAI | null;
  weight: number;
  failures: number;
  lastFailure: number;
}

const PROVIDER_COOLDOWN_MS = 30_000;

const providers: ProviderConfig[] = [
  { name: 'groq', client: groq, weight: 3, failures: 0, lastFailure: 0 },
  { name: 'deepseek', client: deepseek, weight: 2, failures: 0, lastFailure: 0 },
  { name: 'mistral', client: mistral, weight: 2, failures: 0, lastFailure: 0 },
  { name: 'gemini', client: null, weight: 1, failures: 0, lastFailure: 0 },
];

let usageLogger: ((data: { provider: string; model: string; promptTokens: number; completionTokens: number; totalTokens: number; endpoint: string; responseTimeMs: number; status: string }) => void) | null = null;

export function setUsageLogger(logger: typeof usageLogger): void {
  usageLogger = logger;
}

function getHealthyProviders(): ProviderConfig[] {
  const now = Date.now();
  return providers.filter(p => {
    if (!p.client && p.name !== 'gemini') return false;
    if (p.failures > 0 && now - p.lastFailure < PROVIDER_COOLDOWN_MS) return false;
    return true;
  });
}

function selectWeightedRandom(healthy: ProviderConfig[]): ProviderConfig {
  const totalWeight = healthy.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;

  for (const provider of healthy) {
    random -= provider.weight;
    if (random <= 0) return provider;
  }

  return healthy[0];
}

function recordFailure(provider: ProviderConfig): void {
  provider.failures++;
  provider.lastFailure = Date.now();
  console.warn(`[AI LB] ${provider.name} failure count: ${provider.failures}`);
}

function recordSuccess(provider: ProviderConfig): void {
  provider.failures = 0;
}

function logUsage(data: { provider: string; model: string; promptTokens: number; completionTokens: number; totalTokens: number; endpoint: string; responseTimeMs: number; status: string }): void {
  if (usageLogger) {
    try {
      usageLogger(data);
    } catch (err) {
      console.error('[AI LB] Usage logging failed:', err);
    }
  }
}

function extractTokens(usage: Record<string, number> | null | undefined): { total: number; prompt: number; completion: number } {
  if (!usage) return { total: 0, prompt: 0, completion: 0 };
  const total = (usage as { total_tokens?: number; totalTokens?: number }).total_tokens || (usage as { totalTokens?: number }).totalTokens || 0;
  const prompt = (usage as { prompt_tokens?: number }).prompt_tokens || 0;
  const completion = (usage as { completion_tokens?: number }).completion_tokens || 0;
  return { total, prompt, completion };
}

async function callGemini(messages: OpenAI.Chat.ChatCompletionMessageParam[], options: { temperature?: number; max_tokens?: number }, startTime: number) {
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
  const responseTime = Date.now() - startTime;

  logUsage({
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    promptTokens: (usage as { promptTokenCount?: number }).promptTokenCount || 0,
    completionTokens: (usage as { candidatesTokenCount?: number }).candidatesTokenCount || 0,
    totalTokens: (usage as { totalTokenCount?: number }).totalTokenCount || 0,
    endpoint: 'gemini',
    responseTimeMs: responseTime,
    status: 'success',
  });

  return {
    choices: [{ message: { role: 'model', content: text } }],
    usage,
  };
}

export async function chatWithFallback(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    endpoint?: string;
  } = {}
): Promise<{
  choices: { message: { role: string; content: string | null } }[];
  usage?: { totalTokens?: number };
  provider: 'groq' | 'deepseek' | 'mistral' | 'gemini';
}> {
  const { temperature = 0.7, max_tokens = 4000, endpoint = 'unknown' } = options;
  const startTime = Date.now();
  const healthy = getHealthyProviders();

  if (healthy.length === 0) {
    logUsage({
      provider: 'none',
      model: 'none',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      endpoint,
      responseTimeMs: Date.now() - startTime,
      status: 'all_providers_down',
    });
    throw new Error('All AI providers are unavailable');
  }

  const selected = selectWeightedRandom(healthy);

  if (selected.name === 'gemini') {
    try {
      const result = await callGemini(messages, { temperature, max_tokens }, startTime);
      recordSuccess(selected);
      return { ...result, provider: 'gemini' };
    } catch (err: unknown) {
      recordFailure(selected);
      logUsage({
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        endpoint,
        responseTimeMs: Date.now() - startTime,
        status: 'error',
      });
      const healthy2 = getHealthyProviders();
      if (healthy2.length > 0) {
        const next = selectWeightedRandom(healthy2.filter(p => p.name !== 'gemini'));
        if (next.client) {
          try {
            const completion = await next.client.chat.completions.create({
              model: next.name === 'groq' ? 'llama-3.1-8b-instant' : 'deepseek-chat',
              messages,
              temperature,
              max_tokens,
            });
            recordSuccess(next);
            const responseTime = Date.now() - startTime;
            const usage = extractTokens(completion.usage as Record<string, number>);
            logUsage({
              provider: next.name,
              model: next.name === 'groq' ? 'llama-3.1-8b-instant' : 'deepseek-chat',
              promptTokens: usage.prompt,
              completionTokens: usage.completion,
              totalTokens: usage.total,
              endpoint,
              responseTimeMs: responseTime,
              status: 'success',
            });
            return {
              choices: completion.choices,
              usage: completion.usage as { totalTokens?: number },
              provider: next.name,
            };
          } catch {
            recordFailure(next);
          }
        }
      }
      throw err;
    }
  }

  try {
    const completion = await selected.client!.chat.completions.create({
      model: selected.name === 'groq' ? 'llama-3.1-8b-instant' : 'deepseek-chat',
      messages,
      temperature,
      max_tokens,
    });

    recordSuccess(selected);
    const responseTime = Date.now() - startTime;
    const usage = extractTokens(completion.usage as Record<string, number>);
    logUsage({
      provider: selected.name,
      model: selected.name === 'groq' ? 'llama-3.1-8b-instant' : 'deepseek-chat',
      promptTokens: usage.prompt,
      completionTokens: usage.completion,
      totalTokens: usage.total,
      endpoint,
      responseTimeMs: responseTime,
      status: 'success',
    });
    return {
      choices: completion.choices,
      usage: completion.usage as { totalTokens?: number },
      provider: selected.name,
    };
  } catch (err: unknown) {
    recordFailure(selected);
    logUsage({
      provider: selected.name,
      model: selected.name === 'groq' ? 'llama-3.1-8b-instant' : 'deepseek-chat',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      endpoint,
      responseTimeMs: Date.now() - startTime,
      status: 'error',
    });
    throw err;
  }
}

export function resetAI(): void {
  for (const p of providers) {
    p.failures = 0;
  }
}

export function getProviderStatus(): Record<string, { healthy: boolean; failures: number }> {
  const now = Date.now();
  const status: Record<string, { healthy: boolean; failures: number }> = {};
  for (const p of providers) {
    const isHealthy = p.client || p.name === 'gemini';
    const inCooldown = p.failures > 0 && now - p.lastFailure < PROVIDER_COOLDOWN_MS;
    status[p.name] = { healthy: isHealthy && !inCooldown, failures: p.failures };
  }
  return status;
}