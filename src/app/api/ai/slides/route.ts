import { NextRequest, NextResponse } from 'next/server';
import type { Slide } from '@/lib/types';
import { getAI } from '@/lib/ai-client';

function tryParseSlides(content: string): Slide[] | null {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  try {
    const p = JSON.parse(cleaned);
    if (Array.isArray(p) && p.length >= 3 && p.every(s => s.title && Array.isArray(s.points) && s.points.length >= 3)) return p;
  } catch {}
  const m = cleaned.match(/\[[\s\S]*\]/);
  if (m) {
    try {
      const p = JSON.parse(m[0]);
      if (Array.isArray(p) && p.length >= 3 && p.every(s => s.title && Array.isArray(s.points) && s.points.length >= 3)) return p;
    } catch {}
  }
  try {
    const p = JSON.parse(cleaned.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}'));
    if (Array.isArray(p) && p.length >= 3 && p.every(s => s.title && Array.isArray(s.points) && s.points.length >= 3)) return p;
  } catch {}
  return null;
}

function buildFallbackSlides(raw: string, title?: string): Slide[] {
  const sents = raw.split(/[.!?]+/).filter(s => s.trim().length > 20).map(s => s.trim() + '.');
  const t = title || 'this book';
  const slides: Slide[] = [];
  const names = [`${t}`, 'Background', 'Key Themes', 'Analysis', 'Details', 'Insights', 'Perspectives', 'Applications', 'Takeaways', 'Conclusion'];
  let si = 0;
  for (let i = 0; i < 10 && si < sents.length; i++) {
    const pts = sents.slice(si, si + 7);
    if (pts.length < 2) break;
    slides.push({ title: names[i], points: pts });
    si += 7;
  }
  while (slides.length < 3) slides.push({ title: names[slides.length], points: sents.length ? sents.slice(0, 5) : ['Content from book summary.'] });
  return slides;
}

export async function POST(request: NextRequest) {
  try {
    const { summary, bookTitle, bookAuthor } = await request.json() as {
      summary: { fullText: string; introduction: string; coreIdeas: string[]; keyTakeaways: string[] };
      bookTitle?: string; bookAuthor?: string;
    };
    if (!summary?.fullText) return NextResponse.json({ error: 'Summary text is required' }, { status: 400 });

    const zai = await getAI();
    const bookRef = bookTitle ? `"${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''}` : 'this book';

    const prompt = `Create 10 UNIQUE slides for ${bookRef}.
Summary: ${summary.introduction}
Ideas: ${summary.coreIdeas.join(' | ')}
Takeaways: ${summary.keyTakeaways.join(' | ')}
Full: ${summary.fullText}

CRITICAL: Every slide specific to ${bookRef}. Each: title + 6-8 sentence points (15-25 words).
Return ONLY JSON array: [{"title":"...","points":["...","..."]}, ...]`;

    let slides: Slide[] | null = null;
    let rawContent = '';

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'Create UNIQUE, BOOK-SPECIFIC slides. JSON arrays only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 4000,
        });
        rawContent = completion.choices[0]?.message?.content || '';
        slides = tryParseSlides(rawContent);
        if (slides) break;
      } catch (err) {
        console.error(`[Slides] Attempt ${attempt + 1}:`, err);
      }
    }

    if (!slides && rawContent.length > 50) slides = buildFallbackSlides(rawContent, bookTitle);
    if (!slides) return NextResponse.json({ error: 'Failed to generate slides. Please try again.' }, { status: 500 });

    return NextResponse.json(slides);
  } catch (error) {
    console.error('[Slides API] Fatal:', error);
    return NextResponse.json({ error: 'Failed to generate slides. Please try again later.' }, { status: 500 });
  }
}
