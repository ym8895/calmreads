'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppView, Book, AISummary, Slide, AIStory } from './types';

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
  setIsLoading: (loading: boolean) => void;
  updateReaderSettings: (settings: Partial<SoftScrollState['readerSettings']>) => void;
}

export const useSoftScrollStore = create<SoftScrollState>()(
  persist(
    (set) => ({
      currentView: 'interests',
      selectedInterests: [],
      recommendedBooks: [],
      currentBook: null,
      savedBooks: [],
      summary: null,
      slides: null,
      audioUrl: null,
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
      }),
    }
  )
);
