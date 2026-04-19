# SoftScroll — Calm Book Discovery

A peaceful, distraction-free web application for discovering, reading, and understanding books. Built with Next.js and TypeScript.

## Features

- **Interest Selection** — Choose from 48 curated book categories
- **Smart Recommendations** — Books from Open Library & Google Books APIs
- **Free Reading** — Read books directly if freely available
- **AI Summary** — 500-word structured summary powered by LLM
- **Audio Overview** — Text-to-speech audio playback
- **Visual Summary** — 10-slide carousel presentation
- **Save for Later** — Persistent reading list (local storage)
- **Dark/Light Mode** — System-aware theme switching
- **Clean Reader** — Adjustable font size, line spacing, fullscreen mode

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State**: Zustand with persistence
- **AI**: z-ai-web-dev-sdk (LLM + TTS)
- **Book APIs**: Open Library, Google Books
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm or bun

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

### Environment

The app runs on `http://localhost:3000` by default.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main SPA entry point
│   ├── layout.tsx                  # Root layout with calm theme
│   ├── globals.css                 # Warm cream/amber color palette
│   └── api/
│       ├── books/
│       │   ├── recommend/route.ts  # POST /api/books/recommend
│       │   └── [id]/route.ts       # GET /api/books/:id
│       └── ai/
│           ├── summary/route.ts    # POST /api/ai/summary
│           ├── slides/route.ts     # POST /api/ai/slides
│           └── audio/route.ts      # POST /api/ai/audio
├── components/
│   └── softscroll/
│       ├── Header.tsx              # App header with navigation
│       ├── InterestPicker.tsx      # Category selection grid
│       ├── DiscoverView.tsx        # Book recommendations view
│       ├── BookCard.tsx            # Book card component
│       ├── BookDetailView.tsx      # Book detail with AI features
│       ├── ReaderView.tsx          # Clean reading experience
│       ├── AudioPlayer.tsx         # Audio player with waveform
│       ├── SlideCarousel.tsx       # 10-slide visual summary
│       └── SavedBooksView.tsx      # Saved books list
├── lib/
│   ├── api.ts                      # API client functions
│   ├── store.ts                    # Zustand store
│   ├── types.ts                    # TypeScript types
│   └── categories.ts               # 48 book categories
└── public/
    ├── favicon.svg                 # App favicon
    ├── logo.svg                    # App logo
    └── placeholder-book.svg        # Book cover placeholder
```

## API Endpoints

### Books

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/books/recommend` | Get book recommendations by interests |
| GET | `/api/books/:id` | Get book details by ID |

### AI Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/summary` | Generate 500-word AI summary |
| POST | `/api/ai/slides` | Generate 10-slide visual summary |
| POST | `/api/ai/audio` | Generate audio overview |

## Design Philosophy

SoftScroll is designed as a **calm reading sanctuary**:

- Warm cream & amber color palette
- Large whitespace and breathing room
- Smooth 300ms transitions
- Rounded components (16px+ border-radius)
- No clutter, no popups, no distractions
- Typography focused on readability
