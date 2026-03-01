"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const supabase_1 = require("./supabase");
function timestamp() {
    return new Date().toISOString();
}
function format(level, context, message) {
    return `[${timestamp()}] [${level.toUpperCase()}] [${context}] ${message}`;
}
exports.logger = {
    info(context, message) {
        console.log(format('info', context, message));
    },
    warn(context, message) {
        console.warn(format('warn', context, message));
    },
    error(context, message, err) {
        const detail = err instanceof Error ? ` — ${err.message}` : '';
        console.error(format('error', context, `${message}${detail}`));
    },
    debug(context, message) {
        if (process.env['NODE_ENV'] === 'development') {
            console.debug(format('debug', context, message));
        }
    },
    async event(guildId, eventType, message, metadata) {
        console.log(format('info', `guild:${guildId}`, `[${eventType}] ${message}`));
        await (0, supabase_1.logEvent)(guildId, eventType, message, metadata);
    },
};
//# sourceMappingURL=logger.js.map