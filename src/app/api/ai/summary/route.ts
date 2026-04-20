import { NextRequest, NextResponse } from 'next/server';
import type { AISummary } from '@/lib/types';
import { getAI } from '@/lib/ai-client';
import { getBookContent, updateBookContent, CONTENT_VERSION } from '@/lib/supabase';

const DEFAULT_SUMMARY: AISummary = {
  introduction: 'Summary temporarily unavailable',
  coreIdeas: ['Please try again later'],
  keyTakeaways: ['Check your connection'],
  fullText: 'Summary temporarily unavailable. Please try again later.',
};

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
    coreIdeas: sents.slice(0, 4).length >= 2 ? sents.slice(0, 4) : [`"${title}" explores themes.`, `${author} presents perspectives.`],
    keyTakeaways: sents.slice(4, 8).length >= 2 ? sents.slice(4, 8) : [`${title} offers insights.`],
    fullText: raw.trim().length > 100 ? raw.trim() : `"${title}" by ${author}. ${intro}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { title, author, description, bookId } = await request.json() as {
      title: string; author: string; description: string; bookId?: string; categories?: string[];
    };
    if (!title || !author) return NextResponse.json({ error: 'Book title and author required' }, { status: 400 });
    if (!bookId) bookId = `${title}-${author}`.toLowerCase().replace(/\s+/g, '-');

    const cached = await getBookContent(bookId);
    if (cached?.summary) {
      const parsed = tryParseJSON(cached.summary);
      if (parsed) return NextResponse.json(parsed);
    }

    const zai = await getAI();

    const prompt = `Summarize "${title}" by ${author}. ${description || ''}
Return JSON: {"introduction":"50 words","coreIdeas":["40 words","40 words","40 words","40 words"],"keyTakeaways":["20 words","20 words"],"fullText":"100 words"}`;

    let summary: AISummary | null = null;

    try {
      const completion = await zai.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Concise book summaries. JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });
      const rawContent = completion.choices[0]?.message?.content || '';
      summary = tryParseJSON(rawContent);

      if (summary) {
        await updateBookContent(bookId, { summary: JSON.stringify(summary) });
      }
    } catch (err) {
      console.error('[Summary] AI error:', err);
    }

    if (!summary) {
      summary = buildFallback(title, author, '');
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[Summary API] Fatal:', error);
    return NextResponse.json(DEFAULT_SUMMARY);
  }
}