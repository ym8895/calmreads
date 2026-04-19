'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { useSoftScrollStore } from '@/lib/store';
import { Header } from '@/components/softscroll/Header';
import { InterestPicker } from '@/components/softscroll/InterestPicker';
import { DiscoverView } from '@/components/softscroll/DiscoverView';
import { BookDetailView } from '@/components/softscroll/BookDetailView';
import { ReaderView } from '@/components/softscroll/ReaderView';
import { SavedBooksView } from '@/components/softscroll/SavedBooksView';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: 'easeIn' } },
};

function AppContent() {
  const { currentView } = useSoftScrollStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <AnimatePresence mode="wait">
          {currentView === 'interests' && (
            <motion.div key="interests" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <InterestPicker />
            </motion.div>
          )}
          {currentView === 'discover' && (
            <motion.div key="discover" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <DiscoverView />
            </motion.div>
          )}
          {currentView === 'book-detail' && (
            <motion.div key="book-detail" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <BookDetailView />
            </motion.div>
          )}
          {currentView === 'reader' && (
            <motion.div key="reader" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ReaderView />
            </motion.div>
          )}
          {currentView === 'saved' && (
            <motion.div key="saved" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <SavedBooksView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppContent />
    </ThemeProvider>
  );
}
