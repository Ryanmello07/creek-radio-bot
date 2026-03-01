"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
function optionalEnv(key) {
    return process.env[key] || undefined;
}
exports.config = {
    discord: {
        token: requireEnv('DISCORD_TOKEN'),
        clientId: requireEnv('DISCORD_CLIENT_ID'),
        guildId: optionalEnv('DISCORD_GUILD_ID'),
    },
    supabase: {
        url: optionalEnv('SUPABASE_URL') ?? optionalEnv('VITE_SUPABASE_URL') ?? '',
        serviceRoleKey: optionalEnv('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    },
    audio: {
        streamUrl: requireEnv('AUDIO_STREAM_URL'),
    },
};
//# sourceMappingURL=config.js.map