# 🦋 Butterfly Lady - Setup Guide

## Quick Start (5 minutes)

### Step 1: Get Your Discord Bot Token

1. Your bot is already created with Application ID: `1448956089570820126`
2. Go to [Discord Developer Portal](https://discord.com/developers/applications/1448956089570820126/bot)
3. Under the "Bot" tab, click **"Reset Token"** and copy the new token
4. **Save this token securely** - you'll need it in Step 2

### Step 2: Create Environment File

```bash
# Copy the example file
cp env.example .env

# Edit .env and paste your bot token
# Replace "your_discord_bot_token_here" with your actual token
nano .env   # or use your favorite editor
```

Your `.env` should look like:
```env
DISCORD_TOKEN=your_actual_token_here
DISCORD_CLIENT_ID=1448956089570820126
```

### Step 3: Invite Bot to Your Server

1. Go to [OAuth2 URL Generator](https://discord.com/developers/applications/1448956089570820126/oauth2/url-generator)
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Use Application Commands
4. Copy the generated URL and open it in your browser
5. Select your Discord server and authorize

### Step 4: Install Dependencies

```bash
pnpm install
```

If you don't have pnpm:
```bash
npm install -g pnpm
```

### Step 5: Run the Bot

**Option A: Local Development (recommended for testing)**
```bash
pnpm run dev
```

**Option B: Docker Compose (production-like)**
```bash
docker-compose up --build
```

**Option C: Docker Compose (development with hot-reload)**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Step 6: Test It!

In your Discord server, try:
```
/roll 5k3
/roll 7k4+10
/help
/help roll
```

## 🎉 You're Done!

The bot should respond with beautiful embeds showing your dice rolls!

## Troubleshooting

### "Missing required environment variables"
- Make sure `.env` file exists in the root directory
- Check that `DISCORD_TOKEN` is set correctly
- Token should start with something like `MTQ0ODk1NjA...`

### Commands not showing up
- Wait a few minutes (Discord needs time to register commands)
- Try using the command anyway - sometimes they work before showing in the menu
- Kick and re-invite the bot if commands don't appear after 10 minutes

### Bot offline
- Check console logs for errors
- Verify token is correct
- Make sure bot is invited to your server

### Permission errors
- Bot needs "Send Messages" and "Embed Links" permissions
- Check channel permissions if bot can't respond in specific channels

## Development Tips

### Watch Mode
```bash
pnpm run dev
```
Changes to TypeScript files will auto-reload!

### Build for Production
```bash
pnpm run build
pnpm start
```

### Docker Logs
```bash
docker-compose logs -f bot
```

### Stop Docker Services
```bash
docker-compose down
```

## What's Next?

Check out the [README.md](README.md) for:
- Detailed command documentation
- Project structure
- How to add new commands
- Upcoming features (statistics, RAG, character management)

## Need Help?

- Discord.js docs: https://discord.js.org/
- L5R 4th Edition rules: Check your core rulebook
- Docker docs: https://docs.docker.com/

---

**Ready to roll some dice and serve the Emperor!** 🎲⚔️
