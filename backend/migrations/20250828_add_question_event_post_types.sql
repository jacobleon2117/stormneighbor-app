-- Migration to add question and event post types
-- Drop existing constraint if it exists
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;

-- Add new constraint that includes question and event
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check 
CHECK (post_type IN ('help_request', 'help_offer', 'lost_found', 'safety_alert', 'general', 'question', 'event'));