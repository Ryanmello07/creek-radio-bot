import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
export interface Command {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
export declare const commands: Map<string, Command>;
//# sourceMappingURL=index.d.ts.map