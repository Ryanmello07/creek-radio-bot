"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const connectionManager_1 = require("../audio/connectionManager");
const logger_1 = require("../logger");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('join')
    .setDescription('Join your current voice channel and start streaming the radio');
async function execute(interaction) {
    if (!interaction.guildId || !interaction.guild) {
        await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
        return;
    }
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
        await interaction.reply({
            content: 'You need to join a voice channel first.',
            ephemeral: true,
        });
        return;
    }
    if ((0, connectionManager_1.isConnected)(interaction.guildId)) {
        await interaction.reply({
            content: 'The radio is already playing in a voice channel. Use `/leave` to stop it first.',
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply();
    try {
        await (0, connectionManager_1.connect)(voiceChannel);
        await logger_1.logger.event(interaction.guildId, 'join', `Joined ${voiceChannel.name}`, {
            channel_id: voiceChannel.id,
            requested_by: interaction.user.tag,
        });
        await interaction.editReply(`Radio is now streaming in **${voiceChannel.name}**. Use \`/leave\` to stop.`);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        logger_1.logger.error(`guild:${interaction.guildId}`, 'Failed to join voice channel', err);
        await interaction.editReply(`Failed to join: ${message}`);
    }
}
//# sourceMappingURL=join.js.map