import ZAI from 'z-ai-web-dev-sdk';

// AI configuration - embedded directly so it works on any machine without needing a config file
const AI_CONFIG = {
  baseUrl: "http://172.25.136.193:8080/v1",
  apiKey: "Z.ai",
  chatId: "chat-41c579a3-3a38-46f7-90eb-5f214f4a1216",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZDk2MzYxNGYtN2Q1MS00ZGYzLTlkOGYtNzAyOGY4ZjFhMzYzIiwiY2hhdF9pZCI6ImNoYXQtNDFjNTc5YTMtM2EzOC00NmY3LTkwZWItNWYyMTRmNGExMjE2IiwicGxhdGZvcm0iOiJ6YWkifQ.JevbLcnyQxDAnC6j8l0OZzNFVOL8t4QoZah_yQxHt7A",
  userId: "d963614f-7d51-4df3-9d8f-7028f8f1a363"
};

// Create ZAI client using embedded config (bypasses .z-ai-config file entirely)
let cachedClient: InstanceType<typeof ZAI> | null = null;

export async function getAI(): Promise<InstanceType<typeof ZAI>> {
  if (!cachedClient) {
    // Use the constructor directly with embedded config — bypasses ZAI.create()
    // which requires a .z-ai-config file on the filesystem
    cachedClient = new ZAI(AI_CONFIG);
  }
  return cachedClient;
}

export function resetAI() {
  cachedClient = null;
}
