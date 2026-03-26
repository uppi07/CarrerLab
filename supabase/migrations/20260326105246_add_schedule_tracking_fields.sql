/*
  # Add Schedule Tracking Fields

  1. Changes
    - Add `done` (jsonb) to schedules - tracks completed days
    - Add `current_day` (integer) to schedules - tracks active day
    - Add `lessons` (jsonb) to schedules - stores lesson content
    - Add `lesson_step` (jsonb) to schedules - tracks lesson progress
    - Add `updated_at` to both tables for tracking modifications
    - Add `days` field to roadmaps for window size

  2. Notes
    - All new fields have safe defaults
    - Existing data is preserved
*/

-- Add missing fields to roadmaps
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roadmaps' AND column_name = 'days'
  ) THEN
    ALTER TABLE roadmaps ADD COLUMN days integer NOT NULL DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roadmaps' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE roadmaps ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add missing fields to schedules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedules' AND column_name = 'done'
  ) THEN
    ALTER TABLE schedules ADD COLUMN done jsonb NOT NULL DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedules' AND column_name = 'current_day'
  ) THEN
    ALTER TABLE schedules ADD COLUMN current_day integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedules' AND column_name = 'lessons'
  ) THEN
    ALTER TABLE schedules ADD COLUMN lessons jsonb NOT NULL DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedules' AND column_name = 'lesson_step'
  ) THEN
    ALTER TABLE schedules ADD COLUMN lesson_step jsonb NOT NULL DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedules' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE schedules ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
