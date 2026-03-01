"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.closeSession = closeSession;
exports.closeAllGuildSessions = closeAllGuildSessions;
exports.logEvent = logEvent;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("./config");
function buildClient() {
    if (!config_1.config.supabase.url || !config_1.config.supabase.serviceRoleKey) {
        console.warn('[Supabase] No service role key set — session logging is disabled');
        return null;
    }
    return (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
const supabase = buildClient();
async function createSession(guildId, channelId, channelName) {
    if (!supabase)
        return null;
    const { data, error } = await supabase
        .from('bot_sessions')
        .insert({ guild_id: guildId, channel_id: channelId, channel_name: channelName })
        .select('id')
        .maybeSingle();
    if (error) {
        console.error('[Supabase] Failed to create session:', error.message);
        return null;
    }
    return data?.id ?? null;
}
async function closeSession(sessionId) {
    if (!supabase)
        return;
    const { error } = await supabase
        .from('bot_sessions')
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq('id', sessionId);
    if (error) {
        console.error('[Supabase] Failed to close session:', error.message);
    }
}
async function closeAllGuildSessions(guildId) {
    if (!supabase)
        return;
    const { error } = await supabase
        .from('bot_sessions')
        .update({ is_active: false, left_at: new Date().toISOString() })
        .eq('guild_id', guildId)
        .eq('is_active', true);
    if (error) {
        console.error('[Supabase] Failed to close guild sessions:', error.message);
    }
}
async function logEvent(guildId, eventType, message, metadata) {
    if (!supabase)
        return;
    const { error } = await supabase.from('bot_events').insert({
        guild_id: guildId,
        event_type: eventType,
        message,
        metadata: metadata ?? null,
    });
    if (error) {
        console.error('[Supabase] Failed to log event:', error.message);
    }
}
//# sourceMappingURL=supabase.js.map