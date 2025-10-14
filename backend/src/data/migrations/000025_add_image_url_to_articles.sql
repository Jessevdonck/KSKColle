-- Add image_url column to Article table
ALTER TABLE Article 
ADD COLUMN image_url VARCHAR(500) NULL AFTER excerpt;

