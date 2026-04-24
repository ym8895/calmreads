import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || searchParams.get('query');
  
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ books: [], error: 'Query too short' }, { status: 400 });
  }

  try {
    const googleKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (!googleKey) {
      return NextResponse.json({ books: [], error: 'API key not configured' }, { status: 500 });
    }

    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&key=${googleKey}`
    );
    
    if (!res.ok) {
      throw new Error(`Google Books API error: ${res.status}`);
    }

    const data = await res.json();
    
    const books = (data.items || []).map((item: any) => {
      const info = item.volumeInfo || {};
      return {
        id: item.id,
        title: info.title || 'Unknown Title',
        author: info.authors?.[0] || 'Unknown Author',
        description: info.description || '',
        publishedYear: info.publishedDate?.split('-')[0],
        categories: info.categories || [],
        thumbnail: info.imageLinks?.thumbnail?.replace('http:', 'https:'),
        pageCount: info.pageCount,
      };
    });

    return NextResponse.json({ books });
  } catch (err) {
    console.error('[Search] Error:', err);
    return NextResponse.json({ books: [], error: 'Search failed' }, { status: 500 });
  }
}