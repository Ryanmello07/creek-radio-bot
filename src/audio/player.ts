import {
  createAudioPlayer,
  createAudioResource,
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import fs from 'fs';
import { config } from '../config';
import { logger } from '../logger';

function createResource(): AudioResource {
  if (!fs.existsSync(config.audio.filePath)) {
    throw new Error(`Music file not found at path: ${config.audio.filePath}`);
  }
  return createAudioResource(config.audio.filePath);
}

export function createLoopingPlayer(guildId: string): AudioPlayer {
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });

  function play(): void {
    const resource = createResource();
    player.play(resource);
  }

  player.on(AudioPlayerStatus.Idle, () => {
    logger.debug(`guild:${guildId}`, 'Track ended — restarting loop');
    play();
  });

  player.on('error', (err) => {
    logger.error(`guild:${guildId}`, 'Audio player error', err);
    play();
  });

  play();

  return player;
}
