'use client';

import { motion } from 'framer-motion';
import { useSoftScrollStore } from '@/lib/store';
import type { Book } from '@/lib/types';
import { BookCard } from './BookCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, BookX, Search, Clock, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { categories } from '@/lib/categories';
import { fetchSearchBooks } from '@/lib/api';

export function DiscoverView() {
  const { recommendedBooks, setCurrentView, isLoading, selectedInterests, setRecommendedBooks, setIsLoading, searchQuery, setSearchQuery, recentBooks, discoverTab, setDiscoverTab } = useSoftScrollStore();
  const [sortBy, setSortBy] = useState<'default' | 'title' | 'year'>('default');
  const activeTab = discoverTab;
  const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

// Load trending books + fetch covers if missing
  useEffect(() => {
    if (activeTab === 'trending' && trendingBooks.length === 0) {
      setIsLoadingTrending(true);
      import('@/lib/api').then(async ({ fetchTrendingBooks }) => {
        try {
          let data = await fetchTrendingBooks(10, 24);
          
          // If no covers, try to fetch from Google Books
          const booksWithoutCovers = data.filter(t => !t.coverUrl);
          if (booksWithoutCovers.length > 0) {
            for (let t of booksWithoutCovers) {
              try {
                const res = await fetch(`/api/books/search?q=${encodeURIComponent(t.bookTitle)}`);
                const result = await res.json();
                if (result.books?.[0]?.coverImage) {
                  t.coverUrl = result.books[0].coverImage;
                  t.bookAuthor = result.books[0].author;
                }
              } catch {}
            }
          }
          
          setTrendingBooks(data.map(t => ({
            id: t.bookId,
            title: t.bookTitle,
            author: t.bookAuthor || 'Unknown Author',
            categories: [],
            description: '',
            coverImage: t.coverUrl || '',
          })));
        } finally {
          setIsLoadingTrending(false);
        }
      }).catch(() => setIsLoadingTrending(false));
    }
  }, [activeTab]);

  // Handle tab click - load fresh data when switching to recommended
  const handleTabChange = async (tab: 'recommended' | 'trending' | 'recent' | 'search') => {
    if (tab === 'recommended' && selectedInterests.length > 0) {
      // Clear search query and results first, then load recommended
      setSearchQuery('');
      setSearchResults([]);
      setDiscoverTab(tab);
      setIsLoading(true);
      try {
        const { fetchRecommendedBooks } = await import('@/lib/api');
        const books = await fetchRecommendedBooks(selectedInterests);
        setRecommendedBooks(books);
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setDiscoverTab(tab);
      // Clear search results when leaving search tab
      if (tab !== 'search') {
        setSearchQuery('');
        setSearchResults([]);
      }
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { fetchRecommendedBooks } = await import('@/lib/api');
      const books = await fetchRecommendedBooks(selectedInterests);
      setRecommendedBooks(books);
    } catch (error) {
      console.error('Failed to refresh books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load recommended books when Browse All is clicked - same as tab click
  const handleBrowseAll = async () => {
    if (selectedInterests.length > 0) {
      setIsLoading(true);
      setDiscoverTab('recommended');
      try {
        const { fetchRecommendedBooks } = await import('@/lib/api');
        const books = await fetchRecommendedBooks(selectedInterests);
        setRecommendedBooks(books);
      } catch (error) {
        console.error('Failed to load books:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setDiscoverTab('search');
      setSearchResults([]); // Clear previous results to trigger new search
    }
  };

  // Search when search tab is active
  useEffect(() => {
    const doSearch = async () => {
      if (activeTab === 'search' && searchQuery.trim()) {
        setIsLoadingSearch(true);
        try {
          const books = await fetchSearchBooks(searchQuery);
          setSearchResults(books);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setIsLoadingSearch(false);
        }
      }
    };
    
    const timer = setTimeout(doSearch, 500);
    return () => clearTimeout(timer);
  }, [activeTab, searchQuery]);

  // Filter and sort
  let filteredBooks = recommendedBooks;
  if (categoryFilter) {
    filteredBooks = filteredBooks.filter(b => 
      b.categories.includes(categoryFilter)
    );
  }
  if (searchQuery.trim() && activeTab !== 'search' && activeTab !== 'trending') {
    const q = searchQuery.toLowerCase();
    filteredBooks = filteredBooks.filter(b =>
      b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) ||
      b.categories.some(c => c.toLowerCase().includes(q))
    );
  }
  if (sortBy === 'title') filteredBooks = [...filteredBooks].sort((a, b) => a.title.localeCompare(b.title));
  if (sortBy === 'year') filteredBooks = [...filteredBooks].sort((a, b) => (b.publishedYear || 0) - (a.publishedYear || 0));

  // Determine which books to show based on active tab
  const displayBooks = activeTab === 'search' 
    ? searchResults 
    : activeTab === 'trending' 
      ? trendingBooks 
      : filteredBooks;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground/90 tracking-tight">
              Discover
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              Find your next favorite read
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBrowseAll}
              disabled={isLoading}
              className="rounded-xl border-border/60 text-sm"
            >
              Browse All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="rounded-xl border-border/60 text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-4 flex gap-1 bg-muted/30 p-1 rounded-xl w-fit flex-wrap"
      >
        {[
          { id: 'recommended', label: 'Recommended' },
          { id: 'trending', label: 'Trending' },
          { id: 'recent', label: 'Recent' },
          { id: 'search', label: 'Search' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.id === 'recent' && recentBooks.length > 0 && (
              <span className="ml-1.5 w-5 h-5 bg-[#8FB9A8]/20 text-[#8FB9A8] text-xs rounded-full inline-flex items-center justify-center">
                {recentBooks.length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <form onSubmit={handleSearchSubmit} className="w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, authors, categories..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#8FB9A8] transition-all"
            />
          </form>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl bg-muted/30 border border-border/30 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#8FB9A8] cursor-pointer"
        >
          <option value="default">Sort</option>
          <option value="title">Title A-Z</option>
          <option value="year">Newest First</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-muted/30 border border-border/30 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#8FB9A8] cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border/50 rounded-2xl p-5">
              <div className="flex gap-4">
                <Skeleton className="w-20 sm:w-24 h-28 sm:h-36 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <Skeleton className="h-5 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                  <Skeleton className="h-3 w-1/3 rounded-lg" />
                  <div className="flex gap-2 pt-4">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State - Only show on Recommended tab */}
      {!isLoading && activeTab === 'recommended' && recommendedBooks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <BookX className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground/80 mb-2">No books found</h3>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            We couldn&apos;t find books for the selected topics. Try choosing different interests or refreshing the page.
          </p>
          <Button onClick={handleRefresh} variant="outline" className="rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />Try Again
          </Button>
        </motion.div>
      )}

      {/* Books Grid - Show when Recommended tab has books */}
      {!isLoading && activeTab === 'recommended' && filteredBooks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {filteredBooks.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} compact />
          ))}
        </div>
      )}

      {/* Search Results */}
      {activeTab === 'search' && (
        <>
          {isLoadingSearch ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 sm:h-48 rounded-lg" />
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {searchResults.map((book, index) => (
                <BookCard key={book.id} book={book} index={index} compact />
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground/80 mb-2">No books found</h3>
              <p className="text-muted-foreground text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground/80 mb-2">Search for books</h3>
              <p className="text-muted-foreground text-sm">Enter a title, author, or topic</p>
            </div>
          )}
        </>
      )}

      {/* Trending Tab */}
      {!isLoadingTrending && activeTab === 'trending' && trendingBooks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {trendingBooks.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} compact />
          ))}
        </div>
      )}

      {/* Recently Viewed Tab */}
      {!isLoading && activeTab === 'recent' && recentBooks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {recentBooks.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} compact />
          ))}
        </div>
      )}

      {/* Recent Empty State only */}
      {!isLoading && activeTab === 'recent' && recentBooks.length === 0 && (
        <div className="text-center py-16">
          <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground/80 mb-2">No recently viewed</h3>
          <p className="text-muted-foreground text-sm">Books you view will appear here</p>
        </div>
      )}
    </div>
  );
}
