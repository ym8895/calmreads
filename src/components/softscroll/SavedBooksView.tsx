'use client';

import { motion } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { BookCard } from './BookCard';

export function SavedBooksView() {
  const { savedBooks, setCurrentView } = useSoftScrollStore();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground/90 tracking-tight">
          Saved Books
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base mt-1">
          {savedBooks.length > 0
            ? `${savedBooks.length} book${savedBooks.length === 1 ? '' : 's'} saved for later`
            : 'Your reading list is empty'}
        </p>
      </motion.div>

      {savedBooks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground/80 mb-2">
            No saved books yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Start exploring books and save the ones that catch your eye. They&apos;ll appear here for easy access.
          </p>
          <button
            onClick={() => setCurrentView('discover')}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors"
          >
            Discover Books
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {savedBooks.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
