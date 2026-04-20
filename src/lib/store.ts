'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppView, Book, AISummary, Slide, AIStory } from './types';

interface AICache {
  bookId: string;
  summary: AISummary | null;
  slides: Slide[] | null;
  story: AIStory | null;
  generatedAt: string;
}

interface SoftScrollState {
  currentView: AppView;
  selectedInterests: string[];
  recommendedBooks: Book[];
  currentBook: Book | null;
  savedBooks: Book[];
  summary: AISummary | null;
  story: AIStory | null;
  slides: Slide[] | null;
  audioUrl: string | null;
  aiCache: Record<string, AICache>;
  isLoading: boolean;
  readerSettings: {
    fontSize: number;
    lineHeight: number;
    darkMode: boolean;
  };

  setCurrentView: (view: AppView) => void;
  toggleInterest: (interestId: string) => void;
  setSelectedInterests: (interests: string[]) => void;
  setRecommendedBooks: (books: Book[]) => void;
  setCurrentBook: (book: Book | null) => void;
  toggleSaveBook: (book: Book) => void;
  setSummary: (summary: AISummary | null) => void;
  setStory: (story: AIStory | null) => void;
  setSlides: (slides: Slide[] | null) => void;
  setAudioUrl: (url: string | null) => void;
  setAICache: (bookId: string, data: { summary?: AISummary | null; slides?: Slide[] | null; story?: AIStory | null }) => void;
  getAICache: (bookId: string) => AICache | null;
  setIsLoading: (loading: boolean) => void;
  updateReaderSettings: (settings: Partial<SoftScrollState['readerSettings']>) => void;
}

export const useSoftScrollStore = create<SoftScrollState>()(
  persist(
    (set, get) => ({
      currentView: 'interests',
      selectedInterests: [],
      recommendedBooks: [],
      currentBook: null,
      savedBooks: [],
      summary: null,
      slides: null,
      audioUrl: null,
      aiCache: {},
      isLoading: false,
      readerSettings: {
        fontSize: 18,
        lineHeight: 1.8,
        darkMode: false,
      },

      setCurrentView: (view) => set({ currentView: view }),
      toggleInterest: (interestId) =>
        set((state) => ({
          selectedInterests: state.selectedInterests.includes(interestId)
            ? state.selectedInterests.filter((id) => id !== interestId)
            : [...state.selectedInterests, interestId],
        })),
      setSelectedInterests: (interests) => set({ selectedInterests: interests }),
      setRecommendedBooks: (books) => set({ recommendedBooks: books }),
      setCurrentBook: (book) => set({ currentBook: book, summary: null, story: null, slides: null, audioUrl: null }),
      toggleSaveBook: (book) =>
        set((state) => ({
          savedBooks: state.savedBooks.some((b) => b.id === book.id)
            ? state.savedBooks.filter((b) => b.id !== book.id)
            : [...state.savedBooks, book],
        })),
      setSummary: (summary) => set({ summary }),
      setSlides: (slides) => set({ slides }),
      setAudioUrl: (url) => set({ audioUrl: url }),
      setStory: (story) => set({ story }),
      setAICache: (bookId, data) =>
        set((state) => ({
          aiCache: {
            ...state.aiCache,
            [bookId]: {
              bookId,
              summary: data.summary ?? state.aiCache[bookId]?.summary ?? null,
              slides: data.slides ?? state.aiCache[bookId]?.slides ?? null,
              story: data.story ?? state.aiCache[bookId]?.story ?? null,
              generatedAt: new Date().toISOString(),
            },
          },
        })),
      getAICache: (bookId) => get().aiCache[bookId] || null,
      setIsLoading: (loading) => set({ isLoading: loading }),
      updateReaderSettings: (settings) =>
        set((state) => ({
          readerSettings: { ...state.readerSettings, ...settings },
        })),
    }),
    {
      name: 'softscroll-storage',
      partialize: (state) => ({
        selectedInterests: state.selectedInterests,
        savedBooks: state.savedBooks,
        readerSettings: state.readerSettings,
        aiCache: state.aiCache,
      }),
    }
  )
);
