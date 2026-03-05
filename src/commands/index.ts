import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import * as join from './join';
import * as leave from './leave';
import * as restart from './restart';
import * as seek from './seek';
import * as current from './current';

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands: Map<string, Command> = new Map([
  ['join', join as Command],
  ['leave', leave as Command],
  ['restart', restart as Command],
  ['seek', seek as Command],
  ['current', current as Command],
]);
