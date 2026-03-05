import {
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
  entersState,
} from '@discordjs/voice';
import { VoiceBasedChannel } from 'discord.js';
import { createLoopingPlayer, RadioPlayer } from './player';
import { logger } from '../logger';
import {
  closeSession,
  closeAllGuildSessions,
  createSession,
  getPlaybackPosition,
  savePlaybackPosition,
} from '../supabase';

const POSITION_SAVE_INTERVAL_MS = 30_000;

interface ActiveConnection {
  connection: VoiceConnection;
  radioPlayer: RadioPlayer;
  sessionId: string | null;
  saveInterval: ReturnType<typeof setInterval>;
}

const connections = new Map<string, ActiveConnection>();

export function isConnected(guildId: string): boolean {
  return connections.has(guildId);
}

export function getRadioPlayer(guildId: string): RadioPlayer | null {
  return connections.get(guildId)?.radioPlayer ?? null;
}

export async function connect(channel: VoiceBasedChannel): Promise<void> {
  const { guild, id: channelId, name: channelName } = channel;
  const guildId = guild.id;

  if (connections.has(guildId)) {
    throw new Error('Bot is already connected to a voice channel in this server.');
  }

  const connection = joinVoiceChannel({
    channelId,
    guildId,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });

  logger.info(`guild:${guildId}`, `Joining voice channel: ${channelName} (${channelId})`);

  connection.on('error', (err: Error) => {
    logger.error(`guild:${guildId}`, 'Voice connection error', err);
    void cleanupGuild(guildId);
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    logger.warn(`guild:${guildId}`, 'Connection disconnected — attempting to recover');

    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      logger.warn(`guild:${guildId}`, 'Recovery failed — destroying connection');
      await cleanupGuild(guildId);
    }
  });

  connection.on(VoiceConnectionStatus.Destroyed, async () => {
    logger.info(`guild:${guildId}`, 'Voice connection destroyed');
    await cleanupGuild(guildId);
  });

  const MAX_CONNECT_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt++) {
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
      break;
    } catch {
      if (attempt === MAX_CONNECT_ATTEMPTS) {
        connection.destroy();
        throw new Error('Timed out while connecting to the voice channel. Please try again.');
      }
      logger.warn(`guild:${guildId}`, `Connection attempt ${attempt}/${MAX_CONNECT_ATTEMPTS} timed out — retrying`);
    }
  }

  const savedPosition = await getPlaybackPosition(guildId);
  logger.info(`guild:${guildId}`, `Resuming playback at ${savedPosition.toFixed(1)}s`);

  const radioPlayer = await createLoopingPlayer(guildId, savedPosition);
  connection.subscribe(radioPlayer.audioPlayer);

  const sessionId = await createSession(guildId, channelId, channelName);

  const saveInterval = setInterval(() => {
    const pos = radioPlayer.getCurrentPosition();
    void savePlaybackPosition(guildId, pos);
  }, POSITION_SAVE_INTERVAL_MS);

  connections.set(guildId, { connection, radioPlayer, sessionId, saveInterval });

  logger.info(`guild:${guildId}`, `Connected and streaming in: ${channelName}`);
}

export async function disconnect(guildId: string): Promise<void> {
  const entry = connections.get(guildId);
  if (!entry) {
    throw new Error('Bot is not connected to a voice channel in this server.');
  }

  const pos = entry.radioPlayer.getCurrentPosition();
  await savePlaybackPosition(guildId, pos);

  entry.radioPlayer.destroy();
  entry.connection.destroy();
}

async function cleanupGuild(guildId: string): Promise<void> {
  const entry = connections.get(guildId);
  if (!entry) return;

  clearInterval(entry.saveInterval);

  const pos = entry.radioPlayer.getCurrentPosition();
  await savePlaybackPosition(guildId, pos);

  connections.delete(guildId);

  if (entry.sessionId) {
    await closeSession(entry.sessionId);
  } else {
    await closeAllGuildSessions(guildId);
  }

  logger.info(`guild:${guildId}`, `Cleaned up connection resources (saved position: ${pos.toFixed(1)}s)`);
}

export async function disconnectAll(): Promise<void> {
  const guildIds = [...connections.keys()];
  await Promise.all(guildIds.map((guildId) => disconnect(guildId).catch(() => cleanupGuild(guildId))));
}
