-- Migrate image_url to image_urls (JSON array)
-- First add the new column
ALTER TABLE Article ADD COLUMN image_urls JSON NULL;

-- Migrate existing data: convert single URL to array format
UPDATE Article 
SET image_urls = JSON_ARRAY(image_url) 
WHERE image_url IS NOT NULL AND image_url != '';

-- Drop the old column
ALTER TABLE Article DROP COLUMN image_url;

