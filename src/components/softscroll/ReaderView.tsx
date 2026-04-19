'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Minus, Plus, Type, Maximize2, Minimize2, ExternalLink, BookOpen } from 'lucide-react';

export function ReaderView() {
  const { currentBook, readerSettings, updateReaderSettings } = useSoftScrollStore();
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchContent = useCallback(async () => {
    if (!currentBook) return;

    setIsLoading(true);
    setError('');
    setContent('');

    try {
      // Strategy 1: Try Open Library works API for ebook access
      if (currentBook.id.startsWith('ol-')) {
        const workKey = currentBook.id.replace('ol-', '').replace('/works', '');

        // Try to get the work details with ebook info
        const workRes = await fetch(
          `https://openlibrary.org${workKey}.json`,
          { signal: AbortSignal.timeout(8000) }
        );

        if (workRes.ok) {
          const workData = await workRes.json();
          const description = typeof workData.description === 'string'
            ? workData.description
            : workData.description?.value || '';

          // Check if there's an ebook available with full text
          const ebook = workData.ebooks?.[0] || workData.ebook_access;
          const hasFullText = ebook?.read_url || ebook?.borrow_url || workData.ebook_access === 'read';

          // Try to fetch the description + table of contents for substantial content
          const tocEntries = workData.table_of_contents;
          let fullContent = description || '';

          // Add table of contents if available
          if (tocEntries && Array.isArray(tocEntries)) {
            const tocText = tocEntries
              .map((entry: Record<string, unknown>, i: number) => {
                const title = typeof entry === 'string' ? entry : entry.title || entry.label || '';
                return title ? `${i + 1}. ${title}` : null;
              })
              .filter(Boolean)
              .join('\n');

            if (tocText) {
              fullContent += '\n\n--- Table of Contents ---\n\n' + tocText;
            }
          }

          // Add subjects if available
          if (workData.subjects && Array.isArray(workData.subjects) && workData.subjects.length > 0) {
            fullContent += '\n\n--- Subjects & Themes ---\n\n' + workData.subjects.slice(0, 20).join(', ');
          }

          if (fullContent.length > 100) {
            setContent(fullContent);
            setIsLoading(false);

            // If full text is available externally, show a link
            if (hasFullText) {
              setError('external');
            }
            return;
          }
        }
      }

      // Strategy 2: Try Google Books preview
      if (currentBook.id.startsWith('gb-')) {
        const gbId = currentBook.id.replace('gb-', '');
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes/${gbId}`,
          { signal: AbortSignal.timeout(8000) }
        );

        if (res.ok) {
          const data = await res.json();
          const volumeInfo = data.volumeInfo || {};
          const accessInfo = data.accessInfo || {};
          const description = typeof volumeInfo.description === 'string'
            ? volumeInfo.description
            : '';

          // Check if the book has a preview available
          if (accessInfo.viewability === 'ALL_PUBLIC' || accessInfo.viewability === 'PARTIAL') {
            if (description && description.length > 100) {
              let bookContent = description;

              // Add categories
              if (volumeInfo.categories) {
                bookContent += '\n\n--- Categories ---\n\n' + volumeInfo.categories.join(', ');
              }

              // Add main description from subtitle
              if (volumeInfo.subtitle) {
                bookContent = `**Subtitle:** ${volumeInfo.subtitle}\n\n` + bookContent;
              }

              setContent(bookContent);
              setIsLoading(false);
              setError('external');
              return;
            }
          }
        }
      }

      // No content available in-app
      setError('unavailable');
    } catch (err) {
      console.error('Error fetching book content:', err);
      setError('unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [currentBook]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

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

  // Determine the external read URL
  const externalReadUrl = currentBook.previewLink || currentBook.fullTextUrl || '';

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
        ) : content && error === 'external' ? (
          <div
            ref={contentRef}
            className="prose prose-stone dark:prose-invert max-w-none"
            style={{
              fontSize: `${readerSettings.fontSize}px`,
              lineHeight: readerSettings.lineHeight,
            }}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground/90">
              {currentBook.title}
            </h2>
            <p className="text-muted-foreground mb-4 italic">
              by {currentBook.author}
            </p>

            <div
              className="text-foreground/80 whitespace-pre-line"
            >
              {content}
            </div>

            {/* Banner to read full book */}
            <div className="mt-8 p-5 rounded-2xl bg-[#D4E6E0]/60 dark:bg-[#2C4A3F]/30 border border-[#C8DDD5] dark:border-[#344E44]">
              <div className="flex items-start gap-3">
                <BookOpen className="w-6 h-6 text-[#7AA896] dark:text-[#8FB9A8] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground/90 text-sm mb-1">
                    Read the Full Book
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    The complete text is available for free. Open it below for the full reading experience.
                  </p>
                  <a
                    href={externalReadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8FB9A8] hover:bg-[#7AA896] text-white font-medium text-sm transition-colors"
                  >
                    Open Full Book
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : error === 'unavailable' ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground/80 mb-2">
              Full Text Not Available In-App
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6 mx-auto">
              This book&apos;s full text cannot be loaded directly in the reader. Click below to read it on its original platform with a clean reading experience.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {currentBook.fullTextUrl && (
                <a
                  href={currentBook.fullTextUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#8FB9A8] hover:bg-[#7AA896] text-white font-medium text-sm transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Read on Open Library
                </a>
              )}
              {currentBook.previewLink && (
                <a
                  href={currentBook.previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[#8FB9A8] text-[#7AA896] hover:bg-[#D4E6E0]/30 font-medium text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview on Google Books
                </a>
              )}
            </div>
          </div>
        ) : (
          <div
            className="prose prose-stone dark:prose-invert max-w-none"
            style={{
              fontSize: `${readerSettings.fontSize}px`,
              lineHeight: readerSettings.lineHeight,
            }}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground/90">
              {currentBook.title}
            </h2>
            <p className="text-muted-foreground mb-4 italic">
              by {currentBook.author}
            </p>
            <hr className="border-border/30 my-6" />
            <div
              className="text-foreground/80 whitespace-pre-line"
            >
              {content}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
