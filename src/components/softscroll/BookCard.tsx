'use client';

import { motion } from 'framer-motion';
import type { Book } from '@/lib/types';
import { useSoftScrollStore } from '@/lib/store';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { ArtisticBookCover } from './ArtisticBook';

interface BookCardProps {
  book: Book;
  index: number;
  compact?: boolean;
}

export function BookCard({ book, index, compact = false }: BookCardProps) {
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
        className="cursor-pointer bg-card border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#8FB9A8]/10 hover:border-[#8FB9A8]/40"
      >
        {compact ? (
          /* Compact card - vertical layout with artistic cover */
          <div className="flex flex-col items-center p-4">
            <ArtisticBookCover
              title={book.title}
              author={book.author}
              coverImage={book.coverImage}
              size="md"
            />
            <div className="mt-3 text-center w-full">
              <h3 className="font-semibold text-sm text-foreground/90 line-clamp-2 group-hover:text-[#7AA896] dark:group-hover:text-[#8FB9A8] transition-colors">
                {book.title}
              </h3>
              <p className="text-muted-foreground text-xs mt-1">{book.author}</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {book.isFree && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#D4E6E0] text-[#2C4A3F] dark:bg-[#2C4A3F] dark:text-[#8FB9A8] border border-[#C8DDD5] dark:border-[#344E44]">
                  Free
                </span>
              )}
              {book.publishedYear && (
                <span className="text-[10px] text-muted-foreground">{book.publishedYear}</span>
              )}
            </div>
          </div>
        ) : (
          /* Standard card - horizontal layout */
          <div className="flex gap-4 p-4 sm:p-5">
            <ArtisticBookCover
              title={book.title}
              author={book.author}
              coverImage={book.coverImage}
              size="sm"
              className="flex-shrink-0"
            />

            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-foreground/90 line-clamp-2 group-hover:text-[#7AA896] dark:group-hover:text-[#8FB9A8] transition-colors">
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
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#D4E6E0] text-[#2C4A3F] dark:bg-[#2C4A3F] dark:text-[#8FB9A8] border border-[#C8DDD5] dark:border-[#344E44]">
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
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSaveBook(book);
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#7AA896] dark:hover:text-[#8FB9A8] transition-colors cursor-pointer"
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
        </div>
      </div>
    </motion.div>
  );
}
