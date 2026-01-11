# 🦋 Butterfly Lady

A Discord bot for **Legend of the Five Rings 4th Edition** RPG, featuring dice rolling with the Roll & Keep system.

## Features

### ✅ Phase 1, 2 & 3B (Current)
- **🎲 Advanced Roll & Keep System** - Full L5R 4th Edition mechanics
  - **Explosion Modes**: Skilled (10s), Unskilled (none), Mastery (9s & 10s)
  - **Ten Dice Rule**: Automatic conversion for rolls >10k10
  - **Target Numbers**: Roll vs TN with success/failure indicators
  - **Raises**: Called raises (+5 to TN each) with auto-calculation
  - **Emphasis**: Reroll low dice on specialized skills
  - **Modifiers**: Add/subtract bonuses
  - Beautiful Discord embeds with detailed breakdowns
- **📊 Probability & Statistics** - Monte Carlo simulated probability analysis
  - **Success Rate**: Calculate odds of beating any TN
  - **Statistics**: Mean, median, standard deviation, percentiles
  - **Precomputed Tables**: 330 roll combinations (1k1 to 10k10, all modes)
  - **Same Syntax**: All `/roll` flags work with `/prob`
  - **Fast Lookups**: Static JSON import, works in Node.js and browsers
- **📖 Enhanced Help System** - Interactive help for all commands
- **🐳 Docker Support** - Easy local deployment with Docker Compose
- **🎯 Seedrandom RNG** - OS-entropy based randomness with testing support

### 🔮 Coming Soon
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

### `/prob <expression> tn:<N> [flags] [options]`
Show probability statistics for an L5R roll before you make it.

**Format:** Same as `/roll` but **TN is required**

**What You Get:**
- **Success Rate**: Probability of beating the TN (with difficulty label)
- **Average**: Mean result (long-term average)
- **Standard Deviation (σ)**: Measure of roll variability
- **Typical Roll**: Median (50% of rolls are ≤ this value)
- **Common Range**: 25th-75th percentiles (middle 50% of results)
- **Possible Range**: Minimum and maximum values

**Examples:**
```
/prob 5k3 tn:25                 Check success odds (skilled)
/prob 5k3 u tn:20               Unskilled probability
/prob 7k4 m e tn:30             Mastery + emphasis
/prob 8k5+10 tn:35 r:2          With modifier and raises
/prob 12k4 tn:30                Ten Dice Rule applies
```

**How It Works:**
- Uses precomputed Monte Carlo simulations (200k-500k rolls per configuration)
- Covers all 330 combinations: 1k1 to 10k10, all modes (unskilled/skilled/mastery), with/without emphasis
- Fast lookups from static JSON tables (~200KB)
- Same explosion modes, emphasis, and raise rules as `/roll`

### `/help [command]`
Get help with bot commands.

**Examples:**
```
/help              Show all commands
/help roll         Detailed help for roll command
/help prob         Detailed help for probability command
```

**Key Features:**
- Interactive command selection
- Detailed usage examples
- All Phase 3B features included

## Project Structure

**Monorepo** with 3 TypeScript packages + 1 Rust tool:

```
packages/
├── core/                      # @butterfly-lady/core - Pure L5R logic
│   ├── src/dice/              # Roll & Keep mechanics
│   ├── src/probability/       # Probability queries & table loader
│   ├── src/types/             # Type definitions
│   └── data/probability-tables.json    # 330 precomputed tables (~200KB)
│
├── bot/                       # @butterfly-lady/bot - Discord layer
│   ├── src/commands/          # /roll, /prob, /help
│   ├── src/formatters/        # Rich Discord embeds
│   └── src/types/             # Command interfaces
│
└── backend/                   # @butterfly-lady/backend - Main entry
    └── src/index.ts           # Startup & env config

tools/probability-calculator/  # Rust Monte Carlo simulator (offline)
```

### Package Dependencies

```
backend (entry) → bot (Discord) → core (L5R logic)
                                     ↑
                       probability-tables.json (static)
```

**Key Points:**
- **core**: Platform-agnostic L5R logic (dice, probability, types) - works in Node.js & browsers
- **bot**: Discord commands (/roll, /prob, /help) + rich embeds
- **backend**: Startup, env config, signal handling
- **tools**: Offline Rust calculator generates probability tables (run once)

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

### Regenerating Probability Tables (Rare)

If you need to regenerate the probability tables (e.g., changed simulation parameters):

```bash
cd tools/probability-calculator
cargo run --release
```

This will regenerate `packages/core/data/probability-tables.json` (~200KB, takes ~30 seconds).

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

- **Language**: TypeScript (strict mode, ESNext modules)
- **Runtime**: Node.js 20+ (requires 20.10+ for JSON import attributes)
- **Framework**: Discord.js v14
- **Package Manager**: pnpm (with workspaces)
- **Architecture**: Monorepo with 3 packages
- **Containerization**: Docker & Docker Compose
- **Build Tool**: TypeScript Compiler (tsc)
- **Random Number Generation**: Seedrandom (OS-entropy based)
- **Probability Calculator**: Rust (offline tool, not in runtime)

## Architecture Benefits

The monorepo structure provides:

1. **Clean Separation** - Business logic separated from Discord integration
2. **Reusable Core** - Core L5R logic can be used in VTT, web apps, etc.
3. **Cross-Platform** - Static JSON imports work in Node.js and browsers (Vite/Webpack)
4. **Type Safety** - Shared types across all packages
5. **Independent Testing** - Test core logic without Discord mocks
6. **Future Ready** - Probability system ready for React VTT (Phase 5)

## Contributing

This bot is in active development. 

**Completed:**
- ✅ Phase 1: Basic roll system
- ✅ Phase 2: Advanced mechanics (emphasis, raises, Ten Dice Rule)
- ✅ Phase 3B: Probability & statistics with precomputed tables

**Planned:**
- Phase 3C: Character sheet management
- Phase 4: AI-generated maps and tokens
- Phase 5: VTT server with React + Pixi.js frontend

See [`VTT_ARCHITECTURE.md`](VTT_ARCHITECTURE.md) for detailed Phase 5 plans and [`STATUS.md`](STATUS.md) for current implementation status.

## Reference

Inspired by [Panku bot](https://github.com/wargamesqcf/L5R-discord-bot) for L5R mechanics and command ideas.

## License

MIT

