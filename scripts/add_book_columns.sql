-- Add book tracking columns to api_usage table
-- Run this in Supabase SQL Editor

ALTER TABLE api_usage 
ADD COLUMN book_title TEXT,
ADD COLUMN book_author TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_api_usage_book ON api_usage(book_title);