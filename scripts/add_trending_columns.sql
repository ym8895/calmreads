-- Add author and cover_url columns to book_views for trending
ALTER TABLE book_views 
ADD COLUMN book_author TEXT,
ADD COLUMN cover_url TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_book_views_book_id ON book_views(book_id);