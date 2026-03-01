import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ChatInputCommandInteraction, Interaction } from 'discord.js';
import { config } from './config';
import { logger } from './logger';
import { commands } from './commands';
import { disconnectAll } from './audio/connectionManager';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once(Events.ClientReady, (readyClient) => {
  logger.info('Bot', `Logged in as ${readyClient.user.tag}`);
  logger.info('Bot', `Serving ${readyClient.guilds.cache.size} guild(s)`);
  logger.info('Bot', `Music file: ${config.audio.filePath}`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) {
    logger.warn('Bot', `Unknown command: ${interaction.commandName}`);
    await (interaction as ChatInputCommandInteraction).reply({
      content: 'Unknown command.',
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction as ChatInputCommandInteraction);
  } catch (err) {
    logger.error('Bot', `Error executing /${interaction.commandName}`, err);
    const reply = { content: 'Something went wrong. Please try again.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await (interaction as ChatInputCommandInteraction).followUp(reply);
    } else {
      await (interaction as ChatInputCommandInteraction).reply(reply);
    }
  }
});

async function shutdown(): Promise<void> {
  logger.info('Bot', 'Shutting down — disconnecting all voice channels...');
  await disconnectAll();
  client.destroy();
  logger.info('Bot', 'Shutdown complete');
  process.exit(0);
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

void client.login(config.discord.token);
