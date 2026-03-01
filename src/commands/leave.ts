import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { disconnect, isConnected } from '../audio/connectionManager';
import { logger } from '../logger';

export const data = new SlashCommandBuilder()
  .setName('leave')
  .setDescription('Stop the radio and leave the current voice channel');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
    return;
  }

  const guildId = interaction.guildId;

  if (!isConnected(guildId)) {
    await interaction.reply({
      content: 'The radio is not currently playing in any voice channel.',
      ephemeral: true,
    });
    return;
  }

  try {
    await interaction.deferReply();
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 10062) {
      logger.warn(`guild:${guildId}`, 'Interaction expired before deferring /leave');
      return;
    }
    logger.warn(`guild:${guildId}`, `deferReply failed for /leave, attempting to continue: ${err instanceof Error ? err.message : err}`);
  }

  try {
    await disconnect(guildId);
    await logger.event(guildId, 'leave', 'Left voice channel', {
      requested_by: interaction.user.tag,
    });
    try {
      await interaction.editReply('Radio stopped. Goodbye!');
    } catch (replyErr) {
      logger.warn(`guild:${guildId}`, `Failed to send success reply for /leave: ${replyErr instanceof Error ? replyErr.message : replyErr}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    logger.error(`guild:${guildId}`, 'Failed to leave voice channel', err);
    try {
      await interaction.editReply(`Failed to leave: ${message}`);
    } catch (replyErr) {
      logger.warn(`guild:${guildId}`, `Failed to send error reply for /leave: ${replyErr instanceof Error ? replyErr.message : replyErr}`);
    }
  }
}
