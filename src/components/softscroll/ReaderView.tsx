'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Minus, Plus, Type, Sun, Moon, Maximize2, Minimize2 } from 'lucide-react';

export function ReaderView() {
  const { currentBook, readerSettings, updateReaderSettings, setCurrentView } = useSoftScrollStore();
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!currentBook?.fullTextUrl) return;

    const fetchContent = async () => {
      setIsLoading(true);
      try {
        // Try to fetch from Open Library or Gutenberg
        if (currentBook.id.startsWith('ol-')) {
          const res = await fetch(
            `https://openlibrary.org${currentBook.id.replace('ol-', '')}.json`,
            { next: { revalidate: 3600 } }
          );
          if (res.ok) {
            const data = await res.json();
            const description = typeof data.description === 'string'
              ? data.description
              : data.description?.value || '';
            if (description) {
              setContent(description);
              setIsLoading(false);
              return;
            }
          }
        }

        // Fallback: show a helpful message with a link
        setContent('');
      } catch {
        setContent('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [currentBook]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!currentBook) return null;

  return (
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-background pt-4 overflow-y-auto' : ''}`}>
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Card className="rounded-2xl border-border/50 p-3 sm:p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Font Size */}
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateReaderSettings({ fontSize: Math.max(12, readerSettings.fontSize - 2) })}
                className="w-8 h-8 rounded-lg"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="text-sm text-muted-foreground w-8 text-center font-mono">
                {readerSettings.fontSize}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateReaderSettings({ fontSize: Math.min(28, readerSettings.fontSize + 2) })}
                className="w-8 h-8 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Line Height */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Spacing</span>
              {[1.5, 1.8, 2.0, 2.4].map((lh) => (
                <button
                  key={lh}
                  onClick={() => updateReaderSettings({ lineHeight: lh })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    readerSettings.lineHeight === lh
                      ? 'bg-[#D4E6E0] text-[#2C4A3F] dark:bg-[#2C4A3F] dark:text-[#8FB9A8]'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {lh}
                </button>
              ))}
            </div>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-lg"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Reading Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-card border border-border/50 rounded-2xl p-6 sm:p-10 md:p-14"
      >
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded-lg w-3/4" />
            <div className="h-4 bg-muted rounded-lg w-full" />
            <div className="h-4 bg-muted rounded-lg w-full" />
            <div className="h-4 bg-muted rounded-lg w-5/6" />
            <div className="h-4 bg-muted rounded-lg w-full" />
            <div className="h-4 bg-muted rounded-lg w-4/5" />
          </div>
        ) : content ? (
          <div
            className="prose prose-stone dark:prose-invert max-w-none"
            style={{
              fontSize: `${readerSettings.fontSize}px`,
              lineHeight: readerSettings.lineHeight,
            }}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-foreground/90">
              {currentBook.title}
            </h2>
            <p className="text-muted-foreground mb-2 italic">
              by {currentBook.author}
            </p>
            <hr className="border-border/30 my-6" />
            <div
              className="text-foreground/80 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground/80 mb-2">
              Book Preview
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6 mx-auto">
              The full text of this book is available on Open Library. Click below to read it in its entirety with a clean, ad-free reading experience.
            </p>
            <a
              href={currentBook.fullTextUrl || currentBook.previewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#8FB9A8] hover:bg-[#7AA896] text-white font-medium text-sm transition-colors"
            >
              Read on Open Library
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}
