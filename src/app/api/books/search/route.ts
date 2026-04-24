import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || searchParams.get('query');
  
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ books: [], error: 'Query too short' }, { status: 400 });
  }

  try {
    const googleKey = process.env.GOOGLE_BOOKS_API_KEY;
    
    // Build URL with or without API key
    let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`;
    if (googleKey) {
      url += `&key=${googleKey}`;
    }
    
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Search] Google Books error:', res.status, errorText);
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
        coverImage: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
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