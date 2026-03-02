import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { isConnected, getRadioPlayer } from '../audio/connectionManager';
import { savePlaybackPosition } from '../supabase';
import { logger } from '../logger';

interface ParsedTime {
  seconds: number;
  relative: 'forward' | 'backward' | null;
}

function parseTimeString(input: string): ParsedTime | null {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === '') return null;

  let relative: ParsedTime['relative'] = null;
  let body = trimmed;

  if (body.startsWith('+')) {
    relative = 'forward';
    body = body.slice(1);
  } else if (body.startsWith('-')) {
    relative = 'backward';
    body = body.slice(1);
  }

  if (/^\d+(\.\d+)?$/.test(body)) {
    return { seconds: parseFloat(body), relative };
  }

  const pattern = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/;
  const match = body.match(pattern);

  if (!match || body === '') return null;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  if (hours === 0 && minutes === 0 && seconds === 0 && !match[1] && !match[2] && !match[3]) {
    return null;
  }

  return { seconds: hours * 3600 + minutes * 60 + seconds, relative };
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
  .setDescription('Jump to a specific time or skip forward/back (e.g. +30s, -1m)')
  .addStringOption((option) =>
    option
      .setName('time')
      .setDescription('Time to jump to (1h30m, 90) or relative offset (+30s, -1m)')
      .setRequired(true)
  ) as SlashCommandBuilder;

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
    return;
  }

  const guildId = interaction.guildId;
  const timeInput = interaction.options.getString('time', true);
  const parsed = parseTimeString(timeInput);

  if (parsed === null || parsed.seconds < 0) {
    await interaction.reply({
      content: `Invalid time format: \`${timeInput}\`. Use \`10s\`, \`5m\`, \`1h30m\`, \`90\`, or relative like \`+30s\`, \`-1m\`.`,
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
    let targetSeconds: number;

    if (parsed.relative && radioPlayer) {
      const current = radioPlayer.getCurrentPosition();
      targetSeconds = parsed.relative === 'forward'
        ? current + parsed.seconds
        : current - parsed.seconds;
    } else {
      targetSeconds = parsed.seconds;
    }

    targetSeconds = Math.max(0, targetSeconds);

    if (radioPlayer) {
      radioPlayer.seekTo(targetSeconds);
    }
    await savePlaybackPosition(guildId, targetSeconds);

    const formatted = formatTime(targetSeconds);
    let replyText: string;

    if (parsed.relative === 'forward') {
      replyText = `Skipped forward **${formatTime(parsed.seconds)}** to **${formatted}**.`;
    } else if (parsed.relative === 'backward') {
      replyText = `Skipped back **${formatTime(parsed.seconds)}** to **${formatted}**.`;
    } else {
      replyText = `Jumped to **${formatted}**.`;
    }

    await logger.event(guildId, 'seek', `Jumped to ${formatted}`, {
      requested_by: interaction.user.tag,
      seek_seconds: targetSeconds,
      relative: parsed.relative,
    });

    try {
      await interaction.editReply(replyText);
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
