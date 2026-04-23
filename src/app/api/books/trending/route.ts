import { NextRequest, NextResponse } from 'next/server';
import { getTrendingBooksSimple, trackBookView } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { bookId, bookTitle } = await request.json();
    
    if (!bookId || !bookTitle) {
      return NextResponse.json({ error: 'bookId and bookTitle required' }, { status: 400 });
    }

    await trackBookView(bookId, bookTitle);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const hours = parseInt(searchParams.get('hours') || '24');

    const trending = await getTrendingBooksSimple(hours, limit);

    return NextResponse.json({ 
      trending: trending.map(b => ({
        bookId: b.book_id,
        bookTitle: b.book_title,
        views: b.views,
      }))
    });
  } catch (error) {
    console.error('Failed to get trending:', error);
    return NextResponse.json({ error: 'Failed to get trending' }, { status: 500 });
  }
}