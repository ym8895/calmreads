import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export function getUsageLogger() {
  return async (data: {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    endpoint: string;
    responseTimeMs: number;
    status: string;
    bookTitle?: string;
    bookAuthor?: string;
  }) => {
    if (!supabase) {
      console.warn('[Usage] Supabase not configured');
      return;
    }

    const { error } = await supabase
      .from('api_usage')
      .insert({
        provider: data.provider,
        model: data.model,
        prompt_tokens: data.promptTokens,
        completion_tokens: data.completionTokens,
        total_tokens: data.totalTokens,
        endpoint: data.endpoint,
        response_time_ms: data.responseTimeMs,
        status: data.status,
        book_title: data.bookTitle || null,
        book_author: data.bookAuthor || null,
      });

    if (error) {
      console.error('[Usage] Failed to log:', error);
    }
  };
}