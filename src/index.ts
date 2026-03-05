import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ChatInputCommandInteraction, Interaction } from 'discord.js';
import { config } from './config';
import { logger } from './logger';
import { commands } from './commands';
import { disconnectAll } from './audio/connectionManager';
import { closeAllStaleSessions } from './supabase';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once(Events.ClientReady, async (readyClient) => {
  logger.info('Bot', `Logged in as ${readyClient.user.tag}`);
  logger.info('Bot', `Serving ${readyClient.guilds.cache.size} guild(s)`);
  logger.info('Bot', `Stream URL: ${config.audio.streamUrl}`);
  await closeAllStaleSessions();
  logger.info('Bot', 'Closed any stale sessions from previous runs');
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
    const errCode = (err as { code?: number }).code;
    if (errCode === 10062) {
      logger.warn('Bot', `Interaction expired before responding to /${interaction.commandName}`);
      return;
    }
    logger.error('Bot', `Error executing /${interaction.commandName}`, err);
    const reply = { content: 'Something went wrong. Please try again.', ephemeral: true };
    try {
      if (interaction.replied || interaction.deferred) {
        await (interaction as ChatInputCommandInteraction).followUp(reply);
      } else {
        await (interaction as ChatInputCommandInteraction).reply(reply);
      }
    } catch (replyErr) {
      logger.error('Bot', `Failed to send error reply for /${interaction.commandName}`, replyErr);
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

process.on('uncaughtException', (err) => {
  logger.error('Bot', 'Uncaught exception — shutting down gracefully', err);
  void shutdown();
});

process.on('unhandledRejection', (reason) => {
  logger.error('Bot', 'Unhandled rejection', reason);
});

void client.login(config.discord.token);
