# SoftScroll Project Context

## Project Overview
CalmReads - A book discovery app with AI summaries and audio playback.

## Current Tech Stack
- Next.js 16 (App Router)
- Tailwind CSS
- Zustand (state management)
- Supabase (tracking)
- Google Books + Open Library APIs

## Key Files
- `src/components/softscroll/DiscoverView.tsx` - Main discovery with tabs
- `src/components/softscroll/Header.tsx` - Search bar
- `src/components/softscroll/BookCard.tsx` - Book display + tracking
- `src/app/api/books/search/route.ts` - Search with content filtering
- `src/app/api/books/trending/route.ts` - Trending books

## Recent Changes
- Added kid-safe content filtering (explicit keywords + categories)
- Trending shows books immediately, covers load in background
- Header search syncs to Search tab

## Important Notes
- Don't push code until checking thoroughly
- Books load blank initially, thumbnails come after (known issue)
- Future: Separate adult content app

## Documentation
- `ROADMAP.md` - Project roadmap
- `DEBUGGING.md` - Issue tracking

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
