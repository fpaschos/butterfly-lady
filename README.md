# 🦋 Butterfly Lady

A Discord bot for **Legend of the Five Rings 4th Edition** RPG, featuring dice rolling with the Roll & Keep system.

## Features

### ✅ Phase 1 (Current)
- **🎲 Roll & Keep Dice System** - Full L5R 4th Edition dice rolling
  - Support for XkY format (e.g., `5k3`, `7k4+10`)
  - Rule of 10 (exploding dice)
  - Modifiers (+/- values)
  - Beautiful Discord embeds with roll breakdowns
- **📖 Enhanced Help System** - Interactive help for all commands
- **🐳 Docker Support** - Easy local deployment with Docker Compose
- **🗄️ PostgreSQL Ready** - Database prepared for future features

### 🔮 Coming Soon
- **Phase 2**: Statistics Emulator - Probability simulations for rolls
- **Phase 3**: RAG Integration - L5R lore/rules lookup with AI (pgvector + LLM)
- **Phase 4**: Character Management - Store character sheets with JSONB

## Quick Start

### Prerequisites
- [Docker](https://www.docker.com/get-started) and Docker Compose
- [pnpm](https://pnpm.io/installation) (for local development)
- Discord Bot Token (see setup below)

### 1. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Your application ID is already created: `1448956089570820126`
3. Go to the "Bot" section and click "Reset Token" to get your bot token
4. Enable these **Privileged Gateway Intents** (if needed in future):
   - ❌ Presence Intent (not needed)
   - ❌ Server Members Intent (not needed)
   - ❌ Message Content Intent (not needed)
5. Go to OAuth2 → URL Generator:
   - Select scope: `bot`, `applications.commands`
   - Select bot permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`
   - Copy the generated URL and invite the bot to your server

### 2. Environment Setup

Create a `.env` file from the example:

```bash
cp env.example .env
```

Edit `.env` and add your Discord bot token:

```env
DISCORD_TOKEN=your_actual_bot_token_here
DISCORD_CLIENT_ID=1448956089570820126
```

### 3. Run with Docker Compose

**Production mode:**
```bash
docker-compose up --build
```

**Development mode (with hot-reload):**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

The bot will start and automatically register slash commands!

### 4. Local Development (without Docker)

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build for production
pnpm run build

# Run production build
pnpm start
```

## Commands

### `/roll <expression>`
Roll dice using L5R 4th Edition Roll & Keep system.

**Format:** `XkY[+/-Z]`
- X = number of dice to roll (1-100)
- Y = number of dice to keep (1-X)
- Z = optional modifier

**Examples:**
```
/roll 5k3          Roll 5 dice, keep 3 highest
/roll 7k4+10       Roll 7, keep 4, add 10
/roll 10k5-5       Roll 10, keep 5, subtract 5
/roll 3k2          Simple beginner roll
```

**The Rule of 10:**
When a d10 shows 10, it "explodes" - roll again and add to the total! A die can explode multiple times (10+10+3 = 23).

### `/help [command]`
Get help with bot commands.

**Examples:**
```
/help              Show all commands
/help roll         Detailed help for roll command
```

## Project Structure

```
butterfly-lady/
├── docker-compose.yml       # Production Docker setup
├── docker-compose.dev.yml   # Development Docker setup
├── Dockerfile              # Production build
├── Dockerfile.dev          # Development build
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── env.example             # Environment template
├── data/
│   └── schools.json        # L5R schools (for Phase 4)
└── src/
    ├── index.ts            # Bot entry point
    ├── commands/           # Slash commands
    │   ├── roll.ts
    │   └── help.ts
    ├── utils/              # Utilities
    │   ├── dice.ts         # Roll & Keep logic
    │   ├── parser.ts       # Expression parser
    │   └── formatter.ts    # Discord embeds
    └── types/              # TypeScript types
        ├── dice.ts
        └── commands.ts
```

## Development

### Adding New Commands

1. Create a new file in `src/commands/`
2. Implement the `Command` interface:

```typescript
import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../types/commands.js';

export const myCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('mycommand')
    .setDescription('My command description'),
  
  async execute(interaction) {
    await interaction.reply('Hello!');
  },
  
  metadata: {
    name: 'mycommand',
    description: 'Description',
    usage: '/mycommand',
    examples: ['/mycommand'],
    category: 'utility'
  }
};
```

3. Import and register in `src/index.ts`

### TypeScript

The project uses strict TypeScript configuration:
- Strict mode enabled
- ESM modules
- Full type safety

### Docker

- **Production**: Multi-stage build, optimized image
- **Development**: Hot-reload with mounted volumes
- **PostgreSQL**: Included for future features

## Troubleshooting

### Bot not responding
- Check that the bot is online in your Discord server
- Verify the bot has proper permissions
- Check Docker logs: `docker-compose logs bot`

### Commands not showing
- Slash commands can take up to 1 hour to register globally
- Try kicking and re-inviting the bot
- Check the console for registration errors

### Environment issues
- Ensure `.env` file exists and has valid values
- Token must be from the Bot section (not OAuth2)
- Client ID should be `1448956089570820126`

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 20
- **Framework**: Discord.js v14
- **Package Manager**: pnpm
- **Database**: PostgreSQL 16 (prepared for future)
- **Containerization**: Docker & Docker Compose
- **Build Tool**: TypeScript Compiler (tsc)

## Contributing

This bot is in active development. Planned features:
- Phase 2: Roll statistics and probability analysis
- Phase 3: RAG-based L5R lore/rules lookup (pgvector + OpenAI/Anthropic)
- Phase 4: Character sheet management with JSONB storage

## Reference

Inspired by [Panku bot](https://github.com/wargamesqcf/L5R-discord-bot) for L5R mechanics and command ideas.

## License

MIT

