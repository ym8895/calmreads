import { NextRequest, NextResponse } from 'next/server';
import type { Slide } from '@/lib/types';
import { getAI } from '@/lib/ai-client';

function tryParseSlides(content: string): Slide[] | null {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length >= 3 && parsed.every(s => s.title && Array.isArray(s.points) && s.points.length >= 3)) return parsed;
  } catch {}
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length >= 3 && parsed.every(s => s.title && Array.isArray(s.points) && s.points.length >= 3)) return parsed;
    } catch {}
  }
  try {
    const fixed = cleaned.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
    const parsed = JSON.parse(fixed);
    if (Array.isArray(parsed) && parsed.length >= 3 && parsed.every(s => s.title && Array.isArray(s.points) && s.points.length >= 3)) return parsed;
  } catch {}
  return null;
}

function buildSlidesFromRaw(rawText: string, bookTitle?: string): Slide[] {
  const sentences = rawText.split(/[.!?]+/).filter(s => s.trim().length > 20).map(s => s.trim() + '.');
  const title = bookTitle || 'this book';
  const slides: Slide[] = [];
  const titles = [`${title}`, 'Background', 'Key Themes', 'Analysis', 'Details', 'Insights', 'Perspectives', 'Applications', 'Takeaways', 'Conclusion'];
  let si = 0;
  for (let i = 0; i < 10 && si < sentences.length; i++) {
    const pts = sentences.slice(si, si + 7);
    if (pts.length < 2) break;
    slides.push({ title: titles[i], points: pts });
    si += 7;
  }
  while (slides.length < 3) {
    slides.push({ title: titles[slides.length], points: sentences.length > 0 ? sentences.slice(0, 5) : ['Content based on book summary.'] });
  }
  return slides;
}

export async function POST(request: NextRequest) {
  try {
    const { summary, bookTitle, bookAuthor } = await request.json() as {
      summary: { fullText: string; introduction: string; coreIdeas: string[]; keyTakeaways: string[] };
      bookTitle?: string;
      bookAuthor?: string;
    };

    if (!summary?.fullText) {
      return NextResponse.json({ error: 'Summary text is required' }, { status: 400 });
    }

    const zai = await getAI();
    const bookRef = bookTitle ? `"${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''}` : 'this book';

    const prompt = `Create 10 UNIQUE, BOOK-SPECIFIC slides for ${bookRef}.

Summary: ${summary.introduction}
Core Ideas: ${summary.coreIdeas.join(' | ')}
Takeaways: ${summary.keyTakeaways.join(' | ')}
Full Text: ${summary.fullText}

CRITICAL: Every slide MUST be specific to ${bookRef}. Reference actual title, author, content.
Each slide: unique title (max 8 words) + 6-8 sentence points (15-25 words each).

Return ONLY valid JSON array:
[{"title": "Slide Title", "points": ["Full sentence.", ...]}, ...]`;

    let slides: Slide[] | null = null;
    let rawContent = '';

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'Create UNIQUE, BOOK-SPECIFIC slides. Reference actual book. JSON arrays only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 4000,
        });
        rawContent = completion.choices[0]?.message?.content || '';
        slides = tryParseSlides(rawContent);
        if (slides) break;
      } catch (err) {
        console.error(`[Slides] Attempt ${attempt + 1} error:`, err);
      }
    }

    if (!slides && rawContent.length > 50) {
      slides = buildSlidesFromRaw(rawContent, bookTitle);
    }

    if (!slides) {
      return NextResponse.json({ error: 'Failed to generate slides. Please try again.' }, { status: 500 });
    }

    return NextResponse.json(slides);
  } catch (error) {
    console.error('[Slides API] Fatal error:', error);
    return NextResponse.json({ error: 'Failed to generate slides. Please try again later.' }, { status: 500 });
  }
}
