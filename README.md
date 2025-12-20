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
- **Phase 3B**: Statistics & Probability - Roll simulations and probability analysis
- **Phase 3C**: Character Management - Store character sheets and quick stats
- **Phase 4**: Image Generation - AI-generated maps and tokens
- **Phase 5**: VTT Integration - Virtual tabletop with React + Pixi.js
  - Real-time map and token management
  - Discord ↔ VTT synchronization
  - Fog of war and measurement tools

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

This project uses a **monorepo structure** with three TypeScript packages:

```
butterfly-lady/
├── packages/
│   ├── core/                      # @butterfly-lady/core
│   │   ├── src/
│   │   │   ├── dice/              # Roll & Keep logic
│   │   │   │   ├── dice.ts        # Core dice rolling
│   │   │   │   ├── parser.ts      # Expression parser
│   │   │   │   └── index.ts
│   │   │   ├── types/             # Type definitions
│   │   │   │   ├── dice.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts           # Main exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── bot/                       # @butterfly-lady/bot
│   │   ├── src/
│   │   │   ├── commands/          # Discord slash commands
│   │   │   │   ├── roll.ts
│   │   │   │   ├── help.ts
│   │   │   │   └── index.ts
│   │   │   ├── formatters/        # Discord embeds
│   │   │   │   ├── rollEmbed.ts
│   │   │   │   └── index.ts
│   │   │   ├── types/             # Discord types
│   │   │   │   ├── commands.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts           # Bot initialization
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── backend/                   # @butterfly-lady/backend
│       ├── src/
│       │   └── index.ts           # Main entry point
│       ├── package.json
│       └── tsconfig.json
│
├── data/
│   └── schools.json               # L5R schools (for Phase 4)
├── docker-compose.yml             # Production Docker setup
├── docker-compose.dev.yml         # Development Docker setup
├── Dockerfile                     # Multi-stage build (prod + dev)
├── package.json                   # Workspace root
├── pnpm-workspace.yaml            # Workspace configuration
└── env.example                    # Environment template
```

### Package Responsibilities

- **@butterfly-lady/core** - Pure L5R 4th Edition business logic
  - No Discord dependencies
  - Reusable dice rolling, parsing, and game mechanics
  - Can be used by future VTT, web apps, or other clients

- **@butterfly-lady/bot** - Discord integration layer
  - Discord.js commands and formatters
  - Bot lifecycle management
  - Depends on: `@butterfly-lady/core`

- **@butterfly-lady/backend** - Main orchestrator
  - Environment configuration
  - Bot startup and shutdown
  - Signal handling
  - Depends on: `@butterfly-lady/bot`

### Dependency Graph

```
backend (entry point)
  └─> bot (Discord integration)
       └─> core (L5R game logic)
```

## Development

### Monorepo Commands

```bash
# Install all workspace dependencies
pnpm install

# Build all packages
pnpm run build

# Build specific package
pnpm --filter @butterfly-lady/core build
pnpm --filter @butterfly-lady/bot build
pnpm --filter @butterfly-lady/backend build

# Run in development mode (hot-reload)
pnpm run dev

# Lint all packages
pnpm run lint

# Clean build artifacts
pnpm run clean
```

### Adding New Commands

1. Create a new file in `packages/bot/src/commands/`
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

3. Import and register in `packages/bot/src/index.ts`

### Adding Core Logic

1. Add new logic to `packages/core/src/`
2. Export from `packages/core/src/index.ts`
3. Use in bot commands: `import { yourFunction } from '@butterfly-lady/core'`

### TypeScript

The project uses strict TypeScript configuration:
- Strict mode enabled
- ESM modules with `.js` extensions in imports
- Full type safety across all packages
- Workspace references for cross-package types

### Docker

- **Multi-stage build**: Single Dockerfile with `development` and `production` targets
- **Production**: Optimized image with only runtime dependencies
- **Development**: Hot-reload with mounted volumes for all packages
- **Workspace-aware**: Properly handles pnpm workspace dependencies

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
- **Package Manager**: pnpm (with workspaces)
- **Architecture**: Monorepo with 3 packages
- **Containerization**: Docker & Docker Compose
- **Build Tool**: TypeScript Compiler (tsc)
- **Random Number Generation**: Seedrandom (OS-entropy based)

## Architecture Benefits

The monorepo structure provides:

1. **Clean Separation** - Business logic separated from Discord integration
2. **Reusable Core** - Core L5R logic can be used in VTT, web apps, etc.
3. **Type Safety** - Shared types across all packages
4. **Independent Testing** - Test core logic without Discord mocks
5. **Future Ready** - Easy to add VTT server, frontend, statistics packages

## Contributing

This bot is in active development. Planned features:
- Phase 3B: Statistics and probability analysis
- Phase 3C: Character sheet management
- Phase 4: AI-generated maps and tokens
- Phase 5: VTT server with React + Pixi.js frontend

See [`VTT_ARCHITECTURE.md`](VTT_ARCHITECTURE.md) for detailed Phase 5 plans.

## Reference

Inspired by [Panku bot](https://github.com/wargamesqcf/L5R-discord-bot) for L5R mechanics and command ideas.

## License

MIT

