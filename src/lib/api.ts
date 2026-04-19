import type { Book, AISummary, Slide } from './types';

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
    body: JSON.stringify({ title: book.title, author: book.author, description: book.description }),
  });
  if (!res.ok) throw new Error('Failed to generate summary');
  return res.json();
}

export async function fetchAISlides(summary: AISummary): Promise<Slide[]> {
  const res = await fetch(`${API_BASE}/ai/slides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary }),
  });
  if (!res.ok) throw new Error('Failed to generate slides');
  return res.json();
}

export async function fetchAIAudio(summary: AISummary): Promise<string> {
  const res = await fetch(`${API_BASE}/ai/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: summary.fullText }),
  });
  if (!res.ok) throw new Error('Failed to generate audio');
  const data = await res.json();
  return data.audioUrl;
}
