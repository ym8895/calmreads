import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    if (decodedId.startsWith('ol-')) {
      const olKey = decodedId.replace('ol-', '');
      const res = await fetch(`https://openlibrary.org${olKey}.json`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
      }
      const data = await res.json();
      const book = {
        id: decodedId,
        title: data.title || 'Unknown Title',
        author: data.authors?.[0]?.name || 'Unknown Author',
        description: typeof data.description === 'string'
          ? data.description
          : data.description?.value || '',
        coverImage: data.covers?.[0]
          ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
          : '/placeholder-book.svg',
        previewLink: `https://openlibrary.org${olKey}`,
        isFree: true,
        fullTextUrl: `https://openlibrary.org${olKey}`,
        categories: data.subjects?.slice?.(0, 5) || [],
        publishedYear: data.first_publish_date
          ? parseInt(data.first_publish_date) || undefined
          : undefined,
        pageCount: data.number_of_pages || undefined,
      };
      return NextResponse.json(book);
    }

    if (decodedId.startsWith('gb-')) {
      const gbId = decodedId.replace('gb-', '');
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes/${gbId}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
      }
      const data = await res.json();
      const volumeInfo = data.volumeInfo || {};
      const accessInfo = data.accessInfo || {};
      const isFree = accessInfo.viewability === 'ALL_PUBLIC';
      const book = {
        id: decodedId,
        title: volumeInfo.title || 'Unknown Title',
        author: Array.isArray(volumeInfo.authors)
          ? volumeInfo.authors[0]
          : 'Unknown Author',
        description: typeof volumeInfo.description === 'string'
          ? volumeInfo.description.slice(0, 600)
          : '',
        coverImage: volumeInfo.imageLinks?.thumbnail || '/placeholder-book.svg',
        previewLink: volumeInfo.previewLink || volumeInfo.infoLink || '#',
        buyLink: volumeInfo.infoLink || undefined,
        isFree,
        fullTextUrl: isFree ? volumeInfo.previewLink : undefined,
        categories: volumeInfo.categories || [],
        publishedYear: volumeInfo.publishedDate
          ? parseInt(volumeInfo.publishedDate) || undefined
          : undefined,
        pageCount: volumeInfo.pageCount || undefined,
      };
      return NextResponse.json(book);
    }

    return NextResponse.json({ error: 'Invalid book ID format' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching book details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book details' },
      { status: 500 }
    );
  }
}
