import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import * as join from './join';
import * as leave from './leave';

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands: Map<string, Command> = new Map([
  ['join', join as Command],
  ['leave', leave as Command],
]);
