'use client';

import { motion } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { categories } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { CategoryBookIcon } from './ArtisticBook';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.02, delayChildren: 0.1 } },
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
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7AA896] via-[#5A7A6A] to-[#2C4A3F]">
            favorite book
          </span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
          Select the topics that fascinate you, and we&apos;ll curate a personalized
          collection of books you&apos;ll love. Choose as many as you like.
        </p>
      </motion.div>

      {/* Category Grid - Artistic Book Style */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 max-w-5xl w-full mb-10"
      >
        {categories.map((cat) => {
          const isSelected = selectedInterests.includes(cat.id);
          return (
            <motion.div key={cat.id} variants={item} className="flex flex-col items-center gap-1.5">
              <CategoryBookIcon
                categoryId={cat.id}
                categoryName={cat.name}
                emoji={cat.emoji}
                isSelected={isSelected}
                onClick={() => toggleInterest(cat.id)}
                size="md"
              />
              <span className={`text-[10px] sm:text-xs font-medium text-center transition-colors ${
                isSelected ? 'text-[#2C4A3F] dark:text-[#8FB9A8]' : 'text-muted-foreground'
              }`}>
                {cat.name}
              </span>
            </motion.div>
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
              ? 'bg-[#8FB9A8] hover:bg-[#7AA896] text-white shadow-[#8FB9A8]/30 hover:shadow-xl'
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
