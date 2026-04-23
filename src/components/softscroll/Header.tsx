'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, ArrowLeft, Bookmark, Search, X, MessageSquare, User } from 'lucide-react';
import { useSoftScrollStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { currentView, setCurrentView, savedBooks, searchQuery, setSearchQuery, addRecentSearch } = useSoftScrollStore();
  const [showSearch, setShowSearch] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchQuery(localSearch.trim());
      addRecentSearch(localSearch.trim());
      setShowSearch(false);
      if (currentView !== 'discover') {
        setCurrentView('discover');
      }
    }
  }, [localSearch, setSearchQuery, addRecentSearch, setCurrentView, currentView]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowSearch(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setLocalSearch(searchQuery);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackMsg.trim()) return;
    try {
      const { submitFeedback } = await import('@/lib/api');
      await submitFeedback(feedbackMsg, 'general');
      setFeedbackSent(true);
      setFeedbackMsg('');
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackSent(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to send feedback:', error);
    }
  };

  return (
    <>
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
            </div>
          </div>

          {/* Right: Search, Saved, Feedback, Profile */}
          <div className="flex items-center gap-1 sm:gap-2">
            <AnimatePresence mode="wait">
              {showSearch ? (
                <motion.form
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSearch}
                  className="flex items-center"
                >
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Search books..."
                    autoFocus
                    className="w-32 sm:w-48 px-3 py-1.5 text-sm rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleSearch}
                    className="rounded-xl ml-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.form>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={toggleSearch}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-muted/80 transition-colors text-xs text-muted-foreground"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                </motion.button>
              )}
            </AnimatePresence>

            <button
              onClick={() => setCurrentView('saved')}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-muted/80 transition-colors text-xs text-muted-foreground"
            >
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
              {savedBooks.length > 0 && (
                <span className="w-5 h-5 bg-[#8FB9A8] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {savedBooks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowFeedbackModal(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-muted/80 transition-colors text-xs text-muted-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Feedback</span>
            </button>

            <button
              onClick={() => setCurrentView('profile')}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-muted/80 transition-colors text-xs text-muted-foreground"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowFeedbackModal(false)}>
          <div className="bg-card rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Send Feedback</h3>
            {feedbackSent ? (
              <div className="text-center py-4 text-[#8FB9A8]">Thank you!</div>
            ) : (
              <>
                <textarea
                  value={feedbackMsg}
                  onChange={(e) => setFeedbackMsg(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-sm mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFeedbackModal(false)}
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendFeedback}
                    disabled={!feedbackMsg.trim()}
                    className="flex-1 rounded-xl bg-[#8FB9A8]"
                  >
                    Send
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}