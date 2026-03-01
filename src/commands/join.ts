import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { connect, isConnected } from '../audio/connectionManager';
import { logger } from '../logger';

export const data = new SlashCommandBuilder()
  .setName('join')
  .setDescription('Join your current voice channel and start streaming the radio');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId || !interaction.guild) {
    await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
    return;
  }

  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      content: 'You need to join a voice channel first.',
      ephemeral: true,
    });
    return;
  }

  if (isConnected(interaction.guildId)) {
    await interaction.reply({
      content: 'The radio is already playing in a voice channel. Use `/leave` to stop it first.',
      ephemeral: true,
    });
    return;
  }

  try {
    await interaction.deferReply();
  } catch (err) {
    logger.warn(`guild:${interaction.guildId}`, 'Interaction expired before deferring /join');
    return;
  }

  try {
    await connect(voiceChannel);
    await logger.event(interaction.guildId, 'join', `Joined ${voiceChannel.name}`, {
      channel_id: voiceChannel.id,
      requested_by: interaction.user.tag,
    });
    await interaction.editReply(`Radio is now streaming in **${voiceChannel.name}**. Use \`/leave\` to stop.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    logger.error(`guild:${interaction.guildId}`, 'Failed to join voice channel', err);
    await interaction.editReply(`Failed to join: ${message}`);
  }
}
