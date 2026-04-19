import ZAI from 'z-ai-web-dev-sdk';

// Helper: create AI client (with caching)
let aiClient: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getAI() {
  if (!aiClient) aiClient = await ZAI.create();
  return aiClient;
}

export default getAI;
