import type { Book, AISummary, Slide, AIStory } from './types';

const API_BASE = '/api';

export async function fetchRecommendedBooks(interests: string[]): Promise<Book[]> {
  const res = await fetch(`${API_BASE}/books/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interests }),
  });
  if (!res.ok) throw new Error('Failed to fetch books');
  return res.json();
}

export async function fetchBookDetails(id: string): Promise<Book> {
  const res = await fetch(`${API_BASE}/books/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to fetch book details');
  return res.json();
}

export async function fetchAISummary(book: Book): Promise<AISummary> {
  const res = await fetch(`${API_BASE}/ai/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: book.title,
      author: book.author,
      description: book.description,
      categories: book.categories,
      bookId: book.id,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Failed to generate summary' }));
    throw new Error(errData.error || 'Failed to generate summary');
  }
  return res.json();
}

export async function fetchAISlides(summary: AISummary, book?: Book): Promise<Slide[]> {
  const res = await fetch(`${API_BASE}/ai/slides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary,
      bookTitle: book?.title,
      bookAuthor: book?.author,
      bookId: book?.id,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Failed to generate slides' }));
    throw new Error(errData.error || 'Failed to generate slides');
  }
  return res.json();
}

export async function fetchAIAudio(summary: AISummary): Promise<{ useBrowserTts: boolean; text?: string; audioUrl?: string }> {
  const res = await fetch(`${API_BASE}/ai/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: summary.fullText }),
  });
  if (!res.ok) throw new Error('Failed to generate audio');
  return res.json();
}

export async function fetchAIStory(book: Book): Promise<AIStory> {
  const res = await fetch(`${API_BASE}/ai/story`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: book.title,
      author: book.author,
      description: book.description,
      categories: book.categories,
      bookId: book.id,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Failed to generate story' }));
    throw new Error(errData.error || 'Failed to generate story');
  }
  return res.json();
}
