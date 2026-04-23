'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { ChevronRight, BookOpen, Sparkles, Headphones, Clock, Heart, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  const { setCurrentView } = useSoftScrollStore();

  const handleGetStarted = () => {
    setCurrentView('interests');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="relative w-32 h-32 mx-auto mb-6">
              <Image
                src="/CalmReads.webp"
                alt="CalmReads"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              A CalmReads App
            </p>
          </motion.div>

          {/* Product Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-foreground mb-4"
          >
            SoftScroll
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8"
          >
            Quiet reading for curious minds
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-12"
          >
            Discover books through calm, curated summaries. 
            Let AI guide you to your next favorite read — no overwhelm, just peaceful discovery.
          </motion.p>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl cursor-pointer"
          >
            Start Discovering
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-muted/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Search, title: 'Pick Interests', desc: 'Select your favorite genres and topics' },
              { icon: BookOpen, title: 'Discover', desc: 'Browse curated book recommendations' },
              { icon: Sparkles, title: 'Get Summary', desc: 'AI creates detailed narratives', isAI: true },
              { icon: Headphones, title: 'Listen', desc: 'Audio playback in the app' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                {'isAI' in item && item.isAI && (
                  <p className="text-xs text-muted-foreground/60 italic mt-3 max-w-[180px] mx-auto">
                    Blending AI with thoughtful curation, these summaries offer a gentle feel for the book—not a replacement.
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why SoftScroll?
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Clock, title: 'Save Time', desc: 'Get key insights from any book in minutes, not hours' },
              { icon: Sparkles, title: 'AI Powered', desc: 'Detailed summaries crafted by AI for deeper understanding' },
              { icon: Heart, title: 'Calm Design', desc: 'No ads, no feeds, no overwhelm — just reading' },
              { icon: BookOpen, title: 'Curated Collection', desc: '200+ books across 50 categories waiting for you' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 + i * 0.1 }}
                className="flex gap-4 p-6 rounded-2xl bg-card/50 border border-border/50"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          Ready to discover?
        </h2>
        <button
          onClick={handleGetStarted}
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl cursor-pointer"
        >
          Start Discovering
          <ArrowRight className="w-5 h-5" />
        </button>

        <footer className="mt-20 pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            © 2024 SoftScroll by CalmReads. Built with peace in mind.
          </p>
        </footer>
      </section>
    </div>
  );
}