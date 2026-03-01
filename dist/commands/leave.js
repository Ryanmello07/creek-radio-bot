"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const connectionManager_1 = require("../audio/connectionManager");
const logger_1 = require("../logger");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('leave')
    .setDescription('Stop the radio and leave the current voice channel');
async function execute(interaction) {
    if (!interaction.guildId) {
        await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
        return;
    }
    const guildId = interaction.guildId;
    if (!(0, connectionManager_1.isConnected)(guildId)) {
        await interaction.reply({
            content: 'The radio is not currently playing in any voice channel.',
            ephemeral: true,
        });
        return;
    }
    try {
        await interaction.deferReply();
    }
    catch (err) {
        const code = err.code;
        if (code === 10062) {
            logger_1.logger.warn(`guild:${guildId}`, 'Interaction expired before deferring /leave');
            return;
        }
        logger_1.logger.warn(`guild:${guildId}`, `deferReply failed for /leave, attempting to continue: ${err instanceof Error ? err.message : err}`);
    }
    try {
        await (0, connectionManager_1.disconnect)(guildId);
        await logger_1.logger.event(guildId, 'leave', 'Left voice channel', {
            requested_by: interaction.user.tag,
        });
        try {
            await interaction.editReply('Radio stopped. Goodbye!');
        }
        catch (replyErr) {
            logger_1.logger.warn(`guild:${guildId}`, `Failed to send success reply for /leave: ${replyErr instanceof Error ? replyErr.message : replyErr}`);
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        logger_1.logger.error(`guild:${guildId}`, 'Failed to leave voice channel', err);
        try {
            await interaction.editReply(`Failed to leave: ${message}`);
        }
        catch (replyErr) {
            logger_1.logger.warn(`guild:${guildId}`, `Failed to send error reply for /leave: ${replyErr instanceof Error ? replyErr.message : replyErr}`);
        }
    }
}
//# sourceMappingURL=leave.js.map