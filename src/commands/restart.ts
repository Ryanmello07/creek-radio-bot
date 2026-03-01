import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { isConnected, getRadioPlayer } from '../audio/connectionManager';
import { resetPlaybackPosition } from '../supabase';
import { logger } from '../logger';

export const data = new SlashCommandBuilder()
  .setName('restart')
  .setDescription('Restart the radio from the beginning');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
    return;
  }

  const guildId = interaction.guildId;

  if (!isConnected(guildId)) {
    await resetPlaybackPosition(guildId);
    await interaction.reply({
      content: 'The radio is not currently playing, but the saved position has been reset. Next time the bot joins, it will start from the beginning.',
      ephemeral: true,
    });
    return;
  }

  try {
    await interaction.deferReply();
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 10062) {
      logger.warn(`guild:${guildId}`, 'Interaction expired before deferring /restart');
      return;
    }
    logger.warn(`guild:${guildId}`, `deferReply failed for /restart, attempting to continue: ${err instanceof Error ? err.message : err}`);
  }

  try {
    const radioPlayer = getRadioPlayer(guildId);
    if (radioPlayer) {
      radioPlayer.restart();
    }
    await resetPlaybackPosition(guildId);

    await logger.event(guildId, 'restart', 'Radio restarted from the beginning', {
      requested_by: interaction.user.tag,
    });

    try {
      await interaction.editReply('Radio restarted from the beginning.');
    } catch (replyErr) {
      logger.warn(`guild:${guildId}`, `Failed to send success reply for /restart: ${replyErr instanceof Error ? replyErr.message : replyErr}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    logger.error(`guild:${guildId}`, 'Failed to restart radio', err);
    try {
      await interaction.editReply(`Failed to restart: ${message}`);
    } catch (replyErr) {
      logger.warn(`guild:${guildId}`, `Failed to send error reply for /restart: ${replyErr instanceof Error ? replyErr.message : replyErr}`);
    }
  }
}
