import { VoiceBasedChannel } from 'discord.js';
export declare function isConnected(guildId: string): boolean;
export declare function connect(channel: VoiceBasedChannel): Promise<void>;
export declare function disconnect(guildId: string): Promise<void>;
export declare function disconnectAll(): Promise<void>;
//# sourceMappingURL=connectionManager.d.ts.map