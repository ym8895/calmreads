'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Slide } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SlideCarouselProps {
  slides: Slide[];
}

export function SlideCarousel({ slides }: SlideCarouselProps) {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  const slideColors = [
    'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20',
    'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20',
    'from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20',
    'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20',
    'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20',
    'from-lime-50 to-green-50 dark:from-lime-950/30 dark:to-green-950/20',
    'from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/30 dark:to-pink-950/20',
    'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20',
    'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20',
    'from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20',
  ];

  return (
    <div className="space-y-4">
      {/* Slide Counter */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          Slide {current + 1} of {slides.length}
        </span>
        <div className="flex gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === current
                  ? 'bg-amber-500 w-6'
                  : 'bg-muted-foreground/20 hover:bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Slide Display */}
      <div className="relative overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`bg-gradient-to-br ${slideColors[current % slideColors.length]} rounded-2xl p-6 sm:p-10 min-h-[320px] flex flex-col justify-center border border-border/30`}
          >
            {/* Slide Number Badge */}
            <div className="mb-4">
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/60 dark:bg-black/20 text-muted-foreground">
                {current + 1} / {slides.length}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground/90 mb-6 leading-tight">
              {slides[current].title}
            </h3>

            {/* Points */}
            <div className="space-y-3">
              {slides[current].points.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className="flex items-start gap-3"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <p className="text-sm sm:text-base text-foreground/70 leading-relaxed">
                    {point}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="icon"
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-black/60 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-black/60 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
