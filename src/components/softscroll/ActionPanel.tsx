'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import {
  Bookmark, BookmarkCheck, BookOpen, ExternalLink,
  ShoppingBag, Sparkles, ArrowRight, StickyNote, X
} from 'lucide-react';
import { useState } from 'react';
import { ArtisticBookCover } from './ArtisticBook';

export function ActionPanel() {
  const {
    currentView, currentBook, savedBooks, toggleSaveBook,
    setCurrentView, selectedInterests
  } = useSoftScrollStore();
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showNotes, setShowNotes] = useState(false);

  const isSaved = currentBook ? savedBooks.some((b) => b.id === currentBook.id) : false;

  const handleSaveNote = () => {
    if (!currentBook || !note.trim()) return;
    setNotes(prev => ({ ...prev, [currentBook.id]: note.trim() }));
    setNote('');
  };

  const handleDiscover = async () => {
    if (selectedInterests.length === 0) return;
    const { setIsLoading, setRecommendedBooks } = useSoftScrollStore.getState();
    setIsLoading(true);
    setCurrentView('discover');
    try {
      const { fetchRecommendedBooks } = await import('@/lib/api');
      const books = await fetchRecommendedBooks(selectedInterests);
      setRecommendedBooks(books);
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  };

  // Show different panel content based on current view
  const showBookActions = currentView === 'book-detail' && currentBook;
  const showDiscoverCta = currentView === 'interests';

  return (
    <aside className="hidden xl:block w-72 flex-shrink-0 sticky top-0 h-screen border-l border-border/50 bg-card/50 dark:bg-card/30">
      <div className="h-full overflow-y-auto p-5 space-y-5">
        {/* Logo for right side */}
        <div className="text-center pt-2 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D4E6E0] dark:bg-[#2C4A3F] flex items-center justify-center mx-auto mb-2">
            <BookOpen className="h-6 w-6 text-[#2C4A3F] dark:text-[#8FB9A8]" />
          </div>
          <p className="text-xs text-muted-foreground">Calm Book Discovery</p>
        </div>

        <div className="border-t border-border/30" />

        {/* Book Action Panel - shows when viewing a book */}
        <AnimatePresence mode="wait">
          {showBookActions && currentBook && (
            <motion.div
              key="book-actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-semibold text-foreground/80">Quick Actions</h3>

              {/* Book Cover Mini */}
              <ArtisticBookCover
                title={currentBook.title}
                author={currentBook.author}
                coverImage={currentBook.coverImage}
                size="md"
              />

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => toggleSaveBook(currentBook)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isSaved
                      ? 'bg-[#D4E6E0] dark:bg-[#2C4A3F]/40 text-[#2C4A3F] dark:text-[#8FB9A8]'
                      : 'bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  {isSaved ? 'Saved to List' : 'Save for Later'}
                </button>

                {currentBook.previewLink && (
                  <a
                    href={currentBook.previewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#8FB9A8] hover:bg-[#7AA896] text-white transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    Book Link
                  </a>
                )}

                {currentBook.buyLink && (
                  <button
                    onClick={() => window.open(currentBook.buyLink, '_blank')}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-muted/40 hover:bg-muted/60 text-muted-foreground transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Buy Book
                  </button>
                )}
              </div>

              {/* Reading Notes */}
              <div>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-2"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  {showNotes ? 'Hide Notes' : 'My Notes'}
                  {notes[currentBook.id] && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8FB9A8]" />
                  )}
                </button>
                {showNotes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {notes[currentBook.id] && (
                      <div className="p-3 rounded-xl bg-[#F5F0E8]/50 dark:bg-[#2C4A3F]/20 border border-border/30 mb-2 relative">
                        <button
                          onClick={() => setNotes(prev => { const n = { ...prev }; delete n[currentBook.id]; return n; })}
                          className="absolute top-1.5 right-1.5 p-0.5 rounded hover:bg-muted/50 cursor-pointer"
                        >
                          <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <p className="text-xs text-muted-foreground leading-relaxed pr-4">{notes[currentBook.id]}</p>
                      </div>
                    )}
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Write your thoughts about this book..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-[#8FB9A8]"
                    />
                    <button
                      onClick={handleSaveNote}
                      disabled={!note.trim()}
                      className="mt-1.5 px-3 py-1.5 rounded-lg bg-[#8FB9A8] hover:bg-[#7AA896] text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Save Note
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Discover CTA - shows on interest picker */}
          {showDiscoverCta && (
            <motion.div
              key="discover-cta"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-semibold text-foreground/80">Get Started</h3>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#D4E6E0]/40 to-[#E8E4D9]/40 dark:from-[#2C4A3F]/20 dark:to-[#344E44]/20 border border-border/30">
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Select your favorite topics from the center panel, then discover personalized book recommendations curated just for you.
                </p>
                {selectedInterests.length > 0 ? (
                  <button
                    onClick={handleDiscover}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#8FB9A8] hover:bg-[#7AA896] text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Discover {selectedInterests.length} topics
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <p className="text-center text-xs text-muted-foreground/60 italic">
                    Pick topics to begin
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-lg font-bold text-[#8FB9A8]">{savedBooks.length}</p>
                  <p className="text-[10px] text-muted-foreground">Saved Books</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-lg font-bold text-[#8FB9A8]">{selectedInterests.length}</p>
                  <p className="text-[10px] text-muted-foreground">Topics</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer */}
        <div className="flex-1" />
      </div>
    </aside>
  );
}
