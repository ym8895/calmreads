import { NextRequest, NextResponse } from 'next/server';
import type { Slide } from '@/lib/types';
import ZAI from 'z-ai-web-dev-sdk';

function tryParseSlides(content: string): Slide[] | null {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length >= 3 && parsed.every(s => s.title && Array.isArray(s.points) && s.points.length >= 3)) {
      return parsed as Slide[];
    }
  } catch {}
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length >= 3 && parsed.every(s => s.title && Array.isArray(s.points) && s.points.length >= 3)) {
        return parsed as Slide[];
      }
    } catch {}
  }
  try {
    const fixed = cleaned.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
    const parsed = JSON.parse(fixed);
    if (Array.isArray(parsed) && parsed.length >= 3 && parsed.every(s => s.title && Array.isArray(s.points) && s.points.length >= 3)) {
      return parsed as Slide[];
    }
  } catch {}
  return null;
}

function buildSlidesFromRawText(rawText: string, bookTitle?: string): Slide[] {
  const sentences = rawText.split(/[.!?]+/).filter(s => s.trim().length > 20).map(s => s.trim() + '.');
  const title = bookTitle || 'this book';
  const slides: Slide[] = [];
  const slideTitles = [
    `${title} — Overview`,
    'Introduction & Context',
    'Key Themes',
    'Core Analysis',
    'Detailed Exploration',
    'Deeper Insights',
    'Critical Perspectives',
    'Practical Applications',
    'Key Takeaways',
    'Conclusions & Recommendations'
  ];
  let si = 0;
  for (let i = 0; i < 10 && si < sentences.length; i++) {
    const points = sentences.slice(si, si + 7);
    if (points.length < 2) break;
    slides.push({ title: slideTitles[i] || `Section ${i + 1}`, points });
    si += 7;
  }
  while (slides.length < 3) {
    slides.push({
      title: slideTitles[slides.length] || `Section ${slides.length + 1}`,
      points: sentences.length > 0 ? sentences.slice(0, 5) : ['Content analysis based on the book summary.', 'Further details available in the full summary.'],
    });
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

    const zai = await ZAI.create();
    const bookRef = bookTitle ? `"${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''}` : 'this book';

    const prompt = `Create exactly 10 UNIQUE, BOOK-SPECIFIC presentation slides for ${bookRef}.

Book Summary:
${summary.introduction}

Core Ideas:
${summary.coreIdeas.map((idea, i) => `${i + 1}. ${idea}`).join('\n')}

Key Takeaways:
${summary.keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Full Summary Text:
${summary.fullText}

CRITICAL INSTRUCTIONS:
- EVERY slide must be SPECIFIC to ${bookRef}
- DO NOT use generic titles like "Book Overview" — use titles referencing actual book content
- Reference the actual book title, author, and specific content throughout ALL slides
- Each slide: unique title (max 8 words) + 6-8 complete sentence points (15-25 words each)

Slide structure:
1. Title: "${bookTitle || 'This Book'}" with author and genre
2-3. Introduction & Background
4-6. Core Ideas (one per slide)
7-8. Key Themes & Analysis
9. Key Takeaways
10. Conclusion & Recommendations

Return ONLY a valid JSON array:
[{"title": "Slide Title", "points": ["Full sentence.", ...]}, ...]`;

    let slides: Slide[] | null = null;
    let rawContent = '';

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'Create UNIQUE, BOOK-SPECIFIC slide content. Reference actual book title and content. Respond with valid JSON arrays only.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 4000,
        });

        rawContent = completion.choices[0]?.message?.content || '';
        slides = tryParseSlides(rawContent);
        if (slides) break;
      } catch (err) {
        console.error(`[Slides API] Attempt ${attempt + 1} failed:`, err);
      }
    }

    if (!slides && rawContent.length > 50) {
      slides = buildSlidesFromRawText(rawContent, bookTitle);
    }

    if (!slides) {
      return NextResponse.json(
        { error: 'Failed to generate slides. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(slides);
  } catch (error) {
    console.error('[Slides API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate slides. Please try again later.' },
      { status: 500 }
    );
  }
}
