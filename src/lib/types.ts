export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  previewLink: string;
  buyLink?: string;
  isFree: boolean;
  fullTextUrl?: string;
  categories: string[];
  publishedYear?: number;
  pageCount?: number;
}

export interface AISummary {
  introduction: string;
  coreIdeas: string[];
  keyTakeaways: string[];
  fullText: string;
}

export interface Slide {
  title: string;
  points: string[];
}

export interface BookRecommendRequest {
  interests: string[];
}

export type AppView = 'interests' | 'discover' | 'book-detail' | 'reader' | 'saved';
