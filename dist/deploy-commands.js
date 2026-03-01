"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const commands_1 = require("./commands");
const logger_1 = require("./logger");
const rest = new discord_js_1.REST().setToken(config_1.config.discord.token);
async function deploy() {
    const commandData = [...commands_1.commands.values()].map((cmd) => cmd.data.toJSON());
    logger_1.logger.info('Deploy', `Registering ${commandData.length} slash command(s)...`);
    if (config_1.config.discord.guildId) {
        logger_1.logger.info('Deploy', `Target: guild ${config_1.config.discord.guildId} (instant)`);
        await rest.put(discord_js_1.Routes.applicationGuildCommands(config_1.config.discord.clientId, config_1.config.discord.guildId), {
            body: commandData,
        });
        logger_1.logger.info('Deploy', 'Guild commands registered successfully');
    }
    else {
        logger_1.logger.info('Deploy', 'Target: global (may take up to 1 hour to propagate)');
        await rest.put(discord_js_1.Routes.applicationCommands(config_1.config.discord.clientId), {
            body: commandData,
        });
        logger_1.logger.info('Deploy', 'Global commands registered successfully');
    }
}
deploy().catch((err) => {
    logger_1.logger.error('Deploy', 'Failed to register commands', err);
    process.exit(1);
});
//# sourceMappingURL=deploy-commands.js.map