import { NextRequest, NextResponse } from 'next/server';
import type { AIStory } from '@/lib/types';
import { chatWithFallback, setUsageLogger } from '@/lib/ai-client';
import { getUsageLogger } from '@/lib/usage-logger';
import { getBookContent, updateBookContent } from '@/lib/supabase';

setUsageLogger(getUsageLogger());

function tryParseJSON(content: string): AIStory | null {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  try {
    const parsed = JSON.parse(cleaned);
    // Handle nested JSON strings
    if (typeof parsed.introduction === 'string' && parsed.introduction.startsWith('{')) {
      const inner = JSON.parse(parsed.introduction);
      return { ...inner, fullStory: parsed.fullStory || '' };
    }
    if (parsed.introduction && parsed.chapters) return parsed as AIStory;
    if (parsed.intro && parsed.chapters) return { ...parsed, introduction: parsed.intro } as AIStory;
  } catch {}
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const parsed = JSON.parse(m[0]);
      if (typeof parsed.introduction === 'string' && parsed.introduction.startsWith('{')) {
        const inner = JSON.parse(parsed.introduction);
        return { ...inner, fullStory: parsed.fullStory || '' };
      }
      if (parsed.introduction && parsed.chapters) return parsed as AIStory;
      if (parsed.intro && parsed.chapters) return { ...parsed, introduction: parsed.intro } as AIStory;
    } catch {}
  }
  return null;
}

function buildFallback(title: string, author: string, raw: string): AIStory {
  const paras = raw.split(/\n\n+/).filter(p => p.trim().length > 20);
  return {
    title: `The Story of ${title}`,
    introduction: paras[0]?.trim() || `Welcome to the story of "${title}" by ${author}.`,
    chapters: [
      { number: 1, title: 'Beginning', content: paras.slice(1, 4).join('\n\n') },
      { number: 2, title: 'Journey', content: paras.slice(4, 7).join('\n\n') },
      { number: 3, title: 'Climax', content: paras.slice(7, 10).join('\n\n') },
      { number: 4, title: 'Resolution', content: paras.slice(10, 13).join('\n\n') },
    ],
    fullStory: raw.trim().slice(0, 10000),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      title: string; author: string; description?: string; bookId?: string; categories?: string[];
    };
    const { title, author, description, bookId, categories } = body;
    if (!title || !author) {
      return NextResponse.json({ error: 'Book title and author are required' }, { status: 400 });
    }

    const useBookId = bookId || `${title}-${author}`.toLowerCase().replace(/\s+/g, '-');
    const cached = await getBookContent(useBookId);
    if (cached?.story) {
      const parsed = tryParseJSON(cached.story);
      if (parsed) return NextResponse.json(parsed);
    }

    const genreHint = categories?.length ? `\nGenres: ${categories.join(', ')}` : '';

    const prompt = `Write a story about "${title}" by ${author}. 
Description: ${description || 'N/A'}

IMPORTANT: Write detailed content for each of the 4 chapters.
Each chapter content: 100-150 words.
Return JSON: {"title":"story title","introduction":"intro text","chapters":[{"number":1,"title":"Beginning","content":"detailed content..."},{"number":2,"title":"Journey","content":"..."},{"number":3,"title":"Climax","content":"..."},{"number":4,"title":"Resolution","content":"..."}]}`;

    let story: AIStory | null = null;
    let rawContent = '';

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const completion = await chatWithFallback(
          [
            { role: 'system', content: 'Write engaging audiobook-style stories with chapters. JSON only.' },
            { role: 'user', content: prompt },
          ],
          { model: 'llama-3.1-8b-instant', temperature: 0.7, max_tokens: 4000, endpoint: 'story' }
        );
        rawContent = completion.choices[0]?.message?.content || '';
        story = tryParseJSON(rawContent);
        if (story) break;
      } catch (err) {
        console.error(`[Story] Attempt ${attempt + 1}:`, err);
        const e = err as Error & { status?: number };
        if (e.status !== 429 && e.status !== 401 && e.status !== undefined) {
          throw err;
        }
      }
    }

    if (!story && rawContent.length > 50) {
      story = buildFallback(title, author, rawContent);
    }
    if (!story) {
      return NextResponse.json({ error: 'Failed to generate story. Please try again.' }, { status: 500 });
    }

    if (story) {
      try {
        await updateBookContent(useBookId, { story: JSON.stringify(story) });
      } catch (err) {
        console.error('[Story] Cache save failed:', err);
      }
    }

    return NextResponse.json(story);
  } catch (error) {
    console.error('[Story API] Fatal:', error);
    return NextResponse.json({ error: 'Failed to generate story. Please try again later.' }, { status: 500 });
  }
}