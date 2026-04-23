'use client';

import { motion } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { BookCard } from './BookCard';
import { Clock, BookOpen } from 'lucide-react';

export function HistoryView() {
  const { recentBooks } = useSoftScrollStore();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/90 tracking-tight mb-2 flex items-center gap-3">
          <Clock className="w-7 h-7 text-[#8FB9A8]" />
          Reading History
        </h1>
        <p className="text-muted-foreground">
          Books you've explored in this session
        </p>
      </motion.div>

      {/* Timeline */}
      {recentBooks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground/80 mb-2">No history yet</h3>
          <p className="text-muted-foreground text-sm">
            Books you view will appear here
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {recentBooks.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 bg-card/50 border border-border/30 rounded-xl hover:bg-card/80 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{book.title}</p>
                <p className="text-sm text-muted-foreground truncate">{book.author}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}