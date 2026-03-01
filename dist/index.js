"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const logger_1 = require("./logger");
const commands_1 = require("./commands");
const connectionManager_1 = require("./audio/connectionManager");
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildVoiceStates],
});
client.once(discord_js_1.Events.ClientReady, (readyClient) => {
    logger_1.logger.info('Bot', `Logged in as ${readyClient.user.tag}`);
    logger_1.logger.info('Bot', `Serving ${readyClient.guilds.cache.size} guild(s)`);
    logger_1.logger.info('Bot', `Stream URL: ${config_1.config.audio.streamUrl}`);
});
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    const command = commands_1.commands.get(interaction.commandName);
    if (!command) {
        logger_1.logger.warn('Bot', `Unknown command: ${interaction.commandName}`);
        await interaction.reply({
            content: 'Unknown command.',
            ephemeral: true,
        });
        return;
    }
    try {
        await command.execute(interaction);
    }
    catch (err) {
        const errCode = err.code;
        if (errCode === 10062) {
            logger_1.logger.warn('Bot', `Interaction expired before responding to /${interaction.commandName}`);
            return;
        }
        logger_1.logger.error('Bot', `Error executing /${interaction.commandName}`, err);
        const reply = { content: 'Something went wrong. Please try again.', ephemeral: true };
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            }
            else {
                await interaction.reply(reply);
            }
        }
        catch (replyErr) {
            logger_1.logger.error('Bot', `Failed to send error reply for /${interaction.commandName}`, replyErr);
        }
    }
});
async function shutdown() {
    logger_1.logger.info('Bot', 'Shutting down — disconnecting all voice channels...');
    await (0, connectionManager_1.disconnectAll)();
    client.destroy();
    logger_1.logger.info('Bot', 'Shutdown complete');
    process.exit(0);
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
void client.login(config_1.config.discord.token);
//# sourceMappingURL=index.js.map