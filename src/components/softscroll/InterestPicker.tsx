'use client';

import { motion } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { categories } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.02, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
};

export function InterestPicker() {
  const { selectedInterests, toggleInterest, setCurrentView, setRecommendedBooks, setIsLoading } = useSoftScrollStore();

  const handleDiscover = async () => {
    if (selectedInterests.length === 0) return;
    setIsLoading(true);
    setCurrentView('discover');
    try {
      const { fetchRecommendedBooks } = await import('@/lib/api');
      const books = await fetchRecommendedBooks(selectedInterests);
      setRecommendedBooks(books);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mb-10 sm:mb-14"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground/90 tracking-tight mb-4">
          Discover your next{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500">
            favorite book
          </span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
          Select the topics that fascinate you, and we&apos;ll curate a personalized
          collection of books you&apos;ll love. Choose as many as you like.
        </p>
      </motion.div>

      {/* Category Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 max-w-5xl w-full mb-10"
      >
        {categories.map((cat) => {
          const isSelected = selectedInterests.includes(cat.id);
          return (
            <motion.button
              key={cat.id}
              variants={item}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleInterest(cat.id)}
              className={`
                relative p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-300
                cursor-pointer group
                ${isSelected
                  ? 'border-amber-400 dark:border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 shadow-sm shadow-amber-200/50 dark:shadow-amber-900/20'
                  : 'border-border/60 bg-card hover:border-border hover:bg-muted/30'
                }
              `}
            >
              {isSelected && (
                <motion.div
                  layoutId="selected-indicator"
                  className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
              <span className="text-xl sm:text-2xl mb-1.5 block">{cat.emoji}</span>
              <span className={`text-xs sm:text-sm font-medium block ${
                isSelected ? 'text-amber-800 dark:text-amber-200' : 'text-foreground/80'
              }`}>
                {cat.name}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <Button
          onClick={handleDiscover}
          disabled={selectedInterests.length === 0}
          size="lg"
          className={`
            rounded-2xl px-8 py-6 text-base font-semibold
            transition-all duration-300 shadow-lg
            ${selectedInterests.length > 0
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-200/50 dark:shadow-amber-900/30 hover:shadow-xl'
              : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
            }
          `}
        >
          {selectedInterests.length > 0 ? (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Discover {selectedInterests.length} {selectedInterests.length === 1 ? 'topic' : 'topics'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            'Select topics to continue'
          )}
        </Button>
      </motion.div>
    </div>
  );
}
