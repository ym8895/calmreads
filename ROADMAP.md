# CalmReads Ecosystem Roadmap

## Vision
Build a suite of apps for knowledge discovery - books, data, and insights from multiple sources.

---

## App Overview: SoftScroll

### One-line pitch
**"Audio summaries and free books for curious minds who don't have time to read"**

### The problem we solve
- People want to read more but don't have time
- Audible is expensive, Blinkist is text-only
- No single place for free books
- Existing apps are cluttered with ads

### Our solution
- AI-powered audio summaries for ANY book
- Free books from Gutenberg, Archive.org
- Clean, ad-free experience
- Personalized recommendations

### Target user
- Busy professionals who want to learn
- Students preparing for exams
- Anyone curious but time-constrained
- Indian market (first focus)

### Why we're different

| Feature | SoftScroll | Audible | Blinkist | Open Library |
|---------|-----------|---------|----------|--------------|
| Any book audio | Yes | No (limited) | No | No |
| Free books | Yes | No | No | Yes |
| Clean design | Yes | Yes | Yes | No |
| Indian focus | Yes | No | Few | No |
| Already live | Yes | Yes | Yes | Yes |

### Core value
- **Utility:** Listen to any book while commuting
- **Purpose:** Democratize knowledge - free for those who can't pay
- **Design:** No distractions, pure content

### Current Quality Issues (v1)

**Images:**
- Book covers can be low quality/blurry
- Need: Higher resolution covers from multiple sources
- Need: Better placeholder design
- Need: Consistent aspect ratios

**UI Enhancements:**
- Better loading skeletons
- More consistent spacing
- Improved color contrast
- Better empty states
- Smooth animations

### Revenue model (future)
- Freemium: Free tier (limited) + Premium ($5-10/mo)
- Premium: Unlimited audio, better voices, offline
- Ads in free tier (later, non-intrusive)
- B2B: Publishers pay for exposure

---

## Current App: SoftScroll

Book discovery + AI audio summaries for curious minds.

**Live features:**
- Book search (Google Books API)
- AI summaries, story, slides
- Audio playback (browser TTS)
- Personalized recommendations
- Feedback system

**Live URL:** calmreads.vercel.app

---

## Ideas Backlog

### P1 - Free Books Integration
- Add Project Gutenberg (70K+ free books)
- Add Open Library metadata
- Add Archive.org links
- Show "Free" badge vs paid

### P2 - Core Enhancements
- Voice preference (localStorage → auth later)
- Offline download for audio
- Bookmarks / save for later

### Future: CalmInsights (Data Journalism)
- Visual dashboards with hard facts + AI analysis
- Data sources: data.gov.in, World Bank, RBI, IMF
- MVP: India GDP growth chart + AI insights
- Ranking countries by normalized metrics

### Future: CalmAI
- AI for everything (general assistant)

---

## Data Sources to Explore

### Books
- Google Books API (integrated)
- Project Gutenberg (free)
- Open Library (metadata)
- Archive.org (free books)
- National Digital Library India (future)
- Indian Culture Portal (future)

### Data
- data.gov.in (India government)
- World Bank API
- RBI (Reserve Bank of India)
- IMF

---

## Technical Notes

### TTS Providers
- Browser TTS (free, default)
- ElevenLabs (premium, later)

### AI Providers (current)
- DeepSeek (primary)
- Groq
- Mistral
- Gemini (disabled - failed)

---

## SoftScroll v2.1.0.1 - Features to Implement

### From v1 Backlog (P1 & P2)
1. Voice preference - remember user's favorite voice
2. Offline download - save audio for offline play
3. Bookmarks / save for later
4. Gutenberg integration - free books

### New for v2.1.0

**5. User Accounts (Basic)**
- Email signup (simple, no social login)
- Save books to personal library
- Sync reading history to cloud
- Reading progress across devices

**6. Better AI Features**
- Chat with book (Q&A about content)
- Smart recommendations based on history
- Continue where you left off

**7. Book Reader**
- Read actual book content
- Integration with Gutenberg free books
- Reading progress tracking
- Night mode / themes

**8. Enhanced Discovery**
- Trending books (from Supabase)
- Category filters improved
- More personalization

---

### Restructuring Note
After SoftScroll stabilizes with all P1/P2 improvements, restructure to:
```
CalmReads/
├── softscroll/     ← Current app (rename)
├── insights/     ← Future: CalmInsights
└── ROADMAP.md    ← At root level
```
This will be done when ready for next app (CalmInsights).

Last updated: April 2026