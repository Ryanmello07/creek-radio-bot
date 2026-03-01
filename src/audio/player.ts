import {
  createAudioPlayer,
  createAudioResource,
  AudioPlayer,
  AudioPlayerStatus,
  StreamType,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import https from 'https';
import http from 'http';
import { IncomingMessage } from 'http';
import { config } from '../config';
import { logger } from '../logger';

function fetchStream(url: string): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchStream(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode ?? 'unknown'} fetching audio stream`));
        return;
      }
      resolve(res);
    });
    req.on('error', reject);
  });
}

export async function createLoopingPlayer(guildId: string): Promise<AudioPlayer> {
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });

  async function play(): Promise<void> {
    try {
      const stream = await fetchStream(config.audio.streamUrl);
      const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
      player.play(resource);
    } catch (err) {
      logger.error(`guild:${guildId}`, 'Failed to fetch audio stream — retrying in 3s', err);
      setTimeout(() => void play(), 3000);
    }
  }

  player.on(AudioPlayerStatus.Idle, () => {
    logger.debug(`guild:${guildId}`, 'Track ended — restarting loop');
    void play();
  });

  player.on('error', (err) => {
    logger.error(`guild:${guildId}`, 'Audio player error — restarting', err);
    void play();
  });

  await play();

  return player;
}
