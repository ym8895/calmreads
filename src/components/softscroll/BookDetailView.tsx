'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { fetchAISummary, fetchAISlides, fetchAIAudio, fetchAIStory } from '@/lib/api';
import type { AISummary, Slide, AIStory } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import {
  FileText, Headphones, LayoutGrid, BookOpen,
  ChevronRight, Volume2, Loader2, AlertCircle
} from 'lucide-react';
import { AudioPlayer, stopGlobalSpeech, AIAudioPlayer } from './AudioPlayer';
import { ArtisticBookCover } from './ArtisticBook';
import { SlideCarousel } from './SlideCarousel';

type AITab = 'summary' | 'story' | 'audio' | 'slides';

export function BookDetailView() {
  const { currentBook, savedBooks, toggleSaveBook, summary, setSummary, slides, setSlides, setCurrentView, audioUrl, setAudioUrl, addRecentBook } = useSoftScrollStore();
  const [activeTab, setActiveTab] = useState<AITab>('summary');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStory, setLocalStory] = useState<AIStory | null>(null);

  const isSaved = currentBook ? savedBooks.some((b) => b.id === currentBook.id) : false;

  // Stop audio and clear errors when switching to a different book
  useEffect(() => {
    setError(null);
    return () => {
      stopGlobalSpeech();
    };
  }, [currentBook?.id]);

  const generateSummary = async () => {
    if (!currentBook) return;
    if (summary) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await fetchAISummary(currentBook);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSlides = async () => {
    if (!summary || slides) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await fetchAISlides(summary, currentBook);
      setSlides(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate slides. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAudio = async () => {
    if (!summary || audioUrl) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await fetchAIAudio(summary);
      if (data.useBrowserTts) {
        setAudioUrl(data.text || '');
      } else {
        setAudioUrl(data.audioUrl || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStory = async () => {
    if (!currentBook) return;
    if (localStory) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await fetchAIStory(currentBook);
      setLocalStory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'summary') generateSummary();
    else if (activeTab === 'slides' && summary) generateSlides();
    else if (activeTab === 'audio' && summary) generateAudio();
    else if (activeTab === 'story' && currentBook && !localStory) generateStory();
  }, [activeTab, currentBook?.id, summary, slides]);

  useEffect(() => {
    if (activeTab === 'summary' && currentBook && !summary) {
      generateSummary();
    }
  }, [activeTab, summary, currentBook?.id]);

  if (!currentBook) return null;

  const tabs: { id: AITab; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Summary', icon: <FileText className="w-4 h-4" /> },
    { id: 'slides', label: 'Slides', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'audio', label: 'Audio', icon: <Headphones className="w-4 h-4" /> },
    { id: 'story', label: 'Story (15 min)', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-6 py-4 sm:py-12">
      {/* Book Hero - Artistic Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 sm:mb-10"
      >
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          {/* Artistic Book Cover */}
          <div className="flex-shrink-0 self-center sm:self-start">
            <ArtisticBookCover
              title={currentBook.title}
              author={currentBook.author}
              coverImage={currentBook.coverImage}
              size="lg"
            />
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
              </div>
            </div>

            {/* Mobile-only actions (on XL+ these appear in right panel) */}
            <div className="xl:hidden flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => toggleSaveBook(currentBook)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-[#D4E6E0] dark:bg-[#2C4A3F]/40 text-[#2C4A3F] dark:text-[#8FB9A8]'
                    : 'bg-muted/40 hover:bg-muted/60 text-muted-foreground'
                }`}
              >
                {isSaved ? 'Saved' : 'Save for Later'}
              </button>
              {currentBook.previewLink && (
                <a
                  href={currentBook.previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-[#8FB9A8] hover:bg-[#7AA896] text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  Book Link
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
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
                    ? 'text-[#7AA896] dark:text-[#8FB9A8]'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8FB9A8] rounded-full"
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
              {error && !isGenerating && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 text-center py-12"
                >
                  <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="text-sm text-red-500 max-w-md">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      if (activeTab === 'summary') { setSummary(null); generateSummary(); }
                      else if (activeTab === 'slides') { setSlides(null); generateSlides(); }
                    }}
                    className="px-5 py-2 rounded-xl bg-[#8FB9A8] hover:bg-[#7AA896] text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
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
                  <Loader2 className="w-10 h-10 text-[#8FB9A8] animate-spin mb-4" />
                  <p className="text-muted-foreground text-sm">
                    {activeTab === 'summary' && 'Generating AI summary...'}
                    {activeTab === 'slides' && 'Creating book slides...'}
                    {activeTab === 'audio' && 'Preparing audio player...'}
                    {activeTab === 'story' && 'Writing story...'}
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
                      <ChevronRight className="w-5 h-5 text-[#8FB9A8]" />
                      Introduction
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {typeof summary.introduction === 'string' && summary.introduction.startsWith('{') 
                        ? JSON.parse(summary.introduction)?.introduction || summary.introduction 
                        : summary.introduction}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground/90 mb-3 flex items-center gap-2">
                      <ChevronRight className="w-5 h-5 text-[#8FB9A8]" />
                      Core Ideas
                    </h3>
                    <div className="space-y-3">
                      {summary.coreIdeas.map((idea, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <span className="w-6 h-6 rounded-full bg-[#D4E6E0] dark:bg-[#2C4A3F] text-[#2C4A3F] dark:text-[#8FB9A8] text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{idea}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground/90 mb-3 flex items-center gap-2">
                      <ChevronRight className="w-5 h-5 text-[#8FB9A8]" />
                      Key Takeaways
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {summary.keyTakeaways.map((takeaway, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-[#E8E4D9]/60 dark:bg-[#2C4A3F]/30 border border-[#D4E6E0] dark:border-[#344E44]">
                          <p className="text-sm text-foreground/80 leading-relaxed">{takeaway}</p>
                        </div>
                      ))}
                    </div>
</div>
                </motion.div>
              )}

              {/* Audio Tab */}
              {!isGenerating && activeTab === 'audio' && summary && (
                <motion.div
                  key="audio-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#D4E6E0] dark:bg-[#2C4A3F] flex items-center justify-center mx-auto mb-4">
                      <Volume2 className="w-8 h-8 text-[#7AA896] dark:text-[#8FB9A8]" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground/90">Audio Overview</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Listen to an audio summary of this book
                    </p>
                  </div>
                  {audioUrl ? (
                    audioUrl.startsWith('data:') ? (
                      <AIAudioPlayer audioUrl={audioUrl} />
                    ) : (
                      <AudioPlayer text={audioUrl} />
                    )
                  ) : (
                    <p className="text-center text-muted-foreground">No audio available</p>
                  )}
                </motion.div>
              )}

              {/* Story Tab */}
              {!isGenerating && activeTab === 'story' && localStory && (
                <motion.div
                  key="story-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-foreground/90 mb-4">{localStory?.title || 'Book Story'}</h2>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                      {localStory?.introduction || 'Loading story...'}
                    </p>
                  </div>
                  {localStory?.chapters && localStory.chapters.length > 0 && localStory.chapters.map((chapter: { number: number; title: string; content: string }) => (
                    <div key={chapter.number} className="border-l-2 border-[#8FB9A8] pl-4">
                      <h3 className="text-lg font-semibold text-foreground/90 mb-2">
                        {chapter.number}. {chapter.title}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                        {chapter.content}
                      </p>
                    </div>
                  ))}
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

              {/* AI Disclaimer */}
              {(activeTab === 'summary' || activeTab === 'slides') && (
                <p className="text-xs text-muted-foreground/50 italic mt-8 pt-4 border-t border-border/30 text-center">
                  Blending AI with thoughtful curation, these summaries offer a gentle feel for the book—not a replacement.
                </p>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
