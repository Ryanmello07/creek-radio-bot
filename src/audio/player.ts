import {
  createAudioPlayer,
  createAudioResource,
  AudioPlayer,
  AudioPlayerStatus,
  StreamType,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import { ChildProcess, spawn } from 'child_process';
import https from 'https';
import http from 'http';
import { Readable } from 'stream';
import ffmpegPath from 'ffmpeg-static';
import { config } from '../config';
import { logger } from '../logger';

export interface RadioPlayer {
  audioPlayer: AudioPlayer;
  getCurrentPosition: () => number;
  seekTo: (seconds: number) => void;
  restart: () => void;
  destroy: () => void;
}

function fetchStream(url: string): Promise<Readable> {
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

export async function createLoopingPlayer(guildId: string, startPositionSeconds = 0): Promise<RadioPlayer> {
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });

  let seekOffset = startPositionSeconds;
  let playStartedAt = Date.now();
  let ffmpegProcess: ChildProcess | null = null;
  let destroyed = false;
  let playGeneration = 0;

  function killFfmpeg(): void {
    if (ffmpegProcess) {
      ffmpegProcess.kill('SIGKILL');
      ffmpegProcess = null;
    }
  }

  async function play(seekSeconds: number): Promise<void> {
    if (destroyed) return;

    const generation = ++playGeneration;

    killFfmpeg();

    let stream: Readable;
    try {
      stream = await fetchStream(config.audio.streamUrl);
    } catch (err) {
      if (generation !== playGeneration) return;
      logger.error(`guild:${guildId}`, 'Failed to fetch audio stream — retrying in 3s', err);
      setTimeout(() => {
        if (!destroyed && generation === playGeneration) void play(seekOffset);
      }, 3000);
      return;
    }

    if (generation !== playGeneration) {
      stream.destroy();
      return;
    }

    const args = [
      '-hide_banner',
      '-loglevel', 'warning',
      ...(seekSeconds > 0 ? ['-ss', String(seekSeconds)] : []),
      '-i', 'pipe:0',
      '-analyzeduration', '0',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1',
    ];

    const proc = spawn(ffmpegPath!, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    ffmpegProcess = proc;

    stream.pipe(proc.stdin!);

    stream.on('error', (err) => {
      logger.error(`guild:${guildId}`, 'HTTP stream error', err);
      proc.kill('SIGKILL');
    });

    proc.stdin!.on('error', () => {});
    proc.stdout!.on('error', () => {});

    proc.stderr!.on('data', (chunk: Buffer) => {
      const msg = chunk.toString().trim();
      if (msg) logger.warn(`guild:${guildId}`, `ffmpeg: ${msg}`);
    });

    proc.on('error', (err) => {
      logger.error(`guild:${guildId}`, 'FFmpeg process error — retrying in 3s', err);
      setTimeout(() => {
        if (!destroyed && generation === playGeneration) void play(seekOffset);
      }, 3000);
    });

    if (!proc.stdout) {
      logger.error(`guild:${guildId}`, 'FFmpeg stdout not available — retrying in 3s');
      stream.destroy();
      setTimeout(() => {
        if (!destroyed && generation === playGeneration) void play(seekOffset);
      }, 3000);
      return;
    }

    const resource = createAudioResource(proc.stdout, { inputType: StreamType.Raw });

    seekOffset = seekSeconds;
    playStartedAt = Date.now();

    player.play(resource);
  }

  player.on(AudioPlayerStatus.Idle, () => {
    if (destroyed) return;
    logger.debug(`guild:${guildId}`, 'Track ended — restarting loop');
    seekOffset = 0;
    playStartedAt = Date.now();
    void play(0);
  });

  player.on('error', (err) => {
    if (destroyed) return;
    logger.error(`guild:${guildId}`, 'Audio player error — restarting', err);
    void play(seekOffset);
  });

  await play(startPositionSeconds);

  return {
    audioPlayer: player,

    getCurrentPosition(): number {
      const elapsed = (Date.now() - playStartedAt) / 1000;
      return seekOffset + elapsed;
    },

    seekTo(seconds: number): void {
      void play(Math.max(0, seconds));
    },

    restart(): void {
      void play(0);
    },

    destroy(): void {
      destroyed = true;
      killFfmpeg();
      player.stop(true);
    },
  };
}
