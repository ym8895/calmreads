import OpenAI from 'openai';

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || 'gsk_your_key_here';

const groq = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function getAI() {
  return groq;
}

export function resetAI() {
  // No-op for Groq
}
