/*
  # Add Unique Constraints for Single Roadmap/Schedule Per User

  1. Changes
    - Add unique constraint on roadmaps (user_id) - only one roadmap per user
    - Add unique constraint on schedules (user_id) - only one schedule per user
    - This ensures users cannot create multiple roadmaps/schedules

  2. Notes
    - Existing duplicate data will need to be cleaned up first
    - Users will update their existing roadmap/schedule instead of creating new ones
*/

-- First, clean up any duplicate roadmaps, keeping only the most recent one per user
DELETE FROM roadmaps
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM roadmaps
  ORDER BY user_id, created_at DESC
);

-- First, clean up any duplicate schedules, keeping only the most recent one per user
DELETE FROM schedules
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM schedules
  ORDER BY user_id, created_at DESC
);

-- Add unique constraint to roadmaps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'roadmaps_user_id_key'
  ) THEN
    ALTER TABLE roadmaps ADD CONSTRAINT roadmaps_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Add unique constraint to schedules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'schedules_user_id_key'
  ) THEN
    ALTER TABLE schedules ADD CONSTRAINT schedules_user_id_key UNIQUE (user_id);
  END IF;
END $$;
