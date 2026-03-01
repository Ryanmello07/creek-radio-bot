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

  const guildId = interaction.guildId;
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      content: 'You need to join a voice channel first.',
      ephemeral: true,
    });
    return;
  }

  if (isConnected(guildId)) {
    await interaction.reply({
      content: 'The radio is already playing in a voice channel. Use `/leave` to stop it first.',
      ephemeral: true,
    });
    return;
  }

  try {
    await interaction.deferReply();
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 10062) {
      logger.warn(`guild:${guildId}`, 'Interaction expired before deferring /join');
      return;
    }
    logger.warn(`guild:${guildId}`, `deferReply failed for /join, attempting to continue: ${err instanceof Error ? err.message : err}`);
  }

  try {
    await connect(voiceChannel);
    await logger.event(guildId, 'join', `Joined ${voiceChannel.name}`, {
      channel_id: voiceChannel.id,
      requested_by: interaction.user.tag,
    });
    try {
      await interaction.editReply(`Radio is now streaming in **${voiceChannel.name}**. Use \`/leave\` to stop.`);
    } catch (replyErr) {
      logger.warn(`guild:${guildId}`, `Failed to send success reply for /join: ${replyErr instanceof Error ? replyErr.message : replyErr}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    logger.error(`guild:${guildId}`, 'Failed to join voice channel', err);
    try {
      await interaction.editReply(`Failed to join: ${message}`);
    } catch (replyErr) {
      logger.warn(`guild:${guildId}`, `Failed to send error reply for /join: ${replyErr instanceof Error ? replyErr.message : replyErr}`);
    }
  }
}
