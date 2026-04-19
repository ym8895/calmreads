import { NextRequest, NextResponse } from 'next/server';
import type { Slide } from '@/lib/types';

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
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { summary, bookTitle, bookAuthor } = await request.json() as {
      summary: { fullText: string; introduction: string; coreIdeas: string[]; keyTakeaways: string[] };
      bookTitle?: string;
      bookAuthor?: string;
    };

    if (!summary?.fullText) {
      return NextResponse.json(
        { error: 'Summary text is required' },
        { status: 400 }
      );
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
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
- DO NOT use generic titles like "Book Overview" or "Key Themes" — use titles that reference the actual book content
- DO NOT use generic points like "the author draws upon extensive research" — be SPECIFIC
- Reference the actual book title, author, and specific content throughout ALL slides
- Each slide must have a UNIQUE title (max 8 words)
- Each slide must have 6-8 points, each a complete sentence of 15-25 words
- Points must contain REAL substance from the summary — no filler text

Slide structure:
1. Title slide: "${bookTitle}" — include author and genre context
2-3. Introduction & Background: specific to this book's context
4-6. Core Ideas: each slide covers one core idea in depth with specific details
7-8. Key Themes & Analysis: genre-specific analysis of the book's themes
9. Key Takeaways: actionable insights specific to this book
10. Conclusion: final thoughts and recommendations specific to this book

Return ONLY a valid JSON array, no markdown:
[
  {"title": "Specific Slide Title", "points": ["Full sentence with specific detail.", "Another sentence with book-specific content.", ...]},
  ...
]`;

    let slides: Slide[] | null = null;
    let lastError: string | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are a presentation designer who creates UNIQUE, BOOK-SPECIFIC slide content. Never use generic placeholders. Always reference the actual book title and specific content in every slide. Always respond with valid JSON arrays only.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 4000,
        });

        const content = completion.choices[0]?.message?.content || '';
        slides = tryParseSlides(content);
        if (slides) break;

        lastError = `Failed to parse slides JSON (attempt ${attempt + 1})`;
      } catch (err) {
        lastError = `LLM call failed (attempt ${attempt + 1}): ${err}`;
      }
    }

    if (!slides) {
      console.error('Slides generation failed:', lastError);
      return NextResponse.json(
        { error: 'Failed to generate book-specific slides. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(slides);
  } catch (error) {
    console.error('Error generating slides:', error);
    return NextResponse.json(
      { error: 'Failed to generate slides. Please try again later.' },
      { status: 500 }
    );
  }
}
