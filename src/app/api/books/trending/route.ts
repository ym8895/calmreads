import { NextRequest, NextResponse } from 'next/server';
import { getTrendingBooks, trackBookView } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { bookId, bookTitle, author, coverImage } = await request.json();
    
    if (!bookId || !bookTitle) {
      return NextResponse.json({ error: 'bookId and bookTitle required' }, { status: 400 });
    }

    await trackBookView(bookId, bookTitle, author, coverImage);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}

const EXPLICIT_KEYWORDS = ['sex', 'erotic', 'porn', 'bdsm', 'bondage', 'xxx', 'seduction'];
function isExplicit(text: string): boolean {
  return EXPLICIT_KEYWORDS.some(kw => text.toLowerCase().includes(kw));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const hours = parseInt(searchParams.get('hours') || '24');

    const trending = await getTrendingBooks(hours, limit);

    const cleanTrending = trending
      .map(b => ({
        bookId: b.bookId,
        bookTitle: b.bookTitle,
        bookAuthor: b.bookAuthor,
        coverUrl: b.coverUrl,
        views: b.views,
      }))
      .filter(b => !isExplicit(`${b.bookTitle} ${b.bookAuthor}`));

    return NextResponse.json({ trending: cleanTrending.slice(0, limit) });
  } catch (error) {
    console.error('Failed to get trending:', error);
    return NextResponse.json({ error: 'Failed to get trending' }, { status: 500 });
  }
}