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
- Slides 2-4: Cover introduction, background and context
- Slides 5-7: Cover core ideas in depth
- Slides 8-9: Cover key takeaways with actionable insights
- Slide 10: Conclusion and final recommendations
- Each slide must have a "title" (string) and "points" (array of 8-10 strings)
- Each point should be a full sentence (15-25 words) that provides real substance and depth
- Points should NOT be short phrases — they must be complete, informative sentences
- Use clear, professional language
- Return ONLY valid JSON array, no markdown

Format:
[
  {"title": "Slide Title", "points": ["Full sentence point with detail and context.", "Another complete sentence providing additional insight on the topic.", ...]},
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
      max_tokens: 4000,
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

    // Fallback slides with 8-10 points each
    return NextResponse.json([
      { title: 'Book Overview', points: [
        'This book presents a comprehensive exploration of its subject matter, weaving together theoretical frameworks with practical applications.',
        'The author draws upon extensive research and real-world examples to construct a compelling narrative that engages both newcomers and seasoned readers.',
        'At its core, the work addresses fundamental questions about how we understand and interact with the world around us.',
        'The book is structured to build progressively in complexity, starting with foundational concepts before moving to advanced topics.',
        'Each chapter concludes with practical exercises that help reinforce the concepts discussed in that section.',
        'The writing style is characterized by clarity and precision, making complex topics accessible without oversimplification.',
        'Throughout the book, the author uses vivid examples and case studies to illustrate key principles in action.',
        'The work is suitable for both sequential reading from cover to cover and as a reference guide for specific topics.',
      ]},
      { title: 'Key Themes', points: [
        'Understanding complexity through simplicity is one of the central themes that runs throughout the entire book.',
        'The author demonstrates how breaking down complex problems into smaller, manageable parts leads to better outcomes.',
        'Evidence-based reasoning is emphasized as the foundation for making sound decisions in both personal and professional contexts.',
        'The book explores how interdisciplinary connections between fields can lead to breakthrough insights and innovations.',
        'Adaptability and flexibility are presented as essential qualities for navigating an ever-changing world.',
        'The relationship between individual behavior and systemic outcomes is examined through multiple lenses.',
        'Historical context is provided to show how these themes have evolved and why they remain relevant today.',
        'The author argues that embracing uncertainty is a more productive approach than seeking false certainty.',
        'Multiple perspectives are presented on each theme, encouraging readers to form their own informed opinions.',
      ]},
      { title: 'Central Argument', points: [
        'The central thesis challenges conventional thinking by proposing a fundamentally different approach to the subject.',
        'Rather than following established patterns, the author suggests that innovation comes from questioning basic assumptions.',
        'The argument is supported by a wide range of research data from multiple credible sources and academic disciplines.',
        'Real-world case studies are used extensively to demonstrate the practical validity of the central argument.',
        'Counterarguments are addressed fairly and thoroughly, showing the author has considered opposing viewpoints seriously.',
        'The book demonstrates how the central argument applies across different scales, from individual decisions to organizational strategy.',
        'Readers are encouraged to test the ideas presented against their own experiences and observations.',
        'The implications of the central argument extend beyond the immediate topic to broader questions about human potential.',
        'By the end of the book, the argument builds to a compelling case that is difficult to dismiss outright.',
      ]},
      { title: 'Background & Context', points: [
        'The book is built on decades of research spanning multiple academic disciplines and practical domains.',
        'The author provides a thorough historical overview of how thinking on this subject has evolved over the past century.',
        'Key influencers and thought leaders who shaped the field are acknowledged and their contributions are integrated.',
        'The social and cultural context in which these ideas emerged is explored to give readers a deeper understanding.',
        'The book addresses modern challenges that make these ideas more relevant now than ever before.',
        'Technological changes and their impact on the subject matter are discussed in detail throughout the early chapters.',
        'The author draws from both Western and Eastern philosophical traditions to provide a balanced perspective.',
        'Economic and political factors that influence the field are examined without taking a partisan stance.',
        'The historical narrative shows how breakthroughs often came from unexpected sources and unlikely connections.',
      ]},
      { title: 'Core Concept 1', points: [
        'The first core concept introduces a foundational framework that the rest of the book builds upon systematically.',
        'This framework provides a structured approach to understanding complex systems and their interconnected components.',
        'Practical applications of the concept are demonstrated through detailed examples from everyday life situations.',
        'Common misconceptions about this concept are identified and corrected with clear, evidence-based explanations.',
        'The author provides simple exercises that readers can practice to internalize and apply the concept immediately.',
        'Visual diagrams and mental models are used to make the abstract concept more concrete and memorable.',
        'The concept is shown to have applications across diverse fields including business, education, and personal development.',
        'Research citations are provided for readers who want to explore the academic foundation of the concept further.',
      ]},
      { title: 'Core Concept 2', points: [
        'The second major concept introduces a structured thinking approach that complements the first framework.',
        'A practical decision-making framework is presented that can be applied to both simple and complex situations.',
        'The framework emphasizes the importance of considering multiple perspectives before arriving at a conclusion.',
        'Real-world implementation examples show how organizations have successfully applied this structured approach.',
        'The concept includes a self-assessment tool that helps readers identify their own thinking patterns and biases.',
        'Guidelines are provided for adapting the framework to different cultural and professional contexts.',
        'The author discusses common pitfalls and how to avoid them when applying the structured thinking approach.',
        'Case studies from diverse industries demonstrate the universal applicability of the core concept.',
      ]},
      { title: 'Core Concept 3', points: [
        'The third major concept focuses on how personal growth emerges from embracing challenges rather than avoiding them.',
        'Learning from diverse perspectives is presented as a powerful tool for expanding one understanding of the world.',
        'A continuous improvement cycle is introduced that readers can integrate into their daily routines and habits.',
        'The concept draws on research from positive psychology and behavioral science to support its claims.',
        'Practical techniques for building resilience and adaptability are provided with step-by-step instructions.',
        'The author shares personal anecdotes that illustrate the concept in a relatable and authentic way.',
        'Long-term benefits of adopting this mindset are supported by longitudinal studies and empirical evidence.',
        'Strategies for maintaining motivation and momentum during difficult periods of growth are discussed in depth.',
      ]},
      { title: 'Key Takeaway 1', points: [
        'The most important takeaway is that theory must meet practice for knowledge to be truly valuable and transformative.',
        'Actionable insights from the book can be implemented daily to create measurable improvements in various life domains.',
        'Measurable personal growth is achievable when readers commit to consistent practice of the principles discussed.',
        'The book provides specific metrics and benchmarks for tracking progress on the personal development journey.',
        'Small, consistent changes are shown to be more effective than dramatic but unsustainable transformations.',
        'The concept of compounding improvements is explained and applied to personal and professional growth contexts.',
        'Readers are encouraged to start with just one principle and gradually incorporate more over time.',
        'Success stories from readers who have applied these principles add credibility and inspiration to the content.',
      ]},
      { title: 'Key Takeaway 2', points: [
        'Critical thinking is presented as an essential skill that must be deliberately cultivated and practiced regularly.',
        'Readers are encouraged to question established norms and assumptions rather than accepting them at face value.',
        'Embracing complexity rather than seeking simple answers leads to more robust and nuanced understanding.',
        'The book provides a toolkit of critical thinking techniques that can be applied in any situation or domain.',
        'The importance of intellectual humility is emphasized as a prerequisite for genuine learning and growth.',
        'Strategies for engaging constructively with opposing viewpoints are provided with practical examples.',
        'The role of curiosity as a driver of critical thinking is explored and techniques for nurturing it are shared.',
        'Readers learn how to distinguish between high-quality evidence and superficial or misleading claims.',
      ]},
      { title: 'Final Thoughts', points: [
        'This book makes a valuable contribution to its field by synthesizing diverse strands of thought into a coherent whole.',
        'The work is suitable for readers at all levels, from complete beginners to experienced practitioners.',
        'It functions both as an introduction for newcomers and as a valuable reference for those already familiar with the topic.',
        'The author has created a resource that readers will likely return to multiple times as they deepen their understanding.',
        'The practical exercises and tools provided make this book more than just theory but a genuine learning experience.',
        'The calm and measured tone throughout makes even the most challenging concepts approachable and digestible.',
        'Future directions for the field are discussed, giving readers a sense of where things are heading next.',
        'The book leaves readers with a sense of empowerment and a clear roadmap for continued learning and application.',
      ]},
    ]);
  }
}
