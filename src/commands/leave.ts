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
    if (code !== 40060) {
      throw err;
    }
  }

  try {
    await disconnect(guildId);
    await logger.event(guildId, 'leave', 'Left voice channel', {
      requested_by: interaction.user.tag,
    });
    await interaction.editReply('Radio stopped. Goodbye!');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    logger.error(`guild:${guildId}`, 'Failed to leave voice channel', err);
    await interaction.editReply(`Failed to leave: ${message}`);
  }
}
