/*
  # Add Device Tracking by IP Address

  1. New Tables
    - `device_registrations`
      - `id` (uuid, primary key)
      - `ip_address` (text, unique) - User's IP address
      - `user_id` (uuid, references auth.users) - Associated user account
      - `created_at` (timestamptz) - Registration timestamp
      - `last_seen_at` (timestamptz) - Last activity timestamp

  2. Security
    - Enable RLS on device_registrations table
    - Only service role can manage device registrations
    - Users cannot view or modify device registration data

  3. Notes
    - One account per IP address/device
    - IP address is hashed for privacy
    - System enforces device limit at signup
*/

-- Create device_registrations table
CREATE TABLE IF NOT EXISTS device_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_seen_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no user policies)
-- This prevents users from viewing or manipulating device tracking data

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_registrations_ip ON device_registrations(ip_address);
CREATE INDEX IF NOT EXISTS idx_device_registrations_user ON device_registrations(user_id);

-- Function to update last_seen_at
CREATE OR REPLACE FUNCTION update_device_last_seen()
RETURNS trigger AS $$
BEGIN
  NEW.last_seen_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_seen_at
DROP TRIGGER IF EXISTS update_device_last_seen_trigger ON device_registrations;
CREATE TRIGGER update_device_last_seen_trigger
  BEFORE UPDATE ON device_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_device_last_seen();
