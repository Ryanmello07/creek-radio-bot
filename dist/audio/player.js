"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLoopingPlayer = createLoopingPlayer;
const voice_1 = require("@discordjs/voice");
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const config_1 = require("../config");
const logger_1 = require("../logger");
function fetchStream(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https_1.default : http_1.default;
        const req = client.get(url, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                fetchStream(res.headers.location).then(resolve).catch(reject);
                return;
            }
            if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
                reject(new Error(`HTTP ${res.statusCode ?? 'unknown'} fetching audio stream`));
                return;
            }
            resolve(res);
        });
        req.on('error', reject);
    });
}
async function createLoopingPlayer(guildId) {
    const player = (0, voice_1.createAudioPlayer)({
        behaviors: {
            noSubscriber: voice_1.NoSubscriberBehavior.Pause,
        },
    });
    async function play() {
        try {
            const stream = await fetchStream(config_1.config.audio.streamUrl);
            const resource = (0, voice_1.createAudioResource)(stream, { inputType: voice_1.StreamType.Arbitrary });
            player.play(resource);
        }
        catch (err) {
            logger_1.logger.error(`guild:${guildId}`, 'Failed to fetch audio stream — retrying in 3s', err);
            setTimeout(() => void play(), 3000);
        }
    }
    player.on(voice_1.AudioPlayerStatus.Idle, () => {
        logger_1.logger.debug(`guild:${guildId}`, 'Track ended — restarting loop');
        void play();
    });
    player.on('error', (err) => {
        logger_1.logger.error(`guild:${guildId}`, 'Audio player error — restarting', err);
        void play();
    });
    await play();
    return player;
}
//# sourceMappingURL=player.js.map