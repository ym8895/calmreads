'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { categories } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, X, ArrowRight, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { CategoryBookIcon } from './ArtisticBook';

export function ProfileView() {
  const { selectedInterests, toggleInterest, setCurrentView, savedBooks, recentBooks } = useSoftScrollStore();
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackCat, setFeedbackCat] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackMsg.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { submitFeedback } = await import('@/lib/api');
      await submitFeedback(feedbackMsg, feedbackCat);
      setFeedbackSent(true);
      setFeedbackMsg('');
      setTimeout(() => setFeedbackSent(false), 3000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground/90 tracking-tight mb-2">
          Your Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your interests and preferences
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 gap-4 mb-8"
      >
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <div className="text-3xl font-bold text-[#8FB9A8]">{savedBooks.length}</div>
          <div className="text-sm text-muted-foreground">Saved Books</div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <div className="text-3xl font-bold text-[#8FB9A8]">{recentBooks.length}</div>
          <div className="text-sm text-muted-foreground">Recently Viewed</div>
        </div>
      </motion.div>

      {/* Interests Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Your Interests</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentView('interests')}
            className="rounded-xl text-sm"
          >
            Edit <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {selectedInterests.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-2xl">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No interests selected</p>
            <Button
              onClick={() => setCurrentView('interests')}
              className="rounded-xl bg-[#8FB9A8] hover:bg-[#7AA896]"
            >
              Select Interests
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((interestId) => {
              const cat = categories.find(c => c.id === interestId);
              return cat ? (
                <div
                  key={interestId}
                  className="flex items-center gap-2 px-3 py-2 bg-[#D4E6E0] dark:bg-[#2C4A3F] rounded-full"
                >
                  <span className="text-sm text-[#2C4A3F] dark:text-[#8FB9A8]">{cat.name}</span>
                  <button
                    onClick={() => toggleInterest(interestId)}
                    className="hover:bg-[#8FB9A8]/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-[#2C4A3F] dark:text-[#8FB9A8]" />
                  </button>
                </div>
              ) : null;
            })}
          </div>
        )}
      </motion.div>

      {/* Feedback Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mt-8 pt-6 border-t border-border/50"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Send Feedback
        </h2>
        
        {feedbackSent ? (
          <div className="flex items-center gap-3 p-4 bg-[#D4E6E0]/50 dark:bg-[#2C4A3F]/30 rounded-xl">
            <CheckCircle className="w-6 h-6 text-[#8FB9A8]" />
            <span className="text-foreground">Thank you for your feedback!</span>
          </div>
        ) : (
          <div className="space-y-3">
            <select
              value={feedbackCat}
              onChange={(e) => setFeedbackCat(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-sm"
            >
              <option value="general">General</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
            </select>
            <textarea
              value={feedbackMsg}
              onChange={(e) => setFeedbackMsg(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#8FB9A8]"
            />
            <Button
              onClick={handleSubmitFeedback}
              disabled={!feedbackMsg.trim() || isSubmitting}
              className="w-full rounded-xl bg-[#8FB9A8] hover:bg-[#7AA896]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⟳</span> Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> Send Feedback
                </span>
              )}
            </Button>
          </div>
        )}
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-12 pt-6 border-t border-border/50"
      >
        <div className="text-center text-sm text-muted-foreground">
          <p>SoftScroll v1.96.2</p>
          <p className="text-xs mt-1">Made with peace in mind</p>
        </div>
      </motion.div>
    </div>
  );
}