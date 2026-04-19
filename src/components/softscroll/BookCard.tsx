'use client';

import { motion } from 'framer-motion';
import type { Book } from '@/lib/types';
import { useSoftScrollStore } from '@/lib/store';
import { Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react';

interface BookCardProps {
  book: Book;
  index: number;
}

export function BookCard({ book, index }: BookCardProps) {
  const { setCurrentBook, setCurrentView, savedBooks, toggleSaveBook } = useSoftScrollStore();
  const isSaved = savedBooks.some((b) => b.id === book.id);

  const handleClick = () => {
    setCurrentBook(book);
    setCurrentView('book-detail');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <div
        onClick={handleClick}
        className="cursor-pointer bg-card border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-amber-100/50 dark:hover:shadow-amber-900/10 hover:border-amber-200/60 dark:hover:border-amber-800/40"
      >
        <div className="flex gap-4 p-4 sm:p-5">
          {/* Cover Image */}
          <div className="flex-shrink-0 w-20 sm:w-24 h-28 sm:h-36 rounded-xl overflow-hidden bg-muted shadow-md">
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-book.svg';
              }}
            />
          </div>

          {/* Book Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground/90 line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                {book.title}
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                {book.author}
              </p>
              {book.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {book.categories.slice(0, 2).map((cat, i) => (
                    <span
                      key={i}
                      className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              {book.isFree && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  Free to read
                </span>
              )}
              {book.publishedYear && (
                <span className="text-xs text-muted-foreground">
                  {book.publishedYear}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveBook(book);
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span>Save</span>
              </>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(book.previewLink, '_blank');
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
