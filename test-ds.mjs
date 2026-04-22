process.env.GROQ_API_KEY = 'invalid';
process.env.GEMINI_API_KEY = 'invalid';
process.env.DEEPSEEK_API_KEY = 'sk-b6f20ec6e126413cba27092286a0c20c';

import { chatWithFallback } from './src/lib/ai-client.ts';

async function test() {
  console.log('Testing Deepseek fallback...\n');

  try {
    const result = await chatWithFallback(
      [{ role: 'user', content: 'Say "hello from deepseek" and nothing else.' }],
      { max_tokens: 20 }
    );
    console.log('Provider:', result.provider);
    console.log('Response:', result.choices[0]?.message?.content);
    console.log('SUCCESS');
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
}

test();