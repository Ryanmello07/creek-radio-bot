/*
  # Guild Playback State Table

  1. New Tables
    - `guild_playback_state`
      - `guild_id` (text, primary key) - Discord guild/server snowflake ID, one row per server
      - `position_seconds` (double precision) - Saved playback offset in seconds
      - `updated_at` (timestamptz) - When the position was last saved

  2. Security
    - RLS enabled on `guild_playback_state`
    - Service role has full CRUD access (bot uses service role key)
    - No public/anon access permitted

  3. Notes
    - This table stores the last known playback position per guild so the bot can
      resume from where it left off when re-joining a server.
*/

CREATE TABLE IF NOT EXISTS guild_playback_state (
  guild_id text PRIMARY KEY,
  position_seconds double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guild_playback_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role select guild_playback_state"
  ON guild_playback_state
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role insert guild_playback_state"
  ON guild_playback_state
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role update guild_playback_state"
  ON guild_playback_state
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role delete guild_playback_state"
  ON guild_playback_state
  FOR DELETE
  TO service_role
  USING (true);
