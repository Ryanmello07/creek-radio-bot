import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { isConnected, getRadioPlayer } from '../audio/connectionManager';
import { savePlaybackPosition } from '../supabase';
import { logger } from '../logger';

function parseTimeString(input: string): number | null {
  const trimmed = input.trim().toLowerCase();

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  const pattern = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/;
  const match = trimmed.match(pattern);

  if (!match || trimmed === '') return null;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  if (hours === 0 && minutes === 0 && seconds === 0 && !match[1] && !match[2] && !match[3]) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(' ');
}

export const data = new SlashCommandBuilder()
  .setName('seek')
  .setDescription('Jump to a specific time in the radio')
  .addStringOption((option) =>
    option
      .setName('time')
      .setDescription('Time to jump to (e.g. 10s, 5m, 1h30m, 90)')
      .setRequired(true)
  ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
    return;
  }

  const guildId = interaction.guildId;
  const timeInput = interaction.options.getString('time', true);
  const seconds = parseTimeString(timeInput);

  if (seconds === null || seconds < 0) {
    await interaction.reply({
      content: `Invalid time format: \`${timeInput}\`. Use formats like \`10s\`, \`5m\`, \`1h30m\`, or a number in seconds like \`90\`.`,
      ephemeral: true,
    });
    return;
  }

  if (!isConnected(guildId)) {
    await interaction.reply({
      content: 'The radio is not currently playing. Use `/join` first.',
      ephemeral: true,
    });
    return;
  }

  try {
    await interaction.deferReply();
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 10062) {
      logger.warn(`guild:${guildId}`, 'Interaction expired before deferring /seek');
      return;
    }
    logger.warn(`guild:${guildId}`, `deferReply failed for /seek, attempting to continue: ${err instanceof Error ? err.message : err}`);
  }

  try {
    const radioPlayer = getRadioPlayer(guildId);
    if (radioPlayer) {
      radioPlayer.seekTo(seconds);
    }
    await savePlaybackPosition(guildId, seconds);

    const formatted = formatTime(seconds);
    await logger.event(guildId, 'seek', `Jumped to ${formatted}`, {
      requested_by: interaction.user.tag,
      seek_seconds: seconds,
    });

    try {
      await interaction.editReply(`Jumped to **${formatted}**.`);
    } catch (replyErr) {
      logger.warn(`guild:${guildId}`, `Failed to send success reply for /seek: ${replyErr instanceof Error ? replyErr.message : replyErr}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    logger.error(`guild:${guildId}`, 'Failed to seek', err);
    try {
      await interaction.editReply(`Failed to seek: ${message}`);
    } catch (replyErr) {
      logger.warn(`guild:${guildId}`, `Failed to send error reply for /seek: ${replyErr instanceof Error ? replyErr.message : replyErr}`);
    }
  }
}
