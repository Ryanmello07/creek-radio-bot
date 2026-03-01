/*
  # Discord Radio Bot - Core Tables

  ## Tables Created

  ### 1. bot_sessions
  Tracks active and historical voice channel connections per Discord guild.
  - `id` (uuid, primary key)
  - `guild_id` (text) - Discord guild/server snowflake ID
  - `channel_id` (text) - Discord voice channel snowflake ID
  - `channel_name` (text) - Human-readable channel name for display
  - `joined_at` (timestamptz) - When the bot joined the channel
  - `left_at` (timestamptz, nullable) - When the bot left; null means still active
  - `is_active` (boolean) - Whether this session is currently live

  ### 2. bot_events
  Append-only log of all significant connection and lifecycle events.
  - `id` (uuid, primary key)
  - `guild_id` (text) - Discord guild/server snowflake ID
  - `event_type` (text) - e.g. 'join', 'leave', 'disconnect', 'error', 'ready'
  - `message` (text) - Human-readable description of the event
  - `metadata` (jsonb, nullable) - Optional structured data for the event
  - `created_at` (timestamptz) - When the event occurred

  ## Security
  - RLS enabled on both tables
  - Service role has full access (bot uses service role key)
  - No public/anon access permitted
*/

CREATE TABLE IF NOT EXISTS bot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  channel_id text NOT NULL,
  channel_name text NOT NULL DEFAULT '',
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS bot_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id text NOT NULL,
  event_type text NOT NULL,
  message text NOT NULL DEFAULT '',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bot_sessions_guild_id_idx ON bot_sessions (guild_id);
CREATE INDEX IF NOT EXISTS bot_sessions_is_active_idx ON bot_sessions (is_active);
CREATE INDEX IF NOT EXISTS bot_events_guild_id_idx ON bot_events (guild_id);
CREATE INDEX IF NOT EXISTS bot_events_event_type_idx ON bot_events (event_type);
CREATE INDEX IF NOT EXISTS bot_events_created_at_idx ON bot_events (created_at DESC);

ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to bot_sessions"
  ON bot_sessions
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role insert bot_sessions"
  ON bot_sessions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role update bot_sessions"
  ON bot_sessions
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role delete bot_sessions"
  ON bot_sessions
  FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "Service role full access to bot_events"
  ON bot_events
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role insert bot_events"
  ON bot_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);
