import {
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
  entersState,
  AudioPlayer,
} from '@discordjs/voice';
import { VoiceBasedChannel } from 'discord.js';
import { createLoopingPlayer } from './player';
import { logger } from '../logger';
import { closeSession, closeAllGuildSessions, createSession } from '../supabase';

interface ActiveConnection {
  connection: VoiceConnection;
  player: AudioPlayer;
  sessionId: string | null;
}

const connections = new Map<string, ActiveConnection>();

export function isConnected(guildId: string): boolean {
  return connections.has(guildId);
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

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  } catch (err) {
    connection.destroy();
    throw new Error('Timed out while connecting to the voice channel. Please try again.');
  }

  const player = await createLoopingPlayer(guildId);
  connection.subscribe(player);

  const sessionId = await createSession(guildId, channelId, channelName);

  connections.set(guildId, { connection, player, sessionId });

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

  logger.info(`guild:${guildId}`, `Connected and streaming in: ${channelName}`);
}

export async function disconnect(guildId: string): Promise<void> {
  const entry = connections.get(guildId);
  if (!entry) {
    throw new Error('Bot is not connected to a voice channel in this server.');
  }

  entry.player.stop(true);
  entry.connection.destroy();
}

async function cleanupGuild(guildId: string): Promise<void> {
  const entry = connections.get(guildId);
  if (!entry) return;

  connections.delete(guildId);

  if (entry.sessionId) {
    await closeSession(entry.sessionId);
  } else {
    await closeAllGuildSessions(guildId);
  }

  logger.info(`guild:${guildId}`, 'Cleaned up connection resources');
}

export async function disconnectAll(): Promise<void> {
  const guildIds = [...connections.keys()];
  await Promise.all(guildIds.map((guildId) => disconnect(guildId).catch(() => cleanupGuild(guildId))));
}
