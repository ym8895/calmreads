'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { fetchAISummary, fetchAISlides, fetchAIAudio } from '@/lib/api';
import type { AISummary, Slide } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import {
  Bookmark, BookmarkCheck, ExternalLink,
  FileText, Headphones, Presentation,
  ChevronRight, BookOpen, ShoppingBag,
  Volume2, Loader2, AlertCircle
} from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import { SlideCarousel } from './SlideCarousel';

type AITab = 'summary' | 'audio' | 'slides';

export function BookDetailView() {
  const { currentBook, savedBooks, toggleSaveBook, summary, setSummary, slides, setSlides, audioUrl, setAudioUrl, setCurrentView } = useSoftScrollStore();
  const [activeTab, setActiveTab] = useState<AITab>('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSaved = currentBook ? savedBooks.some((b) => b.id === currentBook.id) : false;

  const generateSummary = async () => {
    if (!currentBook || summary) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await fetchAISummary(currentBook);
      setSummary(data);
    } catch {
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSlides = async () => {
    if (!summary || slides) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await fetchAISlides(summary);
      setSlides(data);
    } catch {
      setError('Failed to generate slides. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAudio = async () => {
    if (!summary || audioUrl) return;
    setIsGenerating(true);
    setError(null);
    try {
      const url = await fetchAIAudio(summary);
      setAudioUrl(url);
    } catch {
      setError('Failed to generate audio. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'summary') generateSummary();
    else if (activeTab === 'slides' && summary) generateSlides();
    else if (activeTab === 'audio' && summary) generateAudio();
  }, [activeTab]);

  if (!currentBook) return null;

  const tabs: { id: AITab; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'AI Summary', icon: <FileText className="w-4 h-4" /> },
    { id: 'audio', label: 'Audio Overview', icon: <Headphones className="w-4 h-4" /> },
    { id: 'slides', label: 'Visual Summary', icon: <Presentation className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Book Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 sm:mb-10"
      >
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          {/* Cover */}
          <div className="flex-shrink-0 self-center sm:self-start">
            <div className="w-40 sm:w-48 h-56 sm:h-72 rounded-2xl overflow-hidden shadow-xl shadow-amber-100/50 dark:shadow-amber-900/20 bg-muted">
              <img
                src={currentBook.coverImage}
                alt={currentBook.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-book.svg';
                }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground/90 tracking-tight leading-tight mb-2">
                {currentBook.title}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-3">
                by {currentBook.author}
              </p>
              {currentBook.description && (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-4 mb-4">
                  {currentBook.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {currentBook.categories.slice(0, 4).map((cat, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
                    {cat}
                  </span>
                ))}
                {currentBook.isFree && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                    Free
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                onClick={() => toggleSaveBook(currentBook)}
                variant={isSaved ? 'secondary' : 'outline'}
                className="rounded-xl"
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4 mr-2" /> : <Bookmark className="w-4 h-4 mr-2" />}
                {isSaved ? 'Saved' : 'Save for Later'}
              </Button>
              {currentBook.isFree && currentBook.fullTextUrl && (
                <Button
                  onClick={() => setCurrentView('reader')}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Read Free
                </Button>
              )}
              {currentBook.previewLink && (
                <Button
                  variant="outline"
                  onClick={() => window.open(currentBook.previewLink, '_blank')}
                  className="rounded-xl"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}
              {currentBook.buyLink && (
                <Button
                  variant="outline"
                  onClick={() => window.open(currentBook.buyLink, '_blank')}
                  className="rounded-xl"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Buy
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="rounded-2xl border-border/50 overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-border/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-medium
                  transition-colors relative cursor-pointer
                  ${activeTab === tab.id
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5 sm:p-8 min-h-[400px]">
            <AnimatePresence mode="wait">
              {/* Error Display */}
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-xl mb-4"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              {/* Loading State */}
              {isGenerating && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
                  <p className="text-muted-foreground text-sm">
                    {activeTab === 'summary' && 'Generating AI summary...'}
                    {activeTab === 'slides' && 'Creating visual summary...'}
                    {activeTab === 'audio' && 'Generating audio overview...'}
                  </p>
                  <p className="text-muted-foreground/60 text-xs mt-2">
                    This may take a moment
                  </p>
                </motion.div>
              )}

              {/* Summary Tab */}
              {!isGenerating && activeTab === 'summary' && summary && (
                <motion.div
                  key="summary-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-foreground/90 mb-3 flex items-center gap-2">
                      <ChevronRight className="w-5 h-5 text-amber-500" />
                      Introduction
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {summary.introduction}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground/90 mb-3 flex items-center gap-2">
                      <ChevronRight className="w-5 h-5 text-amber-500" />
                      Core Ideas
                    </h3>
                    <div className="space-y-3">
                      {summary.coreIdeas.map((idea, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {idea}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground/90 mb-3 flex items-center gap-2">
                      <ChevronRight className="w-5 h-5 text-amber-500" />
                      Key Takeaways
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {summary.keyTakeaways.map((takeaway, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {takeaway}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Audio Tab */}
              {!isGenerating && activeTab === 'audio' && audioUrl && (
                <motion.div
                  key="audio-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                      <Volume2 className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground/90">
                      Audio Overview
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Listen to a ~10 minute summary of this book
                    </p>
                  </div>
                  <AudioPlayer src={audioUrl} />
                </motion.div>
              )}

              {/* Slides Tab */}
              {!isGenerating && activeTab === 'slides' && slides && (
                <motion.div
                  key="slides-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <SlideCarousel slides={slides} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
