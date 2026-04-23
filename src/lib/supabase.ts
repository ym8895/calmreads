import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing credentials - AI caching disabled');
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

    if (error) return false;
    return true;
  } catch (err) {
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
  let content = getFromMemory(bookId);
  if (content) return content;

  content = await getFromSupabase(bookId);
  if (content) saveToMemory(bookId, content);

  return content;
}

export async function updateBookContent(
  bookId: string,
  updates: BookContentUpdate
): Promise<boolean> {
  const saved = await saveToSupabase(bookId, updates);
  if (saved && supabase) {
    const existing = await getFromSupabase(bookId);
    if (existing) saveToMemory(bookId, existing);
  }
  return saved;
}

export { CONTENT_VERSION };
export { getFromSupabase, saveToSupabase };

// Book Views for Trending
export async function trackBookView(bookId: string, bookTitle: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('book_views')
      .insert({ book_id: bookId, book_title: bookTitle });
    return !error;
  } catch { return false; }
}

export async function getTrendingBooks(hours = 24, limit = 10): Promise<{ book_id: string; book_title: string; views: number }[]> {
  if (!supabase) return [];
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .rpc('get_trending_books', { 
        hours_param: hours, 
        limit_param: limit,
        since_param: since 
      });
    if (error || !data) return [];
    return data.map((d: any) => ({
      book_id: d.book_id,
      book_title: d.book_title,
      views: d.views
    }));
  } catch { return []; }
}

export async function getTrendingBooksSimple(hours = 24, limit = 10): Promise<{ book_id: string; book_title: string; views: number }[]> {
  if (!supabase) return [];
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('book_views')
      .select('book_id, book_title')
      .gte('created_at', since)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    
    const viewsMap = new Map<string, { book_id: string; book_title: string; views: number }>();
    data.forEach((row: any) => {
      const existing = viewsMap.get(row.book_id);
      if (existing) {
        existing.views++;
      } else {
        viewsMap.set(row.book_id, { book_id: row.book_id, book_title: row.book_title, views: 1 });
      }
    });
    
    return Array.from(viewsMap.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  } catch { return []; }
}

// Feedback
export async function submitFeedbackToSupabase(message: string, category = 'general'): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('feedback')
      .insert({ message, category });
    return !error;
  } catch { return false; }
}

export async function getFeedbackFromSupabase(unreadOnly = false): Promise<{ feedback: { id: string; message: string; category: string; created_at: string; is_read: boolean }[]; unreadCount: number }> {
  if (!supabase) return { feedback: [], unreadCount: 0 };
  try {
    let query = supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    const { data, error } = await query;
    if (error || !data) return { feedback: [], unreadCount: 0 };
    
    const feedback = data.map(f => ({
      id: f.id,
      message: f.message,
      category: f.category,
      created_at: f.created_at,
      is_read: f.is_read
    }));
    const unreadCount = feedback.filter(f => !f.is_read).length;
    return { feedback, unreadCount };
  } catch { return { feedback: [], unreadCount: 0 }; }
}

export async function markFeedbackRead(id: string, isRead = true): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('feedback')
      .update({ is_read: isRead })
      .eq('id', id);
    return !error;
  } catch { return false; }
}