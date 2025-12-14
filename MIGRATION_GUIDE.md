# Migration Guide: Discord Bot → Discord Bot + VTT

This guide shows how to restructure the current codebase into a monorepo with VTT support.

## Current Structure → New Structure

### Before (Current)
```
butterfly-lady/
├── src/
│   ├── index.ts         # Discord bot only
│   ├── commands/
│   ├── utils/
│   └── types/
└── package.json
```

### After (Monorepo)
```
butterfly-lady/
├── packages/
│   ├── backend/         # Discord bot + HTTP + WebSocket
│   ├── frontend/        # React + Pixi.js
│   └── shared/          # Shared types
├── pnpm-workspace.yaml
└── package.json
```

## Step-by-Step Migration

### Step 1: Create Monorepo Structure

```bash
# In butterfly-lady/
mkdir -p packages/backend/src
mkdir -p packages/frontend/src
mkdir -p packages/shared/src

# Move existing src to backend
mv src/* packages/backend/src/

# Move existing files
mv package.json packages/backend/
mv tsconfig.json packages/backend/
mv Dockerfile packages/backend/
```

### Step 2: Create Root package.json

```json
{
  "name": "butterfly-lady-monorepo",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "pnpm --parallel --stream -r dev",
    "build": "pnpm -r build",
    "clean": "pnpm -r clean"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
```

### Step 3: Create pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
```

### Step 4: Update Backend package.json

```json
{
  "name": "@butterfly-lady/backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@butterfly-lady/shared": "workspace:*",
    "discord.js": "^14.25.1",
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "zod": "^3.22.4",
    "seedrandom": "^3.0.5",
    "dotenv": "^17.2.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/ws": "^8.5.10",
    "@types/node": "^20.11.5",
    "@types/seedrandom": "^3.0.8",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### Step 5: Create Frontend package.json

```json
{
  "name": "@butterfly-lady/frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@butterfly-lady/shared": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "pixi.js": "^7.3.2",
    "@pixi/react": "^7.1.2",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

### Step 6: Create Shared package.json

```json
{
  "name": "@butterfly-lady/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### Step 7: Restructure Backend Code

```bash
# In packages/backend/src/
mkdir bot vtt core services

# Move Discord bot code
mv commands/ bot/
mv index.ts bot/bot.ts

# Create new entry point
```

Create `packages/backend/src/index.ts`:

```typescript
import 'dotenv/config';
import { startBot } from './bot/bot.js';
import { startVTTServer } from './vtt/server.js';
import { GameStateManager } from './core/game/GameStateManager.js';

const PORT = process.env.PORT || 3000;

async function main() {
  console.log('🦋 Starting Butterfly Lady...');
  
  // Initialize game state manager
  const gameState = GameStateManager.getInstance();
  
  // Start Discord bot
  const discordClient = await startBot();
  console.log('✅ Discord bot started');
  
  // Start VTT server (HTTP + WebSocket)
  const vttServer = await startVTTServer(PORT, gameState, discordClient);
  console.log(`✅ VTT server started on port ${PORT}`);
  
  // Set up sync service
  const syncService = new SyncService(gameState, discordClient, vttServer);
  console.log('✅ Sync service initialized');
  
  console.log('🎲 Butterfly Lady is ready!');
}

main().catch(error => {
  console.error('❌ Failed to start:', error);
  process.exit(1);
});
```

### Step 8: Create VTT Server

Create `packages/backend/src/vtt/server.ts`:

```typescript
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { GameStateManager } from '../core/game/GameStateManager.js';

export async function startVTTServer(
  port: number,
  gameState: GameStateManager,
  discordClient: any
) {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Game state API
  app.get('/api/game/:id/state', (req, res) => {
    const state = gameState.getGame(req.params.id);
    res.json(state);
  });

  // Roll API
  app.post('/api/roll', async (req, res) => {
    const { expression, options } = req.body;
    // Use existing dice logic
    const result = executeRoll(expression, options);
    
    // Add to game state (triggers sync)
    gameState.addRollResult(req.body.gameId, result);
    
    res.json(result);
  });

  // WebSocket handling
  wss.on('connection', (ws) => {
    console.log('🔌 VTT client connected');

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      handleWebSocketMessage(ws, message, gameState);
    });

    ws.on('close', () => {
      console.log('🔌 VTT client disconnected');
    });
  });

  // Start server
  await new Promise<void>((resolve) => {
    server.listen(port, () => resolve());
  });

  return { app, server, wss };
}

function handleWebSocketMessage(ws: any, message: any, gameState: GameStateManager) {
  switch (message.type) {
    case 'ROLL':
      // Handle roll from VTT
      break;
    case 'TOKEN_MOVE':
      // Handle token movement
      break;
    // ... more handlers
  }
}
```

### Step 9: Create GameStateManager

Create `packages/backend/src/core/game/GameStateManager.ts`:

```typescript
import { EventEmitter } from 'events';

export interface GameState {
  id: string;
  name: string;
  tokens: Map<string, Token>;
  rolls: RollResult[];
  characters: Character[];
  combat?: CombatState;
}

export class GameStateManager extends EventEmitter {
  private static instance: GameStateManager;
  private games: Map<string, GameState> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  createGame(gameId: string, name: string): GameState {
    const game: GameState = {
      id: gameId,
      name,
      tokens: new Map(),
      rolls: [],
      characters: []
    };
    this.games.set(gameId, game);
    return game;
  }

  addRollResult(gameId: string, roll: RollResult): void {
    const game = this.games.get(gameId);
    if (!game) return;

    game.rolls.push(roll);
    
    // Emit event for sync service
    this.emit('roll', { gameId, roll });
  }

  updateTokenPosition(gameId: string, tokenId: string, position: Position): void {
    const game = this.games.get(gameId);
    if (!game) return;

    const token = game.tokens.get(tokenId);
    if (token) {
      token.position = position;
      this.emit('tokenMove', { gameId, tokenId, position });
    }
  }
}
```

### Step 10: Create Shared Types

Create `packages/shared/src/types/websocket.ts`:

```typescript
import { RollResult } from './dice.js';

export type WSMessage =
  | { type: 'ROLL'; data: RollResult }
  | { type: 'TOKEN_MOVE'; data: TokenMoveData }
  | { type: 'CHAT_MESSAGE'; data: ChatMessageData }
  | { type: 'GAME_STATE'; data: GameState }
  | { type: 'COMBAT_UPDATE'; data: CombatState };

export interface TokenMoveData {
  tokenId: string;
  position: { x: number; y: number };
}

export interface ChatMessageData {
  user: string;
  message: string;
  timestamp: number;
}
```

Create `packages/shared/src/index.ts`:

```typescript
// Export all shared types
export * from './types/dice.js';
export * from './types/websocket.js';
export * from './types/game.js';
export * from './types/character.js';
```

### Step 11: Install Dependencies

```bash
# From root
pnpm install

# This will install dependencies for all packages
```

### Step 12: Update .gitignore

```gitignore
# Add to existing .gitignore
packages/*/dist
packages/*/node_modules
```

### Step 13: Test Migration

```bash
# Terminal 1: Start backend
cd packages/backend
pnpm dev

# Should start both Discord bot and HTTP server

# Terminal 2: Start frontend (once created)
cd packages/frontend
pnpm dev
```

## Verification Checklist

- [ ] Discord bot still works (test `/roll` command)
- [ ] HTTP API responds (`curl http://localhost:3000/api/health`)
- [ ] No import errors in backend
- [ ] Shared types are accessible in backend
- [ ] Frontend can be created and runs

## Next Steps After Migration

1. **Create React Frontend**:
   - Set up Vite + React
   - Add Pixi.js canvas
   - Create WebSocket connection

2. **Implement Sync Service**:
   - Listen to GameStateManager events
   - Post to Discord when VTT rolls
   - Broadcast to VTT when Discord rolls

3. **Add VTT Features**:
   - Map rendering
   - Token management
   - Dice roller UI

## Rollback Plan

If migration fails, revert with:

```bash
git checkout main
git reset --hard HEAD
```

The old structure is still in Git history.

---

This migration preserves all existing Discord bot functionality while adding VTT capabilities!
