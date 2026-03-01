import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}

export const config = {
  discord: {
    token: requireEnv('DISCORD_TOKEN'),
    clientId: requireEnv('DISCORD_CLIENT_ID'),
    guildId: optionalEnv('DISCORD_GUILD_ID'),
  },
  supabase: {
    url: optionalEnv('SUPABASE_URL') ?? optionalEnv('VITE_SUPABASE_URL') ?? '',
    serviceRoleKey: optionalEnv('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  },
  audio: {
    streamUrl: requireEnv('AUDIO_STREAM_URL'),
  },
};
