-- Delete records where slides is NULL
DELETE FROM book_content 
WHERE slides IS NULL;

-- Or to preview first:
-- SELECT * FROM book_content WHERE slides IS NULL;