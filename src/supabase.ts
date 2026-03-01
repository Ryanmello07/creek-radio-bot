import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

function buildClient(): SupabaseClient | null {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    console.warn('[Supabase] No service role key set — session logging is disabled');
    return null;
  }
  return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const supabase = buildClient();

export interface BotSession {
  id: string;
  guild_id: string;
  channel_id: string;
  channel_name: string;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
}

export interface BotEvent {
  id: string;
  guild_id: string;
  event_type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function createSession(
  guildId: string,
  channelId: string,
  channelName: string
): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('bot_sessions')
    .insert({ guild_id: guildId, channel_id: channelId, channel_name: channelName })
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Failed to create session:', error.message);
    return null;
  }

  return data?.id ?? null;
}

export async function closeSession(sessionId: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('bot_sessions')
    .update({ is_active: false, left_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    console.error('[Supabase] Failed to close session:', error.message);
  }
}

export async function closeAllGuildSessions(guildId: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('bot_sessions')
    .update({ is_active: false, left_at: new Date().toISOString() })
    .eq('guild_id', guildId)
    .eq('is_active', true);

  if (error) {
    console.error('[Supabase] Failed to close guild sessions:', error.message);
  }
}

export async function getPlaybackPosition(guildId: string): Promise<number> {
  if (!supabase) return 0;

  const { data, error } = await supabase
    .from('guild_playback_state')
    .select('position_seconds')
    .eq('guild_id', guildId)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Failed to get playback position:', error.message);
    return 0;
  }

  return data?.position_seconds ?? 0;
}

export async function savePlaybackPosition(guildId: string, positionSeconds: number): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('guild_playback_state')
    .upsert(
      { guild_id: guildId, position_seconds: positionSeconds, updated_at: new Date().toISOString() },
      { onConflict: 'guild_id' }
    );

  if (error) {
    console.error('[Supabase] Failed to save playback position:', error.message);
  }
}

export async function resetPlaybackPosition(guildId: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('guild_playback_state')
    .upsert(
      { guild_id: guildId, position_seconds: 0, updated_at: new Date().toISOString() },
      { onConflict: 'guild_id' }
    );

  if (error) {
    console.error('[Supabase] Failed to reset playback position:', error.message);
  }
}

export async function logEvent(
  guildId: string,
  eventType: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from('bot_events').insert({
    guild_id: guildId,
    event_type: eventType,
    message,
    metadata: metadata ?? null,
  });

  if (error) {
    console.error('[Supabase] Failed to log event:', error.message);
  }
}
