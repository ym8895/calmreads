import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk-b6f20ec6e126413cba27092286a0c20c',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10,
    }),
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log(JSON.stringify(data, null, 2));
}

test();