-- Update all existing youth tournaments to disable rating
UPDATE Tournament 
SET rating_enabled = false 
WHERE is_youth = true AND rating_enabled = true;
