'use client';

import { categories } from '@/lib/categories';

// Category icon image mapping (AI-generated icons)
const categoryIconImages: Record<string, string> = {
  'fiction': '/icons/categories/fiction.png',
  'non-fiction': '/icons/categories/non-fiction.png',
  'romance': '/icons/categories/romance.png',
  'thriller': '/icons/categories/thriller.png',
  'mystery': '/icons/categories/mystery.png',
  'psychology': '/icons/categories/psychology.png',
  'self-help': '/icons/categories/self-help.png',
  'spirituality': '/icons/categories/spirituality.png',
  'biography': '/icons/categories/biography.png',
  'autobiography': '/icons/categories/autobiography.png',
  'poetry': '/icons/categories/poetry.png',
  'drama': '/icons/categories/drama.png',
  'horror': '/icons/categories/horror.png',
  'adventure': '/icons/categories/adventure.png',
  'comedy': '/icons/categories/comedy.png',
  'crime': '/icons/categories/crime.png',
  'classic': '/icons/categories/classic.png',
  'business': '/icons/categories/business.png',
  'economics': '/icons/categories/economics.png',
  'politics': '/icons/categories/politics.png',
  'sociology': '/icons/categories/sociology.png',
  'technology': '/icons/categories/technology.png',
  'mathematics': '/icons/categories/mathematics.png',
  'medicine': '/icons/categories/medicine.png',
  'art': '/icons/categories/art.png',
  'music': '/icons/categories/music.png',
  'travel': '/icons/categories/travel.png',
  'cooking': '/icons/categories/cooking.png',
  'health': '/icons/categories/health.png',
  'parenting': '/icons/categories/parenting.png',
  'education': '/icons/categories/education.png',
  'nature': '/icons/categories/nature.png',
  'environment': '/icons/categories/environment.png',
  'astronomy': '/icons/categories/astronomy.png',
  'mythology': '/icons/categories/mythology.png',
  'humor': '/icons/categories/humor.png',
  'true-crime': '/icons/categories/true-crime.png',
  'memoir': '/icons/categories/memoir.png',
  'graphic-novels': '/icons/categories/graphic-novels.png',
  'young-adult': '/icons/categories/young-adult.png',
  'children': '/icons/categories/children.png',
  'war': '/icons/categories/war.png',
  'science-fiction': '/icons/categories/science-fiction.png',
  'fantasy': '/icons/categories/fantasy.png',
  'philosophy': '/icons/categories/philosophy.png',
  'religion': '/icons/categories/religion.png',
  'history': '/icons/categories/history.png',
  'science': '/icons/categories/science.png',
};

// Color families for watercolor-style backgrounds
const colorFamilies: Record<string, { bg: string; accent: string; spine: string; dark: string }> = {
  green:    { bg: 'from-[#D4E6E0] to-[#B8D4C8]', accent: '#7AA896', spine: '#5A7A6A', dark: 'from-[#2C4A3F]/60 to-[#344E44]/40' },
  blue:     { bg: 'from-[#C8D8E8] to-[#B0C8DC]', accent: '#6A9AB8', spine: '#4A7A98', dark: 'from-[#2A3E4F]/60 to-[#344E5E]/40' },
  pink:     { bg: 'from-[#F0D4DE] to-[#E8C0D0]', accent: '#C88898', spine: '#A86878', dark: 'from-[#4F2A35]/60 to-[#5E3444]/40' },
  purple:   { bg: 'from-[#DCD0E8] to-[#D0C0E0]', accent: '#9878B8', spine: '#7858A0', dark: 'from-[#3E2A50]/60 to-[#4E345E]/40' },
  amber:    { bg: 'from-[#E8DCC8] to-[#DCCFB8]', accent: '#B8A068', spine: '#988048', dark: 'from-[#4F3E2A]/60 to-[#5E4E34]/40' },
  red:      { bg: 'from-[#E8C8C8] to-[#E0B8B8]', accent: '#C87878', spine: '#A85858', dark: 'from-[#4F2A2A]/60 to-[#5E3434]/40' },
  teal:     { bg: 'from-[#C8E0DC] to-[#B0D4CC]', accent: '#68A898', spine: '#488878', dark: 'from-[#2A4F4A]/60 to-[#345E58]/40' },
  gold:     { bg: 'from-[#E8DCC0] to-[#DCD0A8]', accent: '#C8A848', spine: '#A88828', dark: 'from-[#4F4A2A]/60 to-[#5E5834]/40' },
};

const categoryColorMap: Record<string, string> = {
  fiction: 'green', nature: 'green', environment: 'green', 'self-help': 'green', health: 'green',
  mystery: 'blue', science: 'blue', technology: 'blue', astronomy: 'blue', education: 'blue',
  romance: 'pink', poetry: 'pink', children: 'pink', parenting: 'pink', art: 'pink',
  fantasy: 'purple', philosophy: 'purple', spirituality: 'purple', mythology: 'purple', music: 'purple',
  history: 'amber', biography: 'amber', autobiography: 'amber', memoir: 'amber', classic: 'amber',
  thriller: 'red', horror: 'red', crime: 'red', 'true-crime': 'red', war: 'red',
  'science-fiction': 'teal', adventure: 'teal', travel: 'teal', 'young-adult': 'teal', 'graphic-novels': 'teal',
  business: 'gold', economics: 'gold', politics: 'gold', sociology: 'gold',
  'non-fiction': 'blue', religion: 'gold', psychology: 'pink', drama: 'amber',
  comedy: 'gold', humor: 'gold', cooking: 'amber', medicine: 'teal', mathematics: 'purple',
};

// SVG motif generator for each category
const motifSVGs: Record<string, (color: string) => string> = {
  fiction: (c) => `<path d="M20 35 Q25 20 30 30 Q35 15 40 28" stroke="${c}" fill="none" stroke-width="2" stroke-linecap="round"/>`,
  'non-fiction': (c) => `<circle cx="30" cy="25" r="8" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="35" y1="30" x2="42" y2="37" stroke="${c}" stroke-width="1.5"/>`,
  romance: (c) => `<circle cx="28" cy="28" r="6" stroke="${c}" fill="none" stroke-width="1.5"/><circle cx="34" cy="24" r="6" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  thriller: (c) => `<path d="M25 15 L30 25 L25 35 L35 35" stroke="${c}" fill="none" stroke-width="1.5"/><circle cx="38" cy="15" r="4" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  mystery: (c) => `<circle cx="30" cy="25" r="10" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="37" y1="32" x2="43" y2="38" stroke="${c}" stroke-width="2"/>`,
  'science-fiction': (c) => `<path d="M30 15 L35 25 L30 22 L25 25 Z" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="30" y1="25" x2="30" y2="38" stroke="${c}" stroke-width="1.5"/>`,
  fantasy: (c) => `<path d="M25 30 Q30 15 35 30 Q33 25 30 35 Q27 25 25 30Z" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  philosophy: (c) => `<circle cx="30" cy="26" r="8" stroke="${c}" fill="none" stroke-width="1"/><circle cx="30" cy="26" r="4" stroke="${c}" fill="none" stroke-width="1"/>`,
  religion: (c) => `<path d="M25 20 L30 15 L35 20 L30 38Z" stroke="${c}" fill="none" stroke-width="1.5"/><circle cx="30" cy="26" r="2" fill="${c}"/>`,
  history: (c) => `<line x1="28" y1="15" x2="28" y2="38" stroke="${c}" stroke-width="2"/><line x1="22" y1="15" x2="34" y2="15" stroke="${c}" stroke-width="2"/><line x1="22" y1="20" x2="34" y2="20" stroke="${c}" stroke-width="1.5"/>`,
  science: (c) => `<circle cx="30" cy="22" r="7" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="30" y1="29" x2="30" y2="38" stroke="${c}" stroke-width="1.5"/>`,
  psychology: (c) => `<path d="M30 18 Q22 22 30 26 Q38 22 30 18Z" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="30" y1="26" x2="30" y2="32" stroke="${c}" stroke-width="1.5"/>`,
  'self-help': (c) => `<line x1="30" y1="38" x2="30" y2="22" stroke="${c}" stroke-width="2"/><path d="M24 28 Q30 18 36 28" stroke="${c}" fill="none" stroke-width="1.5"/><circle cx="30" cy="16" r="2" fill="${c}"/>`,
  spirituality: (c) => `<polygon points="30,15 32,22 38,22 33,26 35,33 30,29 25,33 27,26 22,22 28,22" stroke="${c}" fill="none" stroke-width="1"/>`,
  biography: (c) => `<circle cx="30" cy="20" r="6" stroke="${c}" fill="none" stroke-width="1.5"/><path d="M22 38 Q22 30 30 30 Q38 30 38 38" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  autobiography: (c) => `<path d="M22 18 L22 38 L38 38 L38 22" stroke="${c}" fill="none" stroke-width="1.5"/><path d="M22 18 Q30 14 38 22" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  poetry: (c) => `<circle cx="25" cy="28" r="4" stroke="${c}" fill="none" stroke-width="1"/><circle cx="33" cy="25" r="3" stroke="${c}" fill="none" stroke-width="1"/><circle cx="30" cy="20" r="3" stroke="${c}" fill="none" stroke-width="1"/>`,
  drama: (c) => `<circle cx="25" cy="28" r="6" stroke="${c}" fill="none" stroke-width="1.5"/><path d="M25 22 Q28 19 31 22" stroke="${c}" fill="none" stroke-width="1.5"/><circle cx="36" cy="28" r="6" stroke="${c}" fill="none" stroke-width="1.5"/><path d="M36 34 Q39 37 42 34" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  horror: (c) => `<line x1="30" y1="38" x2="30" y2="20" stroke="${c}" stroke-width="2" stroke-linecap="round"/><line x1="30" y1="20" x2="24" y2="15" stroke="${c}" stroke-width="1.5"/><line x1="30" y1="22" x2="36" y2="18" stroke="${c}" stroke-width="1.5"/><line x1="30" y1="24" x2="24" y2="21" stroke="${c}" stroke-width="1.5"/>`,
  adventure: (c) => `<path d="M30 15 L36 28 L30 24 L24 28 Z" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="24" y1="28" x2="36" y2="28" stroke="${c}" stroke-width="1"/>`,
  comedy: (c) => `<circle cx="30" cy="25" r="10" stroke="${c}" fill="none" stroke-width="1.5"/><circle cx="26" cy="22" r="1.5" fill="${c}"/><circle cx="34" cy="22" r="1.5" fill="${c}"/><path d="M25 30 Q30 34 35 30" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  crime: (c) => `<path d="M24 20 L30 15 L36 20 L36 30 L30 35 L24 30Z" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  classic: (c) => `<line x1="26" y1="15" x2="26" y2="38" stroke="${c}" stroke-width="2"/><line x1="34" y1="15" x2="34" y2="38" stroke="${c}" stroke-width="2"/><path d="M20 20 Q26 16 32 20 Q38 16 42 20" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  business: (c) => `<rect x="24" y="22" width="12" height="10" rx="1" stroke="${c}" fill="none" stroke-width="1.5"/><path d="M27 22 L27 17 L33 17 L33 22" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  economics: (c) => `<rect x="22" y="28" width="5" height="8" rx="1" stroke="${c}" fill="none" stroke-width="1"/><rect x="29" y="22" width="5" height="14" rx="1" stroke="${c}" fill="none" stroke-width="1"/><rect x="36" y="25" width="5" height="11" rx="1" stroke="${c}" fill="none" stroke-width="1"/>`,
  politics: (c) => `<line x1="30" y1="38" x2="30" y2="22" stroke="${c}" stroke-width="1.5"/><line x1="22" y1="22" x2="38" y2="22" stroke="${c}" stroke-width="1.5"/><path d="M22 22 L18 18 M38 22 L42 18" stroke="${c}" stroke-width="1.5"/>`,
  sociology: (c) => `<circle cx="30" cy="22" r="4" stroke="${c}" fill="none" stroke-width="1.5"/><circle cx="22" cy="32" r="3" stroke="${c}" fill="none" stroke-width="1"/><circle cx="38" cy="32" r="3" stroke="${c}" fill="none" stroke-width="1"/><line x1="28" y1="25" x2="24" y2="30" stroke="${c}" stroke-width="1"/><line x1="32" y1="25" x2="36" y2="30" stroke="${c}" stroke-width="1"/>`,
  technology: (c) => `<rect x="24" y="24" width="12" height="10" rx="2" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="28" y1="21" x2="28" y2="24" stroke="${c}" stroke-width="1.5"/><line x1="32" y1="21" x2="32" y2="24" stroke="${c}" stroke-width="1.5"/>`,
  mathematics: (c) => `<circle cx="30" cy="26" r="10" stroke="${c}" fill="none" stroke-width="1.5"/><path d="M30 16 Q30 26 40 26" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  medicine: (c) => `<line x1="30" y1="15" x2="30" y2="38" stroke="${c}" stroke-width="2"/><line x1="20" y1="26" x2="40" y2="26" stroke="${c}" stroke-width="2"/>`,
  art: (c) => `<circle cx="30" cy="25" r="8" stroke="${c}" fill="none" stroke-width="1.5"/><circle cx="26" cy="21" r="3" fill="${c}" opacity="0.3"/><circle cx="34" cy="28" r="2" fill="${c}" opacity="0.3"/>`,
  music: (c) => `<circle cx="24" cy="32" r="4" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="28" y1="32" x2="28" y2="16" stroke="${c}" stroke-width="1.5"/><path d="M28 16 Q34 14 34 20" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  travel: (c) => `<circle cx="30" cy="22" r="8" stroke="${c}" fill="none" stroke-width="1.5"/><path d="M24 20 L30 15 L36 20 L30 25Z" stroke="${c}" fill="none" stroke-width="1"/><rect x="27" y="28" width="6" height="8" rx="1" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  cooking: (c) => `<circle cx="30" cy="28" r="8" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="26" y1="28" x2="34" y2="28" stroke="${c}" stroke-width="1"/><line x1="30" y1="24" x2="30" y2="32" stroke="${c}" stroke-width="1"/>`,
  health: (c) => `<path d="M30 20 Q24 16 24 22 Q24 28 30 34 Q36 28 36 22 Q36 16 30 20Z" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  parenting: (c) => `<circle cx="28" cy="22" r="5" stroke="${c}" fill="none" stroke-width="1.5"/><path d="M22 36 Q22 28 28 28 Q34 28 34 36" stroke="${c}" fill="none" stroke-width="1.5"/><circle cx="38" cy="24" r="3" stroke="${c}" fill="none" stroke-width="1"/>`,
  education: (c) => `<path d="M30 15 L42 22 L30 29 L18 22Z" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="18" y1="22" x2="18" y2="34" stroke="${c}" stroke-width="1.5"/><line x1="30" y1="29" x2="30" y2="38" stroke="${c}" stroke-width="1.5"/>`,
  nature: (c) => `<path d="M30 38 L30 22" stroke="${c}" stroke-width="2"/><path d="M30 22 Q22 18 22 26 Q22 18 30 22" stroke="${c}" fill="none" stroke-width="1.5"/><path d="M30 28 Q38 24 38 32 Q38 24 30 28" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  environment: (c) => `<circle cx="30" cy="26" r="8" stroke="${c}" fill="none" stroke-width="1.5"/><path d="M30 20 L30 12" stroke="${c}" stroke-width="1.5"/><path d="M27 14 L30 12 L33 14" stroke="${c}" fill="none" stroke-width="1"/>`,
  astronomy: (c) => `<circle cx="30" cy="26" r="6" stroke="${c}" fill="none" stroke-width="1.5"/><circle cx="30" cy="26" r="10" stroke="${c}" fill="none" stroke-width="0.5" stroke-dasharray="2 2"/><circle cx="38" cy="16" r="1.5" fill="${c}"/>`,
  mythology: (c) => `<path d="M26 32 Q24 24 30 18 Q36 24 34 32 Q30 28 26 32Z" stroke="${c}" fill="none" stroke-width="1.5"/><path d="M28 22 Q30 14 32 22" stroke="${c}" fill="none" stroke-width="1"/>`,
  humor: (c) => `<circle cx="30" cy="25" r="10" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="24" y1="22" x2="28" y2="22" stroke="${c}" stroke-width="1.5"/><line x1="32" y1="22" x2="36" y2="22" stroke="${c}" stroke-width="1.5"/><path d="M24 30 Q30 35 36 30" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  'true-crime': (c) => `<circle cx="30" cy="26" r="8" stroke="${c}" fill="none" stroke-width="1.5"/><circle cx="30" cy="26" r="3" stroke="${c}" fill="none" stroke-width="1"/><circle cx="30" cy="26" r="1" fill="${c}"/>`,
  memoir: (c) => `<rect x="24" y="18" width="12" height="18" rx="2" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="27" y1="24" x2="33" y2="24" stroke="${c}" stroke-width="1"/><line x1="27" y1="28" x2="33" y2="28" stroke="${c}" stroke-width="1"/>`,
  'graphic-novels': (c) => `<rect x="22" y="18" width="8" height="8" rx="1" stroke="${c}" fill="none" stroke-width="1"/><rect x="32" y="18" width="8" height="8" rx="1" stroke="${c}" fill="none" stroke-width="1"/><rect x="22" y="28" width="18" height="8" rx="1" stroke="${c}" fill="none" stroke-width="1"/>`,
  'young-adult': (c) => `<line x1="30" y1="38" x2="30" y2="18" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/><path d="M22 25 L30 18 L38 25" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  children: (c) => `<circle cx="30" cy="22" r="7" stroke="${c}" fill="none" stroke-width="1.5"/><circle cx="27" cy="20" r="1.5" fill="${c}"/><circle cx="33" cy="20" r="1.5" fill="${c}"/><path d="M27 26 Q30 30 33 26" stroke="${c}" fill="none" stroke-width="1.5"/>`,
  war: (c) => `<path d="M30 16 L38 26 L30 36 L22 26Z" stroke="${c}" fill="none" stroke-width="1.5"/><line x1="30" y1="26" x2="30" y2="36" stroke="${c}" stroke-width="1.5"/>`,
};

interface CategoryBookIconProps {
  categoryId: string;
  categoryName: string;
  emoji: string;
  isSelected: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function CategoryBookIcon({ categoryId, categoryName, emoji, isSelected, size = 'md', onClick }: CategoryBookIconProps) {
  const family = categoryColorMap[categoryId] || 'green';
  const colors = colorFamilies[family];
  const hasImage = !!categoryIconImages[categoryId];
  const motifSVG = motifSVGs[categoryId];

  const sizeClasses = {
    sm: 'w-16 h-20',
    md: 'w-20 h-28 sm:w-24 sm:h-32',
    lg: 'w-28 h-40 sm:w-32 sm:h-44',
  };

  const textSizes = {
    sm: 'text-[7px]',
    md: 'text-[8px] sm:text-[9px]',
    lg: 'text-[10px] sm:text-xs',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative group cursor-pointer ${sizeClasses[size]} flex-shrink-0`}
    >
      {/* Book Shadow */}
      <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-lg bg-black/5 dark:bg-black/20 blur-sm" />

      {/* Book Cover */}
      <div
        className={`
          relative w-full h-full rounded-lg overflow-hidden
          bg-gradient-to-br ${isSelected ? colors.bg : 'from-[#F5F0E8] to-[#E8E4D9]'}
          dark:bg-gradient-to-br ${isSelected ? colors.dark : 'from-[#344E44]/40 to-[#2C4A3F]/30'}
          transition-all duration-300
          ${isSelected ? 'ring-2 ring-[#8FB9A8] shadow-lg' : 'ring-1 ring-border/40 shadow-soft'}
        `}
      >
        {/* Book Spine */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2 rounded-l-lg"
          style={{ backgroundColor: colors.spine + '40' }}
        />
        <div
          className="absolute left-0 top-0 bottom-0 w-px"
          style={{ backgroundColor: colors.spine + '80' }}
        />

        {/* Decorative motif area */}
        <div className="absolute inset-2 flex items-center justify-center">
          {hasImage ? (
            <img
              src={categoryIconImages[categoryId]}
              alt={categoryName}
              className="w-full h-full object-cover rounded opacity-90"
              loading="lazy"
            />
          ) : motifSVG ? (
            <svg viewBox="15 10 30 30" className="w-full h-full opacity-60">
              {motifSVG(colors.accent)}
            </svg>
          ) : (
            <span className="text-2xl opacity-70">{emoji}</span>
          )}
        </div>

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-[#8FB9A8] rounded-full flex items-center justify-center shadow-md">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// Artistic Book Cover for book cards and detail view
interface ArtisticBookCoverProps {
  title: string;
  author: string;
  coverImage?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function ArtisticBookCover({ title, author, coverImage, size = 'md', className = '', onClick }: ArtisticBookCoverProps) {
  const sizeMap = {
    sm: { w: 'w-16', h: 'h-22' },
    md: { w: 'w-28', h: 'h-40' },
    lg: { w: 'w-40 sm:w-48', h: 'h-56 sm:h-68' },
  };

  const { w, h } = sizeMap[size];

  return (
    <div className={`relative group ${className}`} onClick={onClick}>
      {/* Book Shadow */}
      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-xl bg-black/8 dark:bg-black/25 blur-sm" />

      {/* Book Cover */}
      <div className={`
        relative ${w} ${h} rounded-xl overflow-hidden
        bg-gradient-to-br from-[#F5F0E8] to-[#E8E4D9]
        dark:from-[#344E44]/50 dark:to-[#2C4A3F]/40
        ring-1 ring-border/40 shadow-soft transition-all duration-300
        ${onClick ? 'cursor-pointer group-hover:shadow-lg group-hover:ring-[#8FB9A8]/40' : ''}
      `}>
        {/* Cover Image or Artistic Fallback */}
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : null}

        {/* Decorative Watercolor Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none" />

        {/* Book Spine */}
        <div className="absolute left-0 top-0 bottom-0 w-2.5 rounded-l-xl bg-gradient-to-b from-[#8FB9A8]/30 to-[#5A7A6A]/30 dark:from-[#8FB9A8]/20 dark:to-[#5A7A6A]/20" />

        {/* Page Edge Effect */}
        <div className="absolute right-0 top-2 bottom-2 w-1 bg-white/30 dark:bg-white/10 rounded-r" />
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
