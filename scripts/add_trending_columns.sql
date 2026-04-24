-- Add author and cover_url columns to book_views for trending
ALTER TABLE book_views 
ADD COLUMN book_author TEXT,
ADD COLUMN cover_url TEXT;

-- Update existing records where we have this data in book_content
UPDATE book_views bv
SET book_author = bc.author, cover_url = bc.cover_url
FROM book_content bc
WHERE bv.book_id = bc.book_id;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_book_views_book_id ON book_views(book_id);