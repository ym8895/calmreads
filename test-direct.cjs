process.env.GROQ_API_KEY = 'invalid';
process.env.GEMINI_API_KEY = 'AIzaSyDGkXrIc96qsbCXtFiKWJpGfMJqfjdM3ys';

const { chatWithFallback } = require('./src/lib/ai-client.ts');

async function test() {
  console.log('Testing chatWithFallback...');

  const messages = [
    { role: 'system', content: 'Write UNIQUE, SPECIFIC book summaries. Mention title and author. JSON only.' },
    { role: 'user', content: `Write a detailed summary for "Atomic Habits" by James Clear.\nDescription: Tiny changes remarkable results\n\nReturn valid JSON:\n{"introduction":"100 word intro","coreIdeas":["idea 1","idea 2","idea 3","idea 4"],"keyTakeaways":["takeaway 1","takeaway 2","takeaway 3","takeaway 4"],"fullText":"summary text"}\nJSON only, no markdown.` },
  ];

  try {
    const result = await chatWithFallback(messages, {
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 1900,
    });

    console.log('Provider:', result.provider);
    console.log('Response:', result.choices[0]?.message?.content?.slice(0, 200));
    console.log('SUCCESS');
  } catch (err) {
    console.error('FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

test();