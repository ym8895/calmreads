import { NextRequest, NextResponse } from 'next/server';
import type { Slide } from '@/lib/types';

function tryParseSlides(content: string): Slide[] | null {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length >= 3 && parsed.every(s => s.title && Array.isArray(s.points) && s.points.length >= 3)) {
      return parsed as Slide[];
    }
  } catch {}
  // Try extracting JSON array from surrounding text
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length >= 3 && parsed.every(s => s.title && Array.isArray(s.points) && s.points.length >= 3)) {
        return parsed as Slide[];
      }
    } catch {}
  }
  // Fix trailing commas
  try {
    const fixed = cleaned.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
    const parsed = JSON.parse(fixed);
    if (Array.isArray(parsed) && parsed.length >= 3 && parsed.every(s => s.title && Array.isArray(s.points) && s.points.length >= 3)) {
      return parsed as Slide[];
    }
  } catch {}
  return null;
}

// Build slides from raw text if JSON parsing fails
function buildSlidesFromRawText(rawText: string, bookTitle?: string): Slide[] {
  const sentences = rawText.split(/[.!?]+/).filter(s => s.trim().length > 20).map(s => s.trim() + '.');
  const title = bookTitle || 'this book';
  
  // Split sentences into groups of 6-8 for slides
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
  
  let sentenceIdx = 0;
  for (let i = 0; i < 10 && sentenceIdx < sentences.length; i++) {
    const points = sentences.slice(sentenceIdx, sentenceIdx + 7);
    if (points.length < 2) break;
    slides.push({
      title: slideTitles[i] || `Section ${i + 1}`,
      points
    });
    sentenceIdx += 7;
  }
  
  // Ensure we have at least 3 slides
  while (slides.length < 3) {
    slides.push({
      title: slideTitles[slides.length] || `Section ${slides.length + 1}`,
      points: sentences.length > 0 ? sentences.slice(0, 5) : ['Content analysis continues based on the book summary.', 'Further details available in the full summary.']
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
      return NextResponse.json(
        { error: 'Summary text is required' },
        { status: 400 }
      );
    }

    let zai;
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      zai = await ZAI.create();
    } catch (sdkErr) {
      console.error('[Slides API] SDK init error:', sdkErr);
      return NextResponse.json(
        { error: 'AI service is currently unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }

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
1. Title slide: "${bookTitle || 'This Book'}" — include author and genre context
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
    let rawContent = '';
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

        rawContent = completion.choices[0]?.message?.content || '';
        console.log(`[Slides API] Attempt ${attempt + 1}, raw length: ${rawContent.length}`);

        slides = tryParseSlides(rawContent);
        if (slides) {
          console.log(`[Slides API] Parsed ${slides.length} slides successfully`);
          break;
        }

        lastError = `Failed to parse slides JSON (attempt ${attempt + 1}). Raw: ${rawContent.substring(0, 200)}`;
        console.warn('[Slides API]', lastError);
      } catch (err) {
        lastError = `LLM call failed (attempt ${attempt + 1}): ${err}`;
        console.error('[Slides API]', lastError);
      }
    }

    // If JSON parsing failed but we have raw content, build slides from it
    if (!slides && rawContent.length > 50) {
      console.log('[Slides API] Falling back to raw text extraction');
      slides = buildSlidesFromRawText(rawContent, bookTitle);
    }

    if (!slides) {
      console.error('[Slides API] All attempts failed:', lastError);
      return NextResponse.json(
        { error: 'Failed to generate book-specific slides. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(slides);
  } catch (error) {
    console.error('[Slides API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to generate slides. Please try again later.' },
      { status: 500 }
    );
  }
}
