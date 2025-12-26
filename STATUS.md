# 🦋 Butterfly Lady - Current Status

## ✅ Implementation Complete

**Phase 1:** ✅ Complete (Basic Roll & Keep)  
**Phase 2:** ✅ Complete (Advanced L5R Mechanics)  
**Phase 3A:** ✅ Complete (Monorepo Restructure)  
**Phase 3B (Step 1):** ✅ Complete (Rust Probability Calculator)

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
/roll 5k3 tn:15          # Roll vs TN 15
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

# Raises
/roll 8k5 tn:20 r:2  # Should show called raises

# Combined
/roll 8k5 m e:2 tn:25 r:2
# Should show everything

# Footer display
/roll 5k3 m e        # Should show both mastery and emphasis in footer
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
- 🚧 **Phase 3B**: Statistics & probability (Step 1/2 complete)
  - ✅ Step 1: Rust probability calculator (generates lookup tables)
  - ⏳ Step 2: `/prop` command (query precomputed probabilities)

### Architecture Ready For:
- **Phase 3C**: Character management
- **Phase 4**: Image generation (AI maps/tokens)
- **Phase 5**: VTT Server (can add `packages/vtt-server` and `packages/frontend`)

## 🎯 Next Steps

### Phase 3B Step 1: Generate Probability Tables

Run the Rust calculator to generate probability lookup tables:

```bash
cd tools/probability-calculator
cargo run --release
```

This will generate `packages/core/data/probability-tables.json` containing:
- 330 roll configurations (55 pools × 3 explosion modes × 2 emphasis states)
- Cumulative probabilities: P(total ≥ TN) for each configuration
- Statistics: mean, stddev, median, percentiles
- Expected runtime: 2-5 minutes (100M+ simulations)

### Phase 3B Step 2: Implement `/prop` Command

Next step: Create Discord command to query precomputed probabilities:
- `/prop 5k3 tn:25` → show P(success), mean, percentiles
- `/prop 7k4 m e tn:30` → support all explosion modes and emphasis
- Fast O(1) lookups from generated tables

### Other Next Steps

1. **Continue bot development**: Test commands in Discord
2. **Phase 3C**: Character management
3. **Phase 4**: Image generation
4. **Phase 5**: See [`VTT_ARCHITECTURE.md`](VTT_ARCHITECTURE.md) for VTT server plans

---

**The Butterfly Lady serves the Emperor!** 🦋⚔️




