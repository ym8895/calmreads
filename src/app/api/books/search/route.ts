import { NextRequest, NextResponse } from 'next/server';

async function searchGoogleBooks(query: string) {
  const googleKey = process.env.GOOGLE_BOOKS_API_KEY;
  let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&orderBy=relevance&printType=books&langRestrict=en`;
  if (googleKey) url += `&key=${googleKey}`;
  
  const res = await fetch(url);
  if (!res.ok) return [];
  
  const data = await res.json();
  return (data.items || []).map((item: any) => {
    const info = item.volumeInfo || {};
    return {
      id: item.id,
      source: 'google',
      title: info.title || 'Unknown Title',
      author: info.authors?.[0] || 'Unknown Author',
      description: info.description || '',
      publishedYear: info.publishedDate?.split('-')[0],
      categories: info.categories || [],
      coverImage: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
      pageCount: info.pageCount,
    };
  });
}

async function searchOpenLibrary(query: string) {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,first_publish_year,subject,cover_i`
    );
    if (!res.ok) return [];
    
    const data = await res.json();
    return (data.docs || []).map((doc: any) => ({
      id: doc.key,
      source: 'openlibrary',
      title: doc.title || 'Unknown Title',
      author: doc.author_name?.[0] || 'Unknown Author',
      description: '',
      publishedYear: doc.first_publish_year,
      categories: doc.subject?.slice(0, 5) || [],
      coverImage: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
      pageCount: 0,
    }));
  } catch (err) {
    console.error('[OpenLibrary] Error:', err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || searchParams.get('query');
  
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ books: [], error: 'Query too short' }, { status: 400 });
  }

  try {
    const [googleBooks, openLibraryBooks] = await Promise.all([
      searchGoogleBooks(query),
      searchOpenLibrary(query)
    ]);
    
    // Combine and remove duplicates (same title + author)
    const seen = new Set<string>();
    const books = [...googleBooks, ...openLibraryBooks].filter(book => {
      const key = `${book.title.toLowerCase()}-${book.author.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ books });
  } catch (err) {
    console.error('[Search] Error:', err);
    return NextResponse.json({ books: [], error: 'Search failed' }, { status: 500 });
  }
}