"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isConnected = isConnected;
exports.connect = connect;
exports.disconnect = disconnect;
exports.disconnectAll = disconnectAll;
const voice_1 = require("@discordjs/voice");
const player_1 = require("./player");
const logger_1 = require("../logger");
const supabase_1 = require("../supabase");
const connections = new Map();
function isConnected(guildId) {
    return connections.has(guildId);
}
async function connect(channel) {
    const { guild, id: channelId, name: channelName } = channel;
    const guildId = guild.id;
    if (connections.has(guildId)) {
        throw new Error('Bot is already connected to a voice channel in this server.');
    }
    const connection = (0, voice_1.joinVoiceChannel)({
        channelId,
        guildId,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: false,
    });
    logger_1.logger.info(`guild:${guildId}`, `Joining voice channel: ${channelName} (${channelId})`);
    try {
        await (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Ready, 20000);
    }
    catch (err) {
        connection.destroy();
        throw new Error('Timed out while connecting to the voice channel. Please try again.');
    }
    const player = await (0, player_1.createLoopingPlayer)(guildId);
    connection.subscribe(player);
    const sessionId = await (0, supabase_1.createSession)(guildId, channelId, channelName);
    connections.set(guildId, { connection, player, sessionId });
    connection.on(voice_1.VoiceConnectionStatus.Disconnected, async () => {
        logger_1.logger.warn(`guild:${guildId}`, 'Connection disconnected — attempting to recover');
        try {
            await Promise.race([
                (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Signalling, 5000),
                (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Connecting, 5000),
            ]);
        }
        catch {
            logger_1.logger.warn(`guild:${guildId}`, 'Recovery failed — destroying connection');
            await cleanupGuild(guildId);
        }
    });
    connection.on(voice_1.VoiceConnectionStatus.Destroyed, async () => {
        logger_1.logger.info(`guild:${guildId}`, 'Voice connection destroyed');
        await cleanupGuild(guildId);
    });
    logger_1.logger.info(`guild:${guildId}`, `Connected and streaming in: ${channelName}`);
}
async function disconnect(guildId) {
    const entry = connections.get(guildId);
    if (!entry) {
        throw new Error('Bot is not connected to a voice channel in this server.');
    }
    entry.player.stop(true);
    entry.connection.destroy();
}
async function cleanupGuild(guildId) {
    const entry = connections.get(guildId);
    if (!entry)
        return;
    connections.delete(guildId);
    if (entry.sessionId) {
        await (0, supabase_1.closeSession)(entry.sessionId);
    }
    else {
        await (0, supabase_1.closeAllGuildSessions)(guildId);
    }
    logger_1.logger.info(`guild:${guildId}`, 'Cleaned up connection resources');
}
async function disconnectAll() {
    const guildIds = [...connections.keys()];
    await Promise.all(guildIds.map((guildId) => disconnect(guildId).catch(() => cleanupGuild(guildId))));
}
//# sourceMappingURL=connectionManager.js.map