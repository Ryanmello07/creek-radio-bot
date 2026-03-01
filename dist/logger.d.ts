export declare const logger: {
    info(context: string, message: string): void;
    warn(context: string, message: string): void;
    error(context: string, message: string, err?: unknown): void;
    debug(context: string, message: string): void;
    event(guildId: string, eventType: string, message: string, metadata?: Record<string, unknown>): Promise<void>;
};
//# sourceMappingURL=logger.d.ts.map