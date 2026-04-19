'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { useTheme } from 'next-themes';
import {
  BookOpen, Home, Bookmark, Clock, Search, X,
  Sun, Moon, Sparkles, ChevronRight, BookMarked
} from 'lucide-react';
import { ArtisticBookCover } from './ArtisticBook';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const {
    currentView, setCurrentView, savedBooks, selectedInterests,
    recommendedBooks, setRecommendedBooks, setIsLoading
  } = useSoftScrollStore();
  const { theme, setTheme } = useTheme();

  const handleQuickDiscover = async () => {
    if (selectedInterests.length === 0) return;
    setIsLoading(true);
    setCurrentView('discover');
    try {
      const { fetchRecommendedBooks } = await import('@/lib/api');
      const books = await fetchRecommendedBooks(selectedInterests);
      setRecommendedBooks(books);
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
    onClose();
  };

  const recentBooks = recommendedBooks.slice(0, 5);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-30
          w-72 lg:w-64 xl:w-72 h-screen
          bg-card/95 dark:bg-card/95 backdrop-blur-xl
          border-r border-border/50
          flex flex-col overflow-hidden
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <button
            onClick={() => setCurrentView('interests')}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#D4E6E0] dark:bg-[#2C4A3F] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <BookOpen className="h-5 w-5 text-[#2C4A3F] dark:text-[#8FB9A8]" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground/90">SoftScroll</span>
          </button>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {[
            { id: 'interests', label: 'Discover Topics', icon: <Sparkles className="w-4 h-4" />, active: currentView === 'interests' },
            { id: 'discover', label: 'Browse Books', icon: <Home className="w-4 h-4" />, active: currentView === 'discover' },
            { id: 'saved', label: `Saved Books (${savedBooks.length})`, icon: <Bookmark className="w-4 h-4" />, active: currentView === 'saved' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id as any); onClose(); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 cursor-pointer
                ${item.active
                  ? 'bg-[#D4E6E0]/60 dark:bg-[#2C4A3F]/40 text-[#2C4A3F] dark:text-[#8FB9A8]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }
              `}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.active && <ChevronRight className="w-4 h-4 opacity-50" />}
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t border-border/30" />

        {/* Selected Interests Summary */}
        {selectedInterests.length > 0 && currentView === 'discover' && (
          <div className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <BookMarked className="w-3.5 h-3.5" />
              {selectedInterests.length} topics selected
            </p>
            <button
              onClick={handleQuickDiscover}
              className="w-full py-2 rounded-xl bg-[#8FB9A8] hover:bg-[#7AA896] text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Refresh Books
            </button>
          </div>
        )}

        {/* Recently Viewed */}
        <div className="flex-1 overflow-y-auto p-4">
          {recentBooks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Recently Discovered
              </p>
              <div className="space-y-2">
                {recentBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => {
                      useSoftScrollStore.getState().setCurrentBook(book);
                      setCurrentView('book-detail');
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/40 transition-colors text-left cursor-pointer group"
                  >
                    <ArtisticBookCover
                      title={book.title}
                      author={book.author}
                      coverImage={book.coverImage}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground/80 line-clamp-1 group-hover:text-[#7AA896] dark:group-hover:text-[#8FB9A8] transition-colors">
                        {book.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{book.author}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saved Books Quick List */}
          {savedBooks.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                Your Reading List
              </p>
              <div className="space-y-2">
                {savedBooks.slice(0, 5).map((book) => (
                  <button
                    key={book.id}
                    onClick={() => {
                      useSoftScrollStore.getState().setCurrentBook(book);
                      setCurrentView('book-detail');
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/40 transition-colors text-left cursor-pointer group"
                  >
                    <ArtisticBookCover
                      title={book.title}
                      author={book.author}
                      coverImage={book.coverImage}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground/80 line-clamp-1 group-hover:text-[#7AA896] dark:group-hover:text-[#8FB9A8] transition-colors">
                        {book.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{book.author}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-border/30 space-y-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
            <span>Theme</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
