import { NextRequest, NextResponse } from 'next/server';
import type { AISummary } from '@/lib/types';
import { chatWithFallback } from '@/lib/ai-client';
import { getBookContent, updateBookContent } from '@/lib/supabase';

function tryParseJSON(content: string): AISummary | null {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.introduction && parsed.coreIdeas && parsed.keyTakeaways && parsed.fullText) return parsed as AISummary;
  } catch {}
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const parsed = JSON.parse(m[0]);
      if (parsed.introduction && parsed.coreIdeas && parsed.keyTakeaways && parsed.fullText) return parsed as AISummary;
    } catch {}
  }
  try {
    const fixed = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    const parsed = JSON.parse(fixed);
    if (parsed.introduction && parsed.coreIdeas && parsed.keyTakeaways && parsed.fullText) return parsed as AISummary;
  } catch {}
  return null;
}

function buildFallback(title: string, author: string, raw: string): AISummary {
  const paras = raw.split(/\n\n+/).filter(p => p.trim().length > 20);
  const intro = paras[0]?.trim() || `Summary of "${title}" by ${author}.`;
  const rest = paras.slice(1).join('\n\n');
  const sents = rest.split(/[.!?]+/).filter(s => s.trim().length > 30).map(s => s.trim() + '.');
  return {
    introduction: intro,
    coreIdeas: sents.slice(0, 4).length >= 2 ? sents.slice(0, 4) : [`"${title}" explores significant themes.`, `${author} presents unique perspectives.`, `Key arguments are supported by evidence.`, `The book contributes meaningfully to its field.`],
    keyTakeaways: sents.slice(4, 8).length >= 2 ? sents.slice(4, 8) : [`${title} offers valuable insights.`, `${author}'s work challenges readers.`],
    fullText: raw.trim().length > 100 ? raw.trim() : `"${title}" by ${author}. ${intro} ${rest}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      title: string; author: string; description: string; bookId?: string; categories?: string[];
    };
    const { title, author, description, bookId, categories } = body;
    if (!title || !author) return NextResponse.json({ error: 'Book title and author are required' }, { status: 400 });

    const useBookId = bookId || `${title}-${author}`.toLowerCase().replace(/\s+/g, '-');
    let cached = null;
    try {
      cached = await getBookContent(useBookId);
    } catch (err) {
      console.error('[Summary] Cache read failed:', err);
    }
    if (cached?.summary) {
      const parsed = tryParseJSON(cached.summary);
      if (parsed) return NextResponse.json(parsed);
    }

    const genreHint = categories?.length ? `\nGenres: ${categories.join(', ')}.` : '';

    const prompt = `Write a detailed summary for "${title}" by ${author}.
Description: ${description || 'No description'}${genreHint}

Important: Be specific to THIS book.
Return valid JSON:
{"introduction":"150 word intro","coreIdeas":["idea 1 about book (50 words)","idea 2","idea 3","idea 4"],"keyTakeaways":["takeaway 1 (35-40 words)","takeaway 2","takeaway 3","takeaway 4"],"fullText":"up to 500 word summary"}
JSON only, no markdown.`;

    let summary: AISummary | null = null;
    let rawContent = '';

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const completion = await chatWithFallback(
          [
            { role: 'system', content: 'Write UNIQUE, SPECIFIC book summaries. Mention title and author. JSON only.' },
            { role: 'user', content: prompt },
          ],
          { model: 'llama-3.1-8b-instant', temperature: 0.5, max_tokens: 4000 }
        );
        rawContent = completion.choices[0]?.message?.content || '';
        summary = tryParseJSON(rawContent);
        if (summary) break;
      } catch (err) {
        console.error(`[Summary] Attempt ${attempt + 1}:`, err);
        const e = err as Error & { status?: number };
        if (e.status !== 429 && e.status !== 401 && e.status !== undefined) {
          return NextResponse.json({ error: `AI error: ${e.message}` }, { status: 502 });
        }
        if (attempt < 1) {
          const waitMs = e.status === 429 ? 7000 : 2000;
          await new Promise(resolve => setTimeout(resolve, waitMs));
        }
      }
    }

    if (!summary && rawContent.length > 50) summary = buildFallback(title, author, rawContent);
    if (!summary) return NextResponse.json({ error: 'Failed to generate summary. Please try again.' }, { status: 500 });

    if (summary) {
      try {
        await updateBookContent(useBookId, { summary: JSON.stringify(summary) });
      } catch (err) {
        console.error('[Summary] Cache save failed:', err);
      }
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[Summary API] Fatal:', error);
    const e = error as Error & { status?: number };
    if (e.status) return NextResponse.json({ error: e.message }, { status: e.status > 499 ? 502 : e.status });
    return NextResponse.json({ error: 'Failed to generate summary. Please try again later.' }, { status: 500 });
  }
}