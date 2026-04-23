'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { useSoftScrollStore } from '@/lib/store';
import { Header } from '@/components/softscroll/Header';
import { Sidebar } from '@/components/softscroll/Sidebar';
import { ActionPanel } from '@/components/softscroll/ActionPanel';
import { InterestPicker } from '@/components/softscroll/InterestPicker';
import { DiscoverView } from '@/components/softscroll/DiscoverView';
import { BookDetailView } from '@/components/softscroll/BookDetailView';
import { ReaderView } from '@/components/softscroll/ReaderView';
import { SavedBooksView } from '@/components/softscroll/SavedBooksView';
import { LandingPage } from '@/components/softscroll/LandingPage';
import { BottomNav } from '@/components/softscroll/BottomNav';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: 'easeIn' } },
};

function AppContent() {
  const { currentView } = useSoftScrollStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Show landing page if on landing view
  if (currentView === 'landing') {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-card/80 backdrop-blur-md border border-border/50 shadow-soft hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Center Content */}
      <main className="flex-1 min-w-0 lg:ml-0 pb-20 lg:pb-0">
        <Header />
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

      {/* Right Action Panel */}
      <ActionPanel />

      {/* Mobile Bottom Navigation */}
      <BottomNav />
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
