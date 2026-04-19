import { NextRequest, NextResponse } from 'next/server';
import type { Book } from '@/lib/types';
import { categorySearchMap } from '@/lib/categories';

const BOOK_CACHE = new Map<string, { data: Book[]; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function getCacheKey(interests: string[]): string {
  return interests.sort().join(',');
}

// Fetch from Open Library — metadata only, link to OL page
async function fetchFromOpenLibrary(query: string): Promise<Book[]> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=100&fields=key,title,author_name,first_publish_year,subject,edition_key,cover_i`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.docs || []).map((doc: Record<string, unknown>) => ({
      id: `ol-${doc.key}`,
      title: doc.title || 'Unknown Title',
      author: Array.isArray(doc.author_name) ? doc.author_name[0] : (doc.author_name as string) || 'Unknown Author',
      description: Array.isArray(doc.subject) ? doc.subject.slice(0, 5).join(', ') : '',
      coverImage: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : '/placeholder-book.svg',
      previewLink: `https://openlibrary.org${doc.key}`,
      isFree: false,
      fullTextUrl: undefined,
      categories: Array.isArray(doc.subject) ? doc.subject.slice(0, 3) as string[] : [],
      publishedYear: doc.first_publish_year as number | undefined,
    }));
  } catch {
    return [];
  }
}

// Fetch from Google Books — metadata only
async function fetchFromGoogleBooks(query: string): Promise<Book[]> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=100`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((item: Record<string, unknown>) => {
      const volumeInfo = item.volumeInfo as Record<string, unknown>;
      return {
        id: `gb-${(item.id as string) || Math.random().toString(36).slice(2)}`,
        title: (volumeInfo?.title as string) || 'Unknown Title',
        author: Array.isArray(volumeInfo?.authors)
          ? volumeInfo.authors[0]
          : (volumeInfo?.authors as string) || 'Unknown Author',
        description: typeof volumeInfo?.description === 'string'
          ? volumeInfo.description.slice(0, 300)
          : '',
        coverImage: (volumeInfo?.imageLinks?.thumbnail as string) || '/placeholder-book.svg',
        previewLink: (volumeInfo?.previewLink as string) || (volumeInfo?.infoLink as string) || '#',
        buyLink: (volumeInfo?.infoLink as string) || undefined,
        isFree: false,
        fullTextUrl: undefined,
        categories: Array.isArray(volumeInfo?.categories) ? volumeInfo.categories as string[] : [],
        publishedYear: volumeInfo?.publishedDate ? parseInt(String(volumeInfo.publishedDate)) || undefined : undefined,
        pageCount: volumeInfo?.pageCount as number | undefined,
      };
    });
  } catch {
    return [];
  }
}

function deduplicateBooks(books: Book[]): Book[] {
  const seen = new Set<string>();
  const result: Book[] = [];
  for (const book of books) {
    const key = book.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(book);
    }
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { interests } = await request.json() as { interests: string[] };

    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one interest' },
        { status: 400 }
      );
    }

    const cacheKey = getCacheKey(interests);
    const cached = BOOK_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    const allBooks: Book[] = [];

    // Fetch from Open Library + Google Books
    const searchTerms = interests
      .flatMap((interest: string) => categorySearchMap[interest] || [interest])
      .slice(0, 15);

    const fetchPromises = searchTerms.map(async (term) => {
      const [olBooks, gbBooks] = await Promise.all([
        fetchFromOpenLibrary(term),
        fetchFromGoogleBooks(term),
      ]);
      allBooks.push(...olBooks, ...gbBooks);
    });

    await Promise.all(fetchPromises);

    const uniqueBooks = deduplicateBooks(allBooks);
    // Shuffle slightly to add variety, then cap at 100
    const shuffled = uniqueBooks.sort(() => Math.random() - 0.5);
    const topBooks = shuffled.slice(0, 100);

    BOOK_CACHE.set(cacheKey, { data: topBooks, timestamp: Date.now() });

    return NextResponse.json(topBooks);
  } catch (error) {
    console.error('Error recommending books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book recommendations' },
      { status: 500 }
    );
  }
}
