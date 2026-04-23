'use client';

import { motion } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import { Home, Search, Bookmark, User } from 'lucide-react';

export function BottomNav() {
  const { currentView, setCurrentView, savedBooks } = useSoftScrollStore();

  const navItems = [
    { id: 'interests', icon: Home, label: 'Home' },
    { id: 'discover', icon: Search, label: 'Discover' },
    { id: 'saved', icon: Bookmark, label: 'Saved', badge: savedBooks.length },
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur-md border-t border-border/50 px-2 py-1"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors relative ${
                isActive ? 'text-[#8FB9A8]' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#8FB9A8] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomNav"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#8FB9A8] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}