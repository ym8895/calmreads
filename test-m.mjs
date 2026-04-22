import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer kQm4VFu3d2GU4AeYTeGHm918PKgmaPDQ',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10,
    }),
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log(JSON.stringify(data, null, 2));
}

test();