# Migration Verification Checklist

## ✅ Automated Verification (Completed)

- [x] Workspace structure created correctly
- [x] All three packages (core, bot, backend) created
- [x] Dependencies installed successfully
- [x] All packages build without errors
- [x] TypeScript compiles successfully
- [x] Workspace references resolve correctly
- [x] Docker files updated for new structure

## 📋 Manual Verification Required

### 1. Bot Startup Test

Run the bot in development mode:

```bash
pnpm run dev
```

**Expected output:**
- ✅ "🦋 Starting Butterfly Lady..."
- ✅ "🎲 Production: OS-entropy seed initialized"
- ✅ "✅ Butterfly Lady is online!"
- ✅ "📝 Logged in as [bot name]"
- ✅ "🎲 Loaded 2 commands"
- ✅ "✅ Slash commands registered successfully"
- ✅ "🎭 Bot presence set"

### 2. Command Functionality Tests

Test each command variant in Discord:

#### Basic Roll Tests
- [ ] `/roll 5k3` - Basic skilled roll (10s explode)
- [ ] `/help` - Shows general help embed

#### Explosion Mode Tests
- [ ] `/roll 5k3 u` - Unskilled (no explosions)
- [ ] `/roll 7k4 m` - Mastery (9s and 10s explode)

#### Modifier Tests
- [ ] `/roll 7k4+10` - Positive modifier
- [ ] `/roll 7k4-5` - Negative modifier

#### Target Number Tests
- [ ] `/roll 5k3 tn:15` - Target number check
- [ ] `/roll 7k4+10 tn:20` - TN with modifier

#### Raises Tests
- [ ] `/roll 8k5 tn:25 r:2` - Called raises (TN becomes 30)
- [ ] `/roll 7k4 tn:15 r:1` - Single called raise

#### Emphasis Tests
- [ ] `/roll 6k3 e` - Emphasis (reroll 1s, e defaults to e:1)
- [ ] `/roll 6k3 e:2` - Emphasis (reroll dice ≤2)

#### Combined Tests
- [ ] `/roll 8k5 m e:2 tn:25 r:1` - Everything combined
- [ ] `/roll 12k5+10 m tn:30` - Ten Dice Rule auto-applies (becomes 10k6+10)

#### Error Handling Tests
- [ ] `/roll abc` - Invalid expression
- [ ] `/roll 5k10` - Keep more than rolled
- [ ] `/roll -1k3` - Negative dice

#### Help Command Tests
- [ ] `/help roll` - Detailed help for roll command
- [ ] `/help help` - Help for help command

### 3. Docker Tests

#### Development Docker
```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Expected:**
- ✅ Build completes successfully
- ✅ Bot starts and connects
- ✅ Hot-reload works when editing source files

#### Production Docker
```bash
docker-compose up --build
```

**Expected:**
- ✅ Build completes successfully
- ✅ Bot starts and connects
- ✅ Production optimizations applied

### 4. Graceful Shutdown Test

While bot is running:
- Press `Ctrl+C` (SIGINT)

**Expected:**
- ✅ "📴 Received SIGINT, shutting down gracefully..."
- ✅ "👻 Set status to invisible"
- ✅ Optional: "📢 Shutdown notification sent" (if STATUS_CHANNEL_ID is set)
- ✅ "✅ Bot shutdown complete"

## 📊 Structure Verification

### Package Structure

```
packages/
├── core/                       ✅ Created
│   ├── src/
│   │   ├── dice/              ✅ Business logic
│   │   │   ├── dice.ts
│   │   │   ├── parser.ts
│   │   │   └── index.ts
│   │   ├── types/             ✅ Type definitions
│   │   │   ├── dice.ts
│   │   │   └── index.ts
│   │   └── index.ts           ✅ Main exports
│   ├── package.json           ✅ No Discord deps
│   └── tsconfig.json
│
├── bot/                        ✅ Created
│   ├── src/
│   │   ├── commands/          ✅ Discord commands
│   │   │   ├── roll.ts
│   │   │   ├── help.ts
│   │   │   └── index.ts
│   │   ├── formatters/        ✅ Discord embeds
│   │   │   ├── rollEmbed.ts
│   │   │   └── index.ts
│   │   ├── types/             ✅ Discord types
│   │   │   ├── commands.ts
│   │   │   └── index.ts
│   │   └── index.ts           ✅ Bot initialization
│   ├── package.json           ✅ Depends on @butterfly-lady/core
│   └── tsconfig.json
│
└── backend/                    ✅ Created
    ├── src/
    │   └── index.ts            ✅ Main entry point
    ├── package.json            ✅ Depends on @butterfly-lady/bot
    └── tsconfig.json
```

### Dependency Graph

```
backend
  └─> bot
       └─> core
```

✅ No circular dependencies
✅ Clean separation of concerns
✅ Core has no external dependencies (except seedrandom)

## 🔍 Code Quality Checks

### Import Paths
- [x] All imports use workspace packages (`@butterfly-lady/*`)
- [x] No `.js` extensions in workspace imports
- [x] All relative imports within packages use `.js` extensions

### TypeScript
- [x] All packages compile without errors
- [x] Type declarations generated correctly
- [x] No `any` types introduced

### Functionality
- [x] No logic changes - pure restructuring
- [x] All existing features preserved

## 🎯 Success Criteria

All of the following must be true:

1. ✅ `pnpm install` works without errors
2. ✅ `pnpm run build` compiles all packages
3. ⏳ `pnpm run dev` starts the bot successfully (manual test)
4. ⏳ All `/roll` command variants work identically to before (manual test)
5. ⏳ `/help` command works correctly (manual test)
6. ⏳ Graceful shutdown works (manual test)
7. ⏳ Docker builds and runs successfully (manual test)

## 📝 Notes

- Original `src/` directory still exists for rollback if needed
- Can be safely removed after all manual tests pass
- No changes to bot behavior - only code organization changed
- All environment variables remain the same (`.env` file unchanged)

## 🔄 Rollback Plan

If any issues are found:

1. Stop the bot
2. Delete `packages/` directory
3. Restore root `tsconfig.json`
4. Revert `package.json` and `pnpm-workspace.yaml`
5. Run `pnpm install`
6. Run `pnpm run dev` (uses old `src/` directory)

The original code in `src/` directory is preserved until all verification passes.
