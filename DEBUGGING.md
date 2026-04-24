# Debugging & Issues Log

## Date: April 2026

---

## Issue 1: Tab Navigation Not Working
- **Date:** April 24, 2026
- **Problem:** handleTabChange function was missing
- **Fix:** Added handleTabChange function
- **File:** DiscoverView.tsx

---

## Issue 2: Category Icons Low Quality
- **Date:** April 24, 2026
- **Problem:** PNG category images were low quality/basic
- **Fix:** Changed to SVG patterns + emoji display
- **File:** ArtisticBook.tsx

---

## Issue 3: Search Not Working
- **Date:** April 24, 2026
- **Problem:** Search filtered locally instead of calling external API
- **Fix:** Created /api/books/search endpoint + combined Google Books + Open Library
- **File:** search/route.ts, api.ts, DiscoverView.tsx

---

## Issue 4: Search Results No Images
- **Date:** April 24, 2026
- **Problem:** API returned 'thumbnail' but BookCard expected 'coverImage'
- **Fix:** Added coverImage field mapping in search API
- **File:** search/route.ts

---

## Issue 5: Header Search Not Connecting to Search Tab
- **Date:** April 24, 2026
- **Problem:** Header search didn't switch to Search tab
- **Fix:** Added setDiscoverTab('search') call in header search
- **File:** Header.tsx

---

## Issue 6: Category Filter Not Matching
- **Date:** April 24, 2026
- **Problem:** Google Books categories don't match our categories
- **Fix:** Disabled category filtering in search temporarily
- **File:** DiscoverView.tsx

---

## Issue 7: Recommended Tab Not Loading Books
- **Date:** April 24, 2026
- **Problem:** Tab switch didn't auto-load recommended books
- **Fix:** Added handleTabChange logic to fetch fresh books on switch
- **File:** DiscoverView.tsx

---

## Issue 8: Book Tracking in Usage Logs
- **Date:** April 24, 2026
- **Problem:** Couldn't see which book caused API failures
- **Fix:** Added book_title, book_author columns to api_usage table + added tracking code
- **Files:** usage-logger.ts, ai-client.ts, *route.ts files

- **Supabase SQL needed:**
```sql
ALTER TABLE api_usage 
ADD COLUMN book_title TEXT,
ADD COLUMN book_author TEXT;
```

---

## Issue 9: Trending Tab Images Missing (TODO)
- **Date:** April 24, 2026
- **Problem:** Trending data only has bookId and title, no cover images
- **Status:** Open - need to fetch book details or improve data source

---

## Issue 10: Search Tab Shows Only 1 Book After Switch
- **Date:** April 24, 2026
- **Problem:** Old search results persisted when switching tabs
- **Fix:** Clear search query and results before loading recommended
- **File:** DiscoverView.tsx

--- 

## Known Limitations
1. No category filtering in search (Google Books categories different)
2. Trending has no cover images
3. No offline mode yet
4. No bookmarks yet