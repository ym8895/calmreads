// Resilient AI SDK loader — works in both Next.js dev (Turbopack) and production
// Must use dynamic require/import INSIDE functions, never at module top-level

type ZAIClient = {
  chat: {
    completions: {
      create: (params: {
        messages: Array<{ role: string; content: string }>;
        temperature?: number;
        max_tokens?: number;
      }) => Promise<{ choices: Array<{ message: { content: string } }> }>;
    };
  };
  audio: {
    tts: {
      create: (params: {
        input: string;
        voice: string;
        speed?: number;
        response_format?: string;
        stream?: boolean;
      }) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> }>;
    };
  };
};

let cachedClient: ZAIClient | null = null;

export async function getAI(): Promise<ZAIClient> {
  if (cachedClient) return cachedClient;

  let ZAI: any;

  // Strategy 1: Dynamic import (ESM)
  try {
    const mod = await import('z-ai-web-dev-sdk');
    ZAI = mod.default || mod;
    console.log('[AI] Loaded via dynamic import');
  } catch (e1) {
    console.warn('[AI] Dynamic import failed, trying require...', e1);
  }

  // Strategy 2: require (CJS)
  if (!ZAI) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('z-ai-web-dev-sdk');
      ZAI = mod.default || mod;
      console.log('[AI] Loaded via require');
    } catch (e2) {
      console.warn('[AI] require also failed', e2);
    }
  }

  if (!ZAI || typeof ZAI.create !== 'function') {
    throw new Error(
      `Could not load z-ai-web-dev-sdk. Dynamic import: ${!ZAI ? 'failed' : 'loaded but no create method'}. ` +
      `Check that the package is installed: npm ls z-ai-web-dev-sdk`
    );
  }

  cachedClient = await ZAI.create();
  return cachedClient;
}

// Reset cache (useful for testing or if client becomes stale)
export function resetAI() {
  cachedClient = null;
}
