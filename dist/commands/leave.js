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
        if (code !== 40060) {
            throw err;
        }
    }
    try {
        await (0, connectionManager_1.disconnect)(guildId);
        await logger_1.logger.event(guildId, 'leave', 'Left voice channel', {
            requested_by: interaction.user.tag,
        });
        await interaction.editReply('Radio stopped. Goodbye!');
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        logger_1.logger.error(`guild:${guildId}`, 'Failed to leave voice channel', err);
        await interaction.editReply(`Failed to leave: ${message}`);
    }
}
//# sourceMappingURL=leave.js.map