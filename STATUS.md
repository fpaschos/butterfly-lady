# 🦋 Butterfly Lady - Current Status

## ✅ Implementation Complete

**Phase 1:** ✅ Complete (Basic Roll & Keep)  
**Phase 2:** ✅ Complete (Advanced L5R Mechanics)  
**Phase 3A:** ✅ Complete (Monorepo Restructure)  
**Phase 3B:** ✅ Complete (Statistics & Probability)

## 🎯 What Works

All core functionality is implemented and working:

### Explosion Modes
- ✅ Skilled (default): 10s explode
- ✅ Unskilled (u): No explosions
- ✅ Mastery (m): 9s and 10s explode

### Advanced Mechanics
- ✅ Ten Dice Rule (automatic conversion)
- ✅ Target Numbers (tn:N)
- ✅ Raises (r:N with auto-calculation)
- ✅ Emphasis (e defaults to e:1, or e:N)
- ✅ Detailed output (always on)
- ✅ Probability statistics (inline with /roll when TN exists)

### Probability Analysis (Phase 3B)
- ✅ `/prob` command for detailed probability analysis
- ✅ Success rate calculation vs Target Number
- ✅ Statistical information (mean, stddev, median, percentiles)
- ✅ Interactive "Roll This!" button (execute roll from probability view)
- ✅ Inline probability stats in `/roll` output (when TN exists)
- ✅ Support for all explosion modes and emphasis

### Architecture & Technical
- ✅ Monorepo structure (3 packages: core, bot, backend)
- ✅ Clean separation: business logic, Discord integration, orchestration
- ✅ Workspace dependencies with pnpm
- ✅ Seedrandom with OS entropy
- ✅ TypeScript strict mode across all packages
- ✅ Full type safety in core logic
- ✅ Error handling
- ✅ Docker support (dev & prod)
- ✅ Rust probability calculator (Phase 3B Step 1)

## 📝 Example Commands

```bash
# Basic
/roll 5k3                # Skilled, 10s explode
/roll 5k3 u              # Unskilled, no explosions
/roll 7k4 m              # Mastery, 9s and 10s explode

# Target Numbers
/roll 5k3 tn:15          # Roll vs TN 15 (shows probability stats)
/roll 7k4+10 tn:20       # With modifier

# Raises
/roll 8k5 tn:25 r:2      # 2 raises (TN becomes 30)

# Emphasis
/roll 6k3 e              # Reroll 1s (e:1)
/roll 6k3 e:2            # Reroll ≤2
/roll 6k3 e:3            # Reroll ≤3

# Combined
/roll 8k5 m e:2 tn:25 r:2
# Mastery + Emphasis + TN + Raises

# Ten Dice Rule
/roll 12k5 m tn:30       # Auto-converts to 10k6

# Probability Analysis
/prob 5k3 tn:25          # Show probability statistics
/prob 7k4 m e tn:30      # With explosion modes and emphasis
# Click "🎲 Roll This!" button to execute the roll
```

## 📦 Project Structure

```
packages/
├── core/          # @butterfly-lady/core - Pure L5R logic
├── bot/           # @butterfly-lady/bot - Discord integration
└── backend/       # @butterfly-lady/backend - Main entry point

tools/
└── probability-calculator/  # Rust tool for generating probability tables
```

**Dependency chain:** backend → bot → core (no circular deps)

## 🚀 How to Run

### Development Mode (Recommended)
```bash
# Install workspace dependencies
pnpm install

# Run in development mode (hot-reload)
pnpm run dev
```

### Production Build
```bash
# Build all packages
pnpm run build

# Start the bot
pnpm start
```

### Docker
```bash
# Production
docker-compose up --build

# Development (with hot-reload)
docker-compose -f docker-compose.dev.yml up --build
```

## 🧪 Testing

Test these commands to verify everything works:

```bash
# Basic explosions
/roll 5k3            # Should work
/roll 5k3 u          # No explosions
/roll 7k4 m          # 9s and 10s explode

# Emphasis defaults
/roll 6k3 e          # Should reroll 1s
/roll 6k3 e:2        # Should reroll ≤2

# Ten Dice Rule
/roll 12k4           # Should convert to 10k5
/roll 14k12          # Should convert to 10k10+12

# Target Numbers
/roll 5k3 tn:15      # Should show success/failure
/roll 5k3 tn:25      # Should show probability stats in footer

# Raises
/roll 8k5 tn:20 r:2  # Should show called raises

# Combined
/roll 8k5 m e:2 tn:25 r:2
# Should show everything including probability stats

# Footer display
/roll 5k3 m e        # Should show both mastery and emphasis in footer

# Probability commands
/prob 5k3 tn:25      # Should show probability analysis
/prob 7k4 m e tn:30  # Should include "Roll This!" button
# Click button to execute the roll
```

## 📊 Code Quality

| Metric | Status |
|--------|--------|
| Core Logic | ✅ No errors |
| Type Safety | ✅ Strict mode all packages |
| Monorepo Structure | ✅ Clean separation |
| Error Handling | ✅ Comprehensive |
| Documentation | ✅ Complete |
| Tests | ⏳ Manual testing |

## ✨ Summary

**The bot is fully functional and ready to use!**

### Completed Phases:
- ✅ **Phase 1**: Basic Roll & Keep dice system
- ✅ **Phase 2**: Advanced L5R 4th Edition mechanics (explosions, TNs, raises, emphasis)
- ✅ **Phase 3A**: Monorepo restructure (clean architecture for VTT integration)
- ✅ **Phase 3B**: Statistics & probability
  - ✅ Step 1: Rust probability calculator (generates lookup tables)
  - ✅ Step 2: `/prob` command (query precomputed probabilities)
  - ✅ Interactive features (button to roll from probability view)
  - ✅ Inline probability stats in `/roll` output

### Architecture Ready For:
- **Phase 3C**: Character management
- **Phase 4**: Image generation (AI maps/tokens)
- **Phase 5**: VTT Server (can add `packages/vtt-server` and `packages/frontend`)

## 🎯 Next Steps

### Phase 3C: Character Management

Next major phase: Character sheet storage and management:
- Character creation and editing
- Character sheet storage (SQLite/JSON)
- Roll with character stats (e.g., `/roll character:samurai skill:kenjutsu`)
- Character-based emphasis (automatic from school/skill)
- Discord commands for character management

### Phase 4: Image Generation

AI-generated content integration:
- Battle map generation
- Token/character portrait generation
- Integration with future VTT
- Discord commands for generation requests

### Phase 5: VTT Server

Full Virtual Tabletop integration:
- See [`VTT_ARCHITECTURE.md`](VTT_ARCHITECTURE.md) for architecture details
- GameStateManager for state management
- WebSocket server for real-time updates
- React + Pixi.js frontend
- Bidirectional Discord ↔ VTT synchronization

---

**The Butterfly Lady serves the Emperor!** 🦋⚔️




