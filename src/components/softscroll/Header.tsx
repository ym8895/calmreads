'use client';

import { BookOpen, Moon, Sun, ArrowLeft, Bookmark } from 'lucide-react';
import { useSoftScrollStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { currentView, setCurrentView, savedBooks } = useSoftScrollStore();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border/50"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Back button */}
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {currentView !== 'interests' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentView(currentView === 'reader' ? 'book-detail' : 'discover')}
                  className="rounded-xl hover:bg-muted/80 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* View title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4E6E0] dark:bg-[#2C4A3F] flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-[#2C4A3F] dark:text-[#8FB9A8]" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground/90 hidden sm:inline">SoftScroll</span>
          </div>
        </div>

        {/* Right: Saved count */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('saved')}
            className="rounded-xl hover:bg-muted/80 transition-colors gap-1.5 text-xs"
          >
            <Bookmark className="h-4 w-4" />
            {savedBooks.length > 0 && (
              <span className="w-5 h-5 bg-[#8FB9A8] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {savedBooks.length}
              </span>
            )}
            <span className="hidden sm:inline">Saved</span>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
