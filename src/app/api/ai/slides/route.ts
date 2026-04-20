import { NextRequest, NextResponse } from 'next/server';
import type { Slide } from '@/lib/types';
import { getAI } from '@/lib/ai-client';
import { getBookContent, updateBookContent } from '@/lib/supabase';

const DEFAULT_SLIDES: Slide[] = [
  { title: 'Summary', points: ['Content unavailable'] },
  { title: 'Details', points: ['Please try again'] },
  { title: 'Conclusion', points: ['Check connection'] },
];

function tryParseSlides(content: string): Slide[] | null {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  try {
    const p = JSON.parse(cleaned);
    if (Array.isArray(p) && p.length >= 3 && p.every(s => s.title && Array.isArray(s.points))) return p;
  } catch {}
  const m = cleaned.match(/\[[\s\S]*\]/);
  if (m) {
    try {
      const p = JSON.parse(m[0]);
      if (Array.isArray(p) && p.length >= 3 && p.every(s => s.title && Array.isArray(s.points))) return p;
    } catch {}
  }
  try {
    const p = JSON.parse(cleaned.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}'));
    if (Array.isArray(p) && p.length >= 3 && p.every(s => s.title && Array.isArray(s.points))) return p;
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
  while (slides.length < 3) slides.push({ title: names[slides.length], points: sents.length ? sents.slice(0, 5) : ['Content from book.'] });
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
    
    if (!summary?.fullText) return NextResponse.json({ error: 'Summary text required' }, { status: 400 });
    if (!bookId && bookTitle) bookId = `${bookTitle}-${bookAuthor}`.toLowerCase().replace(/\s+/g, '-');

    if (bookId) {
      const cached = await getBookContent(bookId);
      if (cached?.slides) {
        const parsed = tryParseSlides(cached.slides);
        if (parsed) return NextResponse.json(parsed);
      }
    }

    const zai = await getAI();
    const bookRef = bookTitle ? `"${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''}` : 'this book';

    const prompt = `Create 10 detailed slides for "${bookTitle}" by ${bookAuthor || 'Unknown'}.

Make each slide informative with real content from the book. Each slide should have:
- title: Clear descriptive title
- points: Array of 6 meaningful points

Example format (return ONLY this, no markdown):
[{"title":"Title","points":["detailed point 1","detailed point 2","detailed point 3","detailed point 4","detailed point 5","detailed point 6"]},...]`;

    let slides: Slide[] | null = null;

    try {
      const completion = await zai.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Create book slides. JSON arrays only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 3500,
      });
      const rawContent = completion.choices[0]?.message?.content || '';
      slides = tryParseSlides(rawContent);

      if (slides && bookId) {
        await updateBookContent(bookId, { slides: JSON.stringify(slides) });
      }
    } catch (err) {
      // Silent fail - will use fallback
    }

    if (!slides) slides = buildFallbackSlides('', bookTitle);
    if (!slides) return NextResponse.json(DEFAULT_SLIDES);

    return NextResponse.json(slides);
  } catch (error) {
    console.error('[Slides API] Fatal:', error);
    return NextResponse.json(DEFAULT_SLIDES);
  }
}