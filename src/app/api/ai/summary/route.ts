import { NextRequest, NextResponse } from 'next/server';
import type { AISummary } from '@/lib/types';
import { getAI } from '@/lib/ai-client';

function tryParseJSON(content: string): AISummary | null {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.introduction && parsed.coreIdeas && parsed.keyTakeaways && parsed.fullText) {
      return parsed as AISummary;
    }
  } catch {}
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.introduction && parsed.coreIdeas && parsed.keyTakeaways && parsed.fullText) {
        return parsed as AISummary;
      }
    } catch {}
  }
  try {
    const fixed = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    const parsed = JSON.parse(fixed);
    if (parsed.introduction && parsed.coreIdeas && parsed.keyTakeaways && parsed.fullText) {
      return parsed as AISummary;
    }
  } catch {}
  return null;
}

function buildSummaryFromRawText(rawText: string, title: string, author: string): AISummary {
  const paragraphs = rawText.split(/\n\n+/).filter(p => p.trim().length > 20);
  const introduction = paragraphs[0]?.trim() || `A summary of "${title}" by ${author}.`;
  const remaining = paragraphs.slice(1).join('\n\n');
  const sentences = remaining.split(/[.!?]+/).filter(s => s.trim().length > 30).map(s => s.trim() + '.');
  const coreIdeas = sentences.slice(0, 4).map(s => s.trim());
  const keyTakeaways = sentences.slice(4, 8).map(s => s.trim());
  return {
    introduction,
    coreIdeas: coreIdeas.length >= 2 ? coreIdeas : [
      `"${title}" by ${author} explores significant themes that resonate with readers.`,
      `The author presents unique perspectives and insights throughout the book.`,
      `Key arguments are supported by evidence and examples specific to the subject matter.`,
      `The book contributes meaningfully to its field and offers value to readers.`,
    ],
    keyTakeaways: keyTakeaways.length >= 2 ? keyTakeaways : [
      `"${title}" offers valuable insights relevant to modern readers.`,
      `${author}'s work challenges readers to think more deeply about the subject.`,
    ],
    fullText: rawText.trim().length > 100 ? rawText.trim() : `"${title}" by ${author} is a significant work. ${introduction} ${remaining}`,
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
      return NextResponse.json({ error: 'Book title and author are required' }, { status: 400 });
    }

    const genreHint = categories && categories.length > 0
      ? `\nGenres: ${categories.join(', ')}. Reflect these genres in your summary.`
      : '';

    const zai = await getAI();

    const prompt = `Write a UNIQUE, BOOK-SPECIFIC summary for "${title}" by ${author}.
About: ${description || 'No description available'}${genreHint}

CRITICAL: Must be specific to THIS book. Reference the title and author throughout.
If fiction: mention plot, characters, setting.
If non-fiction: mention subject, methodology, conclusions.

Return valid JSON:
{
  "introduction": "100-150 word intro about THIS specific book",
  "coreIdeas": ["Specific idea 1 (40-60 words)", "Specific idea 2", "Specific idea 3", "Specific idea 4"],
  "keyTakeaways": ["Takeaway 1 (20-30 words)", "Takeaway 2", "Takeaway 3", "Takeaway 4"],
  "fullText": "400-500 word flowing narrative about ${title} by ${author}"
}

JSON only, no markdown.`;

    let summary: AISummary | null = null;
    let rawContent = '';

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'You write UNIQUE, SPECIFIC book summaries. Always mention the book title and author. JSON only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 2000,
        });
        rawContent = completion.choices[0]?.message?.content || '';
        summary = tryParseJSON(rawContent);
        if (summary) break;
      } catch (err) {
        console.error(`[Summary] Attempt ${attempt + 1} error:`, err);
      }
    }

    if (!summary && rawContent.length > 50) {
      summary = buildSummaryFromRawText(rawContent, title, author);
    }

    if (!summary) {
      return NextResponse.json({ error: 'Failed to generate summary. Please try again.' }, { status: 500 });
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[Summary API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary. Please try again later.' },
      { status: 500 }
    );
  }
}
