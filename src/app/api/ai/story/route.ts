import { NextRequest, NextResponse } from 'next/server';
import type { AIStory } from '@/lib/types';
import { getAI } from '@/lib/ai-client';
import { getBookContent, updateBookContent } from '@/lib/supabase';

const DEFAULT_STORY: AIStory = {
  title: 'Story Unavailable',
  introduction: 'Story temporarily unavailable.',
  chapters: [
    { number: 1, title: 'Error', content: 'Please try again later.' },
  ],
  fullStory: '',
};

function tryParseJSON(content: string): AIStory | null {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.introduction === 'string' && parsed.introduction.startsWith('{')) {
      const inner = JSON.parse(parsed.introduction);
      return { ...inner, fullStory: parsed.fullStory || '' };
    }
    if (parsed.introduction && parsed.chapters) return parsed as AIStory;
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
      { number: 1, title: 'Beginning', content: paras.slice(1, 4).join('\n\n') || 'Story starts here.' },
      { number: 2, title: 'Journey', content: paras.slice(4, 7).join('\n\n') || 'The journey continues.' },
      { number: 3, title: 'Climax', content: paras.slice(7, 10).join('\n\n') || 'The climax approaches.' },
      { number: 4, title: 'Resolution', content: paras.slice(10, 13).join('\n\n') || 'The story concludes.' },
    ],
    fullStory: raw.trim().slice(0, 10000),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      title: string; author: string; description?: string; bookId?: string; categories?: string[];
    };
    const { title, author, description } = body;
    let bookId = body.bookId;
    
    if (!title || !author) return NextResponse.json({ error: 'Book title and author required' }, { status: 400 });
    if (!bookId) bookId = `${title}-${author}`.toLowerCase().replace(/\s+/g, '-');

    const cached = await getBookContent(bookId);
    if (cached?.story) {
      const parsed = tryParseJSON(cached.story);
      if (parsed) return NextResponse.json(parsed);
    }

    const zai = await getAI();

    const prompt = `Write a short story about "${title}" by ${author}.
Description: ${description || 'N/A'}
Return JSON: {"title":"The Story","introduction":"intro text","chapters":[{"number":1,"title":"Beginning","content":"..."},{"number":2,"title":"Journey","content":"..."},{"number":3,"title":"Climax","content":"..."},{"number":4,"title":"Resolution","content":"..."}]}`;

    let story: AIStory | null = null;

    try {
      const completion = await zai.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Write engaging stories with chapters. JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
      const rawContent = completion.choices[0]?.message?.content || '';
      story = tryParseJSON(rawContent);

      if (story) {
        await updateBookContent(bookId, { story: JSON.stringify(story) });
      }
    } catch (err) {
      console.error('[Story] AI error:', err);
    }

    if (!story) story = buildFallback(title, author, '');
    if (!story) return NextResponse.json(DEFAULT_STORY);

    return NextResponse.json(story);
  } catch (error) {
    console.error('[Story API] Fatal:', error);
    return NextResponse.json(DEFAULT_STORY);
  }
}