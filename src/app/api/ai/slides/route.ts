import { NextRequest, NextResponse } from 'next/server';
import type { Slide } from '@/lib/types';
import { chatWithFallback, setUsageLogger, setUsageContext, clearUsageContext } from '@/lib/ai-client';
import { getUsageLogger } from '@/lib/usage-logger';
import { getBookContent, updateBookContent } from '@/lib/supabase';

setUsageLogger(getUsageLogger());

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
    const body = await request.json() as {
      summary: { fullText: string; introduction: string; coreIdeas: string[]; keyTakeaways: string[] };
      bookTitle?: string; bookAuthor?: string; bookId?: string;
    };
    const { summary, bookTitle, bookAuthor } = body;
    let bookId = body.bookId;
    
    if (!summary?.fullText) return NextResponse.json({ error: 'Summary text is required' }, { status: 400 });
    if (!bookId && bookTitle) bookId = `${bookTitle}-${bookAuthor}`.toLowerCase().replace(/\s+/g, '-');

    // Set usage context for tracking which book
    if (bookTitle) setUsageContext({ bookTitle, bookAuthor: bookAuthor || 'Unknown' });

    if (bookId) {
      const cached = await getBookContent(bookId);
      if (cached?.slides) {
        const parsed = tryParseSlides(cached.slides);
        if (parsed) return NextResponse.json(parsed);
      }
}
    
const prompt = `Create 8 slides for "${bookTitle}" by ${bookAuthor}.
Use ideas: ${summary.coreIdeas.join(', ')}
Each slide: title + 5 meaningful points (15-20 words).
Return JSON: [{"title":"slide","points":["point1","point2","point3","point4","point5"]},...]`;

    let slides: Slide[] | null = null;
    let rawContent = '';

    try {
      const completion = await chatWithFallback(
        [
          { role: 'system', content: 'Create UNIQUE, BOOK-SPECIFIC slides. JSON arrays only.' },
          { role: 'user', content: prompt },
        ],
        { model: 'llama-3.1-8b-instant', temperature: 0.4, max_tokens: 4000, endpoint: 'slides' }
      );
      rawContent = completion.choices[0]?.message?.content || '';
      slides = tryParseSlides(rawContent);
    } catch (err) {
      console.error('[Slides] Error:', err);
      const e = err as Error & { status?: number };
      if (e.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 7000));
        try {
          const completion = await chatWithFallback(
            [
              { role: 'system', content: 'Create UNIQUE, BOOK-SPECIFIC slides. JSON arrays only.' },
              { role: 'user', content: prompt },
            ],
            { model: 'llama-3.1-8b-instant', temperature: 0.4, max_tokens: 4000, endpoint: 'slides' }
          );
          rawContent = completion.choices[0]?.message?.content || '';
          slides = tryParseSlides(rawContent);
        } catch (retryErr) {
          console.error('[Slides] Retry error:', retryErr);
        }
      }
    }

    if (!slides && rawContent.length > 50) slides = buildFallbackSlides(rawContent, bookTitle);
    if (!slides) return NextResponse.json({ error: 'Failed to generate slides. Please try again.' }, { status: 500 });

    if (slides && bookId) {
      try {
        await updateBookContent(bookId, { slides: JSON.stringify(slides) });
      } catch (err) {
        console.error('[Slides] Cache save failed:', err);
      }
    }

    clearUsageContext();
    return NextResponse.json(slides);
  } catch (error) {
    clearUsageContext();
    console.error('[Slides API] Fatal:', error);
    return NextResponse.json({ error: 'Failed to generate slides. Please try again later.' }, { status: 500 });
  }
}
