import { NextRequest, NextResponse } from 'next/server';
import type { AISummary } from '@/lib/types';

function tryParseJSON(content: string): AISummary | null {
  let cleaned = content.trim();
  // Remove markdown code blocks
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.introduction && parsed.coreIdeas && parsed.keyTakeaways && parsed.fullText) {
      return parsed as AISummary;
    }
  } catch {}
  // Try extracting JSON from surrounding text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.introduction && parsed.coreIdeas && parsed.keyTakeaways && parsed.fullText) {
        return parsed as AISummary;
      }
    } catch {}
  }
  // Try fixing common JSON issues
  try {
    // Remove trailing commas before } or ]
    const fixed = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    const parsed = JSON.parse(fixed);
    if (parsed.introduction && parsed.coreIdeas && parsed.keyTakeaways && parsed.fullText) {
      return parsed as AISummary;
    }
  } catch {}
  return null;
}

// Build a summary from raw LLM text if JSON parsing completely fails
function buildSummaryFromRawText(rawText: string, title: string, author: string): AISummary {
  // Split into paragraphs
  const paragraphs = rawText.split(/\n\n+/).filter(p => p.trim().length > 20);
  const introduction = paragraphs[0]?.trim() || `A summary of "${title}" by ${author}.`;
  
  // Split remaining into core ideas
  const remaining = paragraphs.slice(1).join('\n\n');
  const sentences = remaining.split(/[.!?]+/).filter(s => s.trim().length > 30).map(s => s.trim() + '.');
  
  const coreIdeas = sentences.slice(0, 4).map(s => s.trim());
  const keyTakeaways = sentences.slice(4, 8).map(s => s.trim());
  
  return {
    introduction,
    coreIdeas: coreIdeas.length >= 2 ? coreIdeas : [
      `${title} explores significant themes that resonate with readers interested in this genre.`,
      `The author ${author} presents unique perspectives and insights throughout the book.`,
      `Key arguments are supported by evidence and examples specific to the subject matter.`,
      `The book contributes meaningfully to its field and offers value to both new and experienced readers.`
    ],
    keyTakeaways: keyTakeaways.length >= 2 ? keyTakeaways : [
      `${title} offers valuable insights relevant to modern readers and contemporary issues.`,
      `${author}'s work challenges readers to think more deeply about the subject.`,
    ],
    fullText: rawText.trim().length > 100 ? rawText.trim() : `${title} by ${author} is a significant work in its genre. ${introduction} ${remaining}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { title, author, description, categories } = await request.json() as {
      title: string;
      author: string;
      description: string;
      categories?: string[];
    };

    if (!title || !author) {
      return NextResponse.json(
        { error: 'Book title and author are required' },
        { status: 400 }
      );
    }

    const genreHint = categories && categories.length > 0
      ? `\nThis book belongs to these genres/categories: ${categories.join(', ')}. Ensure your summary reflects the specific style, themes, and conventions of these genres.`
      : '';

    let zai;
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      zai = await ZAI.create();
    } catch (sdkErr) {
      console.error('SDK init error:', sdkErr);
      return NextResponse.json(
        { error: 'AI service is currently unavailable. Please try again in a moment.' },
        { status: 503 }
      );
    }

    const prompt = `You are an expert literary analyst. Write a UNIQUE, DETAILED, and BOOK-SPECIFIC summary for the following book.

Book: "${title}" by ${author}
About the book: ${description || 'No description available'}${genreHint}

CRITICAL INSTRUCTIONS:
- This summary MUST be specific to "${title}" by ${author}
- DO NOT write generic platitudes like "this book presents a comprehensive exploration" or "the author draws upon extensive research"
- Reference the ACTUAL title, author name, and genre-specific themes throughout
- Include SPECIFIC details about the book's unique arguments, narrative style, or contribution to its genre
- If this is fiction, mention plot elements, characters, and setting
- If this is non-fiction, mention the actual subject matter, methodology, and conclusions
- If you are unsure about specific details, be honest about it rather than writing vague generalities

Structure your response as valid JSON with this exact format:
{
  "introduction": "A 100-150 word introduction that SPECIFICALLY discusses ${title} and what makes it unique",
  "coreIdeas": ["Specific idea 1 about THIS book (40-60 words)", "Specific idea 2 about THIS book (40-60 words)", "Specific idea 3 about THIS book (40-60 words)", "Specific idea 4 about THIS book (40-60 words)"],
  "keyTakeaways": ["Specific takeaway 1 from THIS book (20-30 words)", "Specific takeaway 2 (20-30 words)", "Specific takeaway 3 (20-30 words)", "Specific takeaway 4 (20-30 words)"],
  "fullText": "A flowing 400-500 word narrative summary of ${title} that combines all sections. MUST mention the book title and author multiple times. MUST discuss the actual themes, arguments, or story of this specific book."
}

Return ONLY valid JSON, no markdown or code blocks.`;

    let summary: AISummary | null = null;
    let rawContent = '';
    let lastError: string | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a knowledgeable book summary assistant who writes UNIQUE, SPECIFIC summaries for each book. Never write generic or placeholder content. Always mention the actual book title and author in your summary. Always respond with valid JSON only.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 2000,
        });

        rawContent = completion.choices[0]?.message?.content || '';
        console.log(`[Summary API] Attempt ${attempt + 1}, raw length: ${rawContent.length}, preview: ${rawContent.substring(0, 100)}`);
        
        summary = tryParseJSON(rawContent);
        if (summary) {
          console.log('[Summary API] JSON parsed successfully');
          break;
        }

        lastError = `Failed to parse JSON from LLM response (attempt ${attempt + 1}). Raw: ${rawContent.substring(0, 200)}`;
        console.warn('[Summary API]', lastError);
      } catch (err) {
        lastError = `LLM call failed (attempt ${attempt + 1}): ${err}`;
        console.error('[Summary API]', lastError);
      }
    }

    // If JSON parsing failed but we have raw content, build a summary from it
    if (!summary && rawContent.length > 50) {
      console.log('[Summary API] Falling back to raw text extraction');
      summary = buildSummaryFromRawText(rawContent, title, author);
    }

    if (!summary) {
      console.error('[Summary API] All attempts failed:', lastError);
      return NextResponse.json(
        { error: 'Failed to generate a book-specific summary. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[Summary API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary. Please try again later.' },
      { status: 500 }
    );
  }
}
