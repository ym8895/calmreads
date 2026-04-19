import OpenAI from 'openai';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

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
