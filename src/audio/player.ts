import {
  createAudioPlayer,
  createAudioResource,
  AudioPlayer,
  AudioPlayerStatus,
  StreamType,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import { ChildProcess, spawn } from 'child_process';
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

export function createLoopingPlayer(guildId: string, startPositionSeconds = 0): RadioPlayer {
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });

  let seekOffset = startPositionSeconds;
  let playStartedAt = Date.now();
  let ffmpegProcess: ChildProcess | null = null;
  let destroyed = false;

  function killFfmpeg(): void {
    if (ffmpegProcess) {
      ffmpegProcess.kill('SIGKILL');
      ffmpegProcess = null;
    }
  }

  function play(seekSeconds: number): void {
    if (destroyed) return;

    killFfmpeg();

    const args = [
      '-hide_banner',
      '-loglevel', 'error',
      ...(seekSeconds > 0 ? ['-ss', String(seekSeconds)] : []),
      '-i', config.audio.streamUrl,
      '-analyzeduration', '0',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1',
    ];

    const proc = spawn(ffmpegPath!, args, { stdio: ['ignore', 'pipe', 'ignore'] });
    ffmpegProcess = proc;

    proc.on('error', (err) => {
      logger.error(`guild:${guildId}`, 'FFmpeg process error — retrying in 3s', err);
      setTimeout(() => {
        if (!destroyed) play(seekOffset);
      }, 3000);
    });

    if (!proc.stdout) {
      logger.error(`guild:${guildId}`, 'FFmpeg stdout not available — retrying in 3s');
      setTimeout(() => {
        if (!destroyed) play(seekOffset);
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
    play(0);
  });

  player.on('error', (err) => {
    if (destroyed) return;
    logger.error(`guild:${guildId}`, 'Audio player error — restarting', err);
    play(seekOffset);
  });

  play(startPositionSeconds);

  return {
    audioPlayer: player,

    getCurrentPosition(): number {
      const elapsed = (Date.now() - playStartedAt) / 1000;
      return seekOffset + elapsed;
    },

    seekTo(seconds: number): void {
      play(Math.max(0, seconds));
    },

    restart(): void {
      play(0);
    },

    destroy(): void {
      destroyed = true;
      killFfmpeg();
      player.stop(true);
    },
  };
}
