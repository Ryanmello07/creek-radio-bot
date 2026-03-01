export interface BotSession {
    id: string;
    guild_id: string;
    channel_id: string;
    channel_name: string;
    joined_at: string;
    left_at: string | null;
    is_active: boolean;
}
export interface BotEvent {
    id: string;
    guild_id: string;
    event_type: string;
    message: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
}
export declare function createSession(guildId: string, channelId: string, channelName: string): Promise<string | null>;
export declare function closeSession(sessionId: string): Promise<void>;
export declare function closeAllGuildSessions(guildId: string): Promise<void>;
export declare function logEvent(guildId: string, eventType: string, message: string, metadata?: Record<string, unknown>): Promise<void>;
//# sourceMappingURL=supabase.d.ts.map