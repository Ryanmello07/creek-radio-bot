import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { config } from './config';
import { commands } from './commands';
import { logger } from './logger';

const rest = new REST().setToken(config.discord.token);

async function deploy(): Promise<void> {
  const commandData = [...commands.values()].map((cmd) => cmd.data.toJSON());

  logger.info('Deploy', `Registering ${commandData.length} slash command(s)...`);

  if (config.discord.guildId) {
    logger.info('Deploy', `Target: guild ${config.discord.guildId} (instant)`);
    await rest.put(Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId), {
      body: commandData,
    });
    logger.info('Deploy', 'Guild commands registered successfully');
  } else {
    logger.info('Deploy', 'Target: global (may take up to 1 hour to propagate)');
    await rest.put(Routes.applicationCommands(config.discord.clientId), {
      body: commandData,
    });
    logger.info('Deploy', 'Global commands registered successfully');
  }
}

deploy().catch((err) => {
  logger.error('Deploy', 'Failed to register commands', err);
  process.exit(1);
});
