import { NextRequest, NextResponse } from 'next/server';
import type { Slide } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { summary } = await request.json() as { summary: { fullText: string; introduction: string; coreIdeas: string[]; keyTakeaways: string[] } };

    if (!summary?.fullText) {
      return NextResponse.json(
        { error: 'Summary text is required' },
        { status: 400 }
      );
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const prompt = `Based on this book summary, create exactly 10 presentation slides.

Book Summary:
Title Context: ${summary.introduction}
Core Ideas: ${summary.coreIdeas.join(' | ')}
Key Takeaways: ${summary.keyTakeaways.join(' | ')}
Full Summary: ${summary.fullText}

IMPORTANT RULES:
- Create EXACTLY 10 slides
- Slide 1: Title slide with book theme
- Slides 2-4: Cover introduction and context
- Slides 5-7: Cover core ideas
- Slides 8-9: Cover key takeaways
- Slide 10: Conclusion / final thoughts
- Each slide must have a "title" (string) and "points" (array of 3-4 strings)
- Keep points concise (10-15 words each)
- Use clear, professional language
- Return ONLY valid JSON array, no markdown

Format:
[
  {"title": "Slide Title", "points": ["Point 1", "Point 2", "Point 3"]},
  ...
]`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a presentation designer. Create clear, well-structured slide content. Always respond with valid JSON arrays only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || '';

    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    const slides: Slide[] = JSON.parse(cleaned);

    if (!Array.isArray(slides) || slides.length < 3) {
      throw new Error('Invalid slides structure');
    }

    return NextResponse.json(slides);
  } catch (error) {
    console.error('Error generating slides:', error);

    // Fallback slides
    return NextResponse.json([
      { title: 'Book Overview', points: ['Exploration of fundamental concepts', 'Bridging theory and practice', 'Accessible to all readers'] },
      { title: 'Key Themes', points: ['Understanding complexity through simplicity', 'Evidence-based reasoning', 'Interdisciplinary connections'] },
      { title: 'Central Argument', points: ['Challenges conventional thinking', 'Presents alternative frameworks', 'Supported by research data'] },
      { title: 'Background & Context', points: ['Built on decades of research', 'Draws from multiple disciplines', 'Addresses modern challenges'] },
      { title: 'Core Concept 1', points: ['Foundational principles explained', 'Practical applications shown', 'Common misconceptions addressed'] },
      { title: 'Core Concept 2', points: ['Structured thinking approach', 'Decision-making framework', 'Real-world implementation'] },
      { title: 'Core Concept 3', points: ['Growth through challenges', 'Learning from diverse perspectives', 'Continuous improvement cycle'] },
      { title: 'Key Takeaway 1', points: ['Theory meets practice', 'Actionable insights daily', 'Measurable personal growth'] },
      { title: 'Key Takeaway 2', points: ['Critical thinking is essential', 'Question established norms', 'Embrace complexity'] },
      { title: 'Final Thoughts', points: ['A valuable contribution to the field', 'Suitable for all levels', 'Both introduction and reference'] },
    ]);
  }
}
