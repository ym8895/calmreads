const { createServer } = require('http');
const { parse } = require('url');
const { readFileSync, existsSync } = require('fs');
const { join, dirname } = require('path');

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`${req.method} ${pathname}`);

  if (pathname === '/api/ai/summary') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { chatWithFallback } = require('./src/lib/ai-client.ts');

        const { title, author, description } = JSON.parse(body);

        const messages = [
          { role: 'system', content: 'Write UNIQUE, SPECIFIC book summaries. Mention title and author. JSON only.' },
          { role: 'user', content: `Write a detailed summary for "${title}" by ${author}.\nDescription: ${description || 'No description'}\n\nReturn valid JSON:\n{"introduction":"100 word intro","coreIdeas":["idea 1","idea 2","idea 3","idea 4"],"keyTakeaways":["takeaway 1","takeaway 2","takeaway 3","takeaway 4"],"fullText":"summary text"}\nJSON only, no markdown.` },
        ];

        const result = await chatWithFallback(messages, {
          model: 'llama-3.1-8b-instant',
          temperature: 0.5,
          max_tokens: 1900,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ provider: result.provider, content: result.choices[0]?.message?.content }));
      } catch (err) {
        console.error('Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3001, () => {
  console.log('Test server on http://localhost:3001');
});