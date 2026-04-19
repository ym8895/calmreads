import { NextRequest, NextResponse } from 'next/server';
import type { AISummary } from '@/lib/types';
import ZAI from 'z-ai-web-dev-sdk';

function tryParseJSON(content: string): AISummary | null {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
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

let cachedAI: Awaited<ReturnType<typeof ZAI.create>> | null = null;

export async function POST(request: NextRequest) {
  try {
    const { title, author, description, categories } = await request.json() as {
      title: string; author: string; description: string; categories?: string[];
    };
    if (!title || !author) return NextResponse.json({ error: 'Book title and author are required' }, { status: 400 });

    const genreHint = categories?.length ? `\nGenres: ${categories.join(', ')}.` : '';
    if (!cachedAI) cachedAI = await ZAI.create();

    const prompt = `Write a UNIQUE, BOOK-SPECIFIC summary for "${title}" by ${author}.
About: ${description || 'No description'}${genreHint}

CRITICAL: Must be specific to THIS book. Reference title and author throughout.
Return valid JSON:
{"introduction":"100-150 word intro","coreIdeas":["idea1 (40-60 words)","idea2","idea3","idea4"],"keyTakeaways":["t1 (20-30 words)","t2","t3","t4"],"fullText":"400-500 word narrative about ${title} by ${author}"}
JSON only, no markdown.`;

    let summary: AISummary | null = null;
    let rawContent = '';

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const completion = await cachedAI.chat.completions.create({
          messages: [
            { role: 'system', content: 'Write UNIQUE, SPECIFIC book summaries. Mention title and author. JSON only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 2000,
        });
        rawContent = completion.choices[0]?.message?.content || '';
        summary = tryParseJSON(rawContent);
        if (summary) break;
      } catch (err) {
        console.error(`[Summary] Attempt ${attempt + 1}:`, err);
      }
    }

    if (!summary && rawContent.length > 50) summary = buildFallback(title, author, rawContent);
    if (!summary) return NextResponse.json({ error: 'Failed to generate summary. Please try again.' }, { status: 500 });

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[Summary API] Fatal:', error);
    return NextResponse.json({ error: 'Failed to generate summary. Please try again later.' }, { status: 500 });
  }
}
