# Discord Radio Bot

A Discord bot that joins a voice channel and continuously loops a music file to simulate a live radio station.

## Prerequisites

- Node.js 18 or later
- **ffmpeg** installed on your system
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: Download from https://ffmpeg.org/download.html and add to PATH
- A Discord application and bot token

## Setup

### 1. Create a Discord Application

1. Go to https://discord.com/developers/applications
2. Click **New Application** and give it a name
3. Go to the **Bot** tab and click **Add Bot**
4. Under **Token**, click **Reset Token** and copy it
5. Under **Privileged Gateway Intents**, enable **Server Members Intent** and **Message Content Intent** if needed
6. Go to **OAuth2 > General** and copy the **Client ID**

### 2. Invite the Bot to Your Server

Use this URL (replace `YOUR_CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=3145728&scope=bot%20applications.commands
```

The permissions `3145728` includes: Connect + Speak in voice channels.

### 3. Configure Environment Variables

Copy `.env` and fill in the required values:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_client_id_here
DISCORD_GUILD_ID=your_server_id_here        # optional: for faster dev command registration

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

MUSIC_FILE_PATH=music/radio.mp3             # path to your music file
```

To get the Supabase service role key: go to your Supabase project > Settings > API > `service_role` secret.

### 4. Add Your Music File

Place your music file in the `music/` directory. Supported formats: **mp3, wav, ogg, flac**.

```
music/
  radio.mp3   ← your file here
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Register Slash Commands

This only needs to be run once (or whenever commands change):

```bash
npm run deploy-commands
```

If `DISCORD_GUILD_ID` is set, commands register instantly for that server. Without it, global registration can take up to 1 hour.

### 7. Start the Bot

**Development (TypeScript, with ts-node):**
```bash
npm run dev
```

**Production (compiled JavaScript):**
```bash
npm run build
npm start
```

## Commands

| Command  | Description                                              |
|----------|----------------------------------------------------------|
| `/join`  | Bot joins your current voice channel and starts the radio |
| `/leave` | Bot stops the radio and leaves the voice channel         |

## Project Structure

```
src/
  index.ts                  Main bot entry point
  config.ts                 Environment variable loading
  supabase.ts               Database client and query helpers
  logger.ts                 Logging utility
  deploy-commands.ts        One-time slash command registration script
  audio/
    player.ts               Looping audio player
    connectionManager.ts    Per-guild voice connection lifecycle
  commands/
    join.ts                 /join slash command
    leave.ts                /leave slash command
    index.ts                Command registry
music/
  radio.mp3                 Your music file (add this yourself)
```

## Database

The bot uses Supabase to persist:
- **bot_sessions** — tracks active and historical voice channel connections per guild
- **bot_events** — append-only log of join/leave/error events with metadata

## Troubleshooting

**"Music file not found"** — Make sure your file exists at the path set in `MUSIC_FILE_PATH`.

**Audio sounds distorted or won't play** — Ensure `ffmpeg` is installed and accessible in your PATH.

**Commands not showing up** — Run `npm run deploy-commands` again. If `DISCORD_GUILD_ID` is not set, wait up to 1 hour for global propagation.

**Bot joins but no audio** — Check that the bot has the **Connect** and **Speak** permissions in the target voice channel.
