import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { isConnected, getRadioPlayer } from '../audio/connectionManager';
import { logger } from '../logger';
import { tracklist, getCurrentTrack } from '../data/tracklist';

const EXPIRE_MS = 86_400_000;
const BUTTON_ID = 'current_refresh';

function formatTimestamp(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildEmbed(positionSeconds: number): EmbedBuilder {
  const trackInfo = getCurrentTrack(positionSeconds);
  const embed = new EmbedBuilder()
    .setTitle('Radio Status')
    .setColor(0x2b2d31);

  if (trackInfo) {
    const { track, index, elapsed, nextTrack } = trackInfo;
    const elapsedFormatted = formatTimestamp(elapsed);
    const trackDuration = nextTrack
      ? nextTrack.startSeconds - track.startSeconds
      : null;

    embed.addFields(
      { name: 'Now Playing', value: `**${track.song}** -- ${track.artist}`, inline: false },
      { name: 'Track', value: `${index + 1} / ${tracklist.length}`, inline: true },
      { name: 'Track Time', value: trackDuration ? `${elapsedFormatted} / ${formatTimestamp(trackDuration)}` : elapsedFormatted, inline: true },
      { name: 'Radio Time', value: formatTimestamp(positionSeconds), inline: true },
    );

    if (nextTrack) {
      embed.addFields({ name: 'Up Next', value: `${nextTrack.song} -- ${nextTrack.artist}`, inline: false });
    }
  } else {
    embed.addFields({ name: 'Radio Time', value: formatTimestamp(positionSeconds), inline: false });
  }

  embed.setTimestamp();

  return embed;
}

function buildRow(disabled = false): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTON_ID)
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
  );
}

export const data = new SlashCommandBuilder()
  .setName('current')
  .setDescription('Show current radio time and what\'s playing');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
    return;
  }

  const guildId = interaction.guildId;

  if (!isConnected(guildId)) {
    await interaction.reply({
      content: 'The radio is not currently playing. Use `/join` first.',
      ephemeral: true,
    });
    return;
  }

  const radioPlayer = getRadioPlayer(guildId);
  if (!radioPlayer) {
    await interaction.reply({ content: 'Could not read playback state.', ephemeral: true });
    return;
  }

  const position = radioPlayer.getCurrentPosition();
  const embed = buildEmbed(position);
  const row = buildRow();

  const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.customId === BUTTON_ID,
    time: EXPIRE_MS,
  });

  collector.on('collect', async (btnInteraction) => {
    try {
      await btnInteraction.deferUpdate();
      const player = getRadioPlayer(guildId);
      const pos = player ? player.getCurrentPosition() : 0;
      const updatedEmbed = buildEmbed(pos);
      await btnInteraction.editReply({ embeds: [updatedEmbed], components: [buildRow()] });
    } catch (err) {
      logger.warn(`guild:${guildId}`, `Failed to update /current embed: ${err instanceof Error ? err.message : err}`);
    }
  });

  collector.on('end', async () => {
    try {
      const player = getRadioPlayer(guildId);
      const pos = player ? player.getCurrentPosition() : 0;
      const finalEmbed = buildEmbed(pos).setFooter({ text: 'Expired -- use /current again' });
      await interaction.editReply({ embeds: [finalEmbed], components: [buildRow(true)] });
    } catch {
      // message may have been deleted
    }
  });
}
