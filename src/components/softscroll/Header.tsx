'use client';

import { BookOpen, Moon, Sun, Bookmark, Home, ArrowLeft } from 'lucide-react';
import { useSoftScrollStore } from '@/lib/store';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { currentView, setCurrentView, savedBooks } = useSoftScrollStore();
  const { theme, setTheme } = useTheme();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Back button + Logo */}
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

          <button
            onClick={() => setCurrentView('interests')}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <BookOpen className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground/90">
              SoftScroll
            </span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentView('saved')}
            className="rounded-xl hover:bg-muted/80 transition-colors relative"
          >
            <Bookmark className="h-5 w-5" />
            {savedBooks.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {savedBooks.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-xl hover:bg-muted/80 transition-colors"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
