import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing credentials - AI caching disabled');
  console.warn('[Supabase] URL:', supabaseUrl || 'MISSING');
  console.warn('[Supabase] Key:', supabaseKey ? 'SET' : 'MISSING');
} else {
  console.log('[Supabase] Client initialized');
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface BookContent {
  book_id: string;
  summary: string | null;
  story: string | null;
  slides: string | null;
  audio_url: string | null;
  version: string;
  updated_at: string;
}

const CONTENT_VERSION = 'v1';

const inMemoryCache = new Map<string, {
  data: BookContent;
  expiry: number;
}>();

const CACHE_TTL = 1000 * 60 * 5;

async function getFromSupabase(bookId: string): Promise<BookContent | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('book_content')
      .select('*')
      .eq('book_id', bookId)
      .single();

    if (error || !data) return null;
    return data as BookContent;
  } catch (err) {
    console.error('[Supabase] Get error:', err);
    return null;
  }
}

type BookContentUpdate = {
  summary?: string | null;
  story?: string | null;
  slides?: string | null;
  audio_url?: string | null;
};

async function saveToSupabase(
  bookId: string,
  updates: BookContentUpdate
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('book_content')
      .upsert({
        book_id: bookId,
        ...updates,
        version: CONTENT_VERSION,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'book_id' });

    if (error) {
      console.error('[Supabase] Save error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Save error:', err);
    return false;
  }
}

export function getFromMemory(bookId: string): BookContent | null {
  const cached = inMemoryCache.get(bookId);
  if (!cached) return null;
  if (Date.now() > cached.expiry) {
    inMemoryCache.delete(bookId);
    return null;
  }
  return cached.data;
}

export function saveToMemory(bookId: string, data: BookContent): void {
  inMemoryCache.set(bookId, {
    data,
    expiry: Date.now() + CACHE_TTL,
  });
}

export async function getBookContent(bookId: string): Promise<BookContent | null> {
  console.log('[Supabase] getBookContent:', bookId);
  
  let content = getFromMemory(bookId);
  if (content) {
    console.log('[Supabase] Found in memory');
    return content;
  }

  content = await getFromSupabase(bookId);
  if (content) {
    console.log('[Supabase] Found in DB');
    saveToMemory(bookId, content);
  } else {
    console.log('[Supabase] Not found');
  }

  return content;
}

export async function updateBookContent(
  bookId: string,
  updates: BookContentUpdate
): Promise<boolean> {
  const saved = await saveToSupabase(bookId, updates);
  if (saved && supabase) {
    const existing = await getFromSupabase(bookId);
    if (existing) {
      saveToMemory(bookId, existing);
    }
  }
  return saved;
}

export { CONTENT_VERSION };
export { getFromSupabase, saveToSupabase };