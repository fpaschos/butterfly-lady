# 🦋 Butterfly Lady

A Discord bot for **Legend of the Five Rings 4th Edition** RPG, featuring dice rolling with the Roll & Keep system.

## Features

### ✅ Phase 1 & 2 (Current)
- **🎲 Advanced Roll & Keep System** - Full L5R 4th Edition mechanics
  - **Explosion Modes**: Skilled (10s), Unskilled (none), Mastery (9s & 10s)
  - **Ten Dice Rule**: Automatic conversion for rolls >10k10
  - **Target Numbers**: Roll vs TN with success/failure indicators
  - **Raises**: Called raises (+5 to TN each) with auto-calculation
  - **Emphasis**: Reroll low dice on specialized skills
  - **Modifiers**: Add/subtract bonuses
  - Beautiful Discord embeds with detailed breakdowns
- **📖 Enhanced Help System** - Interactive help for all commands
- **🐳 Docker Support** - Easy local deployment with Docker Compose
- **🎯 Seedrandom RNG** - OS-entropy based randomness with testing support

### 🔮 Coming Soon
- **Phase 3**: Statistics Emulator - Probability simulations for rolls
- **Phase 4**: RAG Integration - L5R lore/rules lookup with AI
- **Phase 5**: Character Management - Store character sheets

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

### `/roll <expression> [flags] [options]`
Roll dice using L5R 4th Edition Roll & Keep system with advanced mechanics.

**Format:** `XkY[+/-Z] [flags] [tn:N] [r:N] [e or e:N]`

**Flags (before tn/raises):**
- _(default)_ = Skilled (10s explode)
- `u` = Unskilled (no explosions)
- `m` = Mastery (9s and 10s explode)

**Options:**
- `tn:N` = Target Number to beat
- `r:N` = Called raises (+5 to TN each)
- `e` or `e:N` = Emphasis (reroll dice ≤N, e defaults to e:1)

**Examples:**
```
/roll 5k3                    Basic roll (10s explode)
/roll 5k3 u                  Unskilled (no explosions)
/roll 7k4 m                  Mastery (9s and 10s explode)
/roll 7k4+10 tn:20           Roll vs TN 20
/roll 8k5 tn:25 r:2          2 called raises (TN becomes 30)
/roll 6k3 e                  Emphasis (reroll 1s, e=e:1)
/roll 6k3 e:2 tn:15          Emphasis (reroll ≤2)
/roll 12k5+10 m tn:30        Ten Dice Rule applies (→10k6+10)
/roll 8k5 m e:2 tn:25 r:2    Everything combined
```

**Explosion Modes:**
- **Skilled** (default): 10s explode - roll again and add
- **Unskilled** (u): No explosions
- **Mastery** (m): 9s and 10s both explode

**Ten Dice Rule:**
Rolls over 10k10 auto-convert:
- `12k4` → `10k5` (2 extra rolled → 1 kept)
- `14k12` → `10k10+12` (excess becomes bonuses)

### `/help [command]`
Get help with bot commands.

**Examples:**
```
/help              Show all commands with Phase 2 features
/help roll         Detailed help for roll command
```

**Key Changes:**
- Emphasis `e` defaults to `e:1` (reroll 1s)
- All rolls show detailed breakdown
- Removed skill names (not needed)

## Project Structure

```
butterfly-lady/
├── docker-compose.yml       # Production Docker setup
├── docker-compose.dev.yml   # Development Docker setup
├── Dockerfile               # Multi-stage build (prod + dev)
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── env.example              # Environment template
├── data/
│   └── schools.json         # L5R schools (for Phase 4)
└── src/
    ├── index.ts             # Bot entry point
    ├── commands/            # Slash commands
    │   ├── roll.ts
    │   └── help.ts
    ├── utils/               # Utilities
    │   ├── dice.ts          # Roll & Keep logic
    │   ├── parser.ts        # Expression parser
    │   └── formatter.ts     # Discord embeds
    └── types/               # TypeScript types
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

- **Multi-stage build**: Single Dockerfile with `development` and `production` targets
- **Production**: Optimized image with only runtime dependencies
- **Development**: Hot-reload with mounted volumes

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
- **Containerization**: Docker & Docker Compose
- **Build Tool**: TypeScript Compiler (tsc)

## Contributing

This bot is in active development. Planned features:
- Phase 3: Roll statistics and probability analysis
- Phase 4: RAG-based L5R lore/rules lookup
- Phase 5: Character sheet management

## Reference

Inspired by [Panku bot](https://github.com/wargamesqcf/L5R-discord-bot) for L5R mechanics and command ideas.

## License

MIT

