import { NextRequest, NextResponse } from 'next/server';

const EXPLICIT_KEYWORDS = [
  'sex', 'erotic', 'porn', 'barely legal', 'blowjob', 'fuck',
  'bondage', 'bdsm', 'xxx', 'adult', 'nude', 'naked',
  'sexual', 'intimate', 'confession', 'seduce', 'seduction'
];

const EXPLICIT_CATEGORIES = [
  'erotica', 'pornography', 'erotic photography', 'adult fiction',
  'sexual health', 'sexuality', 'relationships-sex',
  'interracial', 'mmf', 'mfm', 'bbw'
];

function isExplicit(book: { title: string; author: string; categories: string[]; description?: string }): boolean {
  const text = `${book.title} ${book.author} ${book.description} ${book.categories.join(' ')}`.toLowerCase();
  if (EXPLICIT_KEYWORDS.some(kw => text.includes(kw))) return true;
  if (book.categories.some(cat => EXPLICIT_CATEGORIES.includes(cat.toLowerCase()))) return true;
  return false;
}

function safeBook(book: any): any {
  return {
    id: book.id,
    source: book.source,
    title: book.title,
    author: book.author,
    description: book.description?.slice(0, 200) || '',
    publishedYear: book.publishedYear,
    categories: book.categories?.slice(0, 3) || [],
    coverImage: book.coverImage,
    pageCount: book.pageCount,
  };
}

async function searchGoogleBooks(query: string) {
  const googleKey = process.env.GOOGLE_BOOKS_API_KEY;
  let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=30&orderBy=relevance&printType=books&langRestrict=en`;
  if (googleKey) url += `&key=${googleKey}`;
  
  const res = await fetch(url);
  if (!res.ok) return [];
  
  const data = await res.json();
  return (data.items || [])
    .filter((item: any) => {
      const maturity = item.volumeInfo?.maturityRating;
      return maturity !== 'MATURE' && maturity !== 'ADULT';
    })
    .map((item: any) => {
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
    
    // Filter out explicit content
    const cleanBooks = books.map(safeBook).filter(book => !isExplicit(book));

    // Need at least 10 books, if not enough, fetch more from Google
    if (cleanBooks.length < 10) {
      const moreGoogle = await searchGoogleBooks(`${query} classic fiction`);
      const moreClean = moreGoogle.map(safeBook).filter(book => !isExplicit(book));
      for (const b of moreClean) {
        const key = `${b.title.toLowerCase()}-${b.author.toLowerCase()}`;
        if (!seen.has(key) && cleanBooks.length < 30) {
          seen.add(key);
          cleanBooks.push(b);
        }
      }
    }

    return NextResponse.json({ books: cleanBooks.slice(0, 40) });
  } catch (err) {
    console.error('[Search] Error:', err);
    return NextResponse.json({ books: [], error: 'Search failed' }, { status: 500 });
  }
}