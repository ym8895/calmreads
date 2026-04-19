'use client';

import { motion } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { BookCard } from './BookCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, RefreshCw, BookX } from 'lucide-react';

export function DiscoverView() {
  const { recommendedBooks, setCurrentView, isLoading, selectedInterests, setRecommendedBooks, setIsLoading } = useSoftScrollStore();

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { fetchRecommendedBooks } = await import('@/lib/api');
      const books = await fetchRecommendedBooks(selectedInterests);
      setRecommendedBooks(books);
    } catch (error) {
      console.error('Failed to refresh books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground/90 tracking-tight">
              Recommended for you
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              {recommendedBooks.length > 0
                ? `${recommendedBooks.length} books curated for your interests`
                : 'Based on your selected topics'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('interests')}
              className="rounded-xl border-border/60 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Change topics
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="rounded-xl border-border/60 text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border/50 rounded-2xl p-5">
              <div className="flex gap-4">
                <Skeleton className="w-20 sm:w-24 h-28 sm:h-36 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <Skeleton className="h-5 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                  <Skeleton className="h-3 w-1/3 rounded-lg" />
                  <div className="flex gap-2 pt-4">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && recommendedBooks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <BookX className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground/80 mb-2">
            No books found
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            We couldn&apos;t find books for the selected topics. Try choosing different interests or refreshing the page.
          </p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </motion.div>
      )}

      {/* Books Grid */}
      {!isLoading && recommendedBooks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {recommendedBooks.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
