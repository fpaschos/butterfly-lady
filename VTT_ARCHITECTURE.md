# 🦋 Butterfly Lady VTT + Discord Bot Architecture

> **Document Version**: 2.0 - Corrected deployment guidance (Dec 2024)
> 
> **Key Corrections from v1.0**:
> - ✅ Clarified temporary vs named Cloudflare Tunnels
> - ✅ Domain requirement for production use ($1-3/year)
> - ✅ Fixed Docker networking (no exposed ports with tunnel)
> - ✅ Corrected WebSocket URLs (wss:// for browsers)
> - ✅ Added Cloudflare Access as auth option
> - ✅ cloudflared in Docker recommended
> - ✅ DEV vs PROD clarification

## Overview

Unified Node.js/TypeScript backend serving both:
1. **Discord Bot** (Discord.js) - Slash commands for rolling, character management
2. **VTT Server** (Express + WebSocket) - React/Pixi.js frontend with real-time sync

## Deployment: Local & Free 💰

This system runs **on your PC** with Docker. Players access VTT via links in Discord.

### Quick Deployment Options

| Option | Cost | Setup | Remote Access | Security | Best For |
|--------|------|-------|---------------|----------|----------|
| **LAN Only** | $0 | 5 min | ❌ Local only | ⭐⭐⭐⭐⭐ | In-person games |
| **Cloudflare Tunnel** ⭐ | **$1-3/year** | 20 min | ✅ Worldwide | ⭐⭐⭐⭐⭐ | Remote players |
| Port Forward | $0 | 30 min | ✅ Yes | ⭐⭐ | Not recommended |

**Recommended**: **Cloudflare Tunnel** with cheap domain (~$0.25/month), HTTPS included, no port forwarding!

**Two ways to use Cloudflare Tunnel**:

1. **Testing/Demo** (Free, temporary URL):
   ```bash
   # Quick test - URL changes each time
   cloudflared tunnel --url http://localhost:3000
   # Get: https://random-name.trycloudflare.com
   ```
   ⚠️ **Not for regular gaming** - URL is random and temporary

2. **Production** ($1-3/year domain):
   ```bash
   # Setup once with your domain
   cloudflared tunnel create butterfly-lady
   # Get: https://vtt.yourdomain.xyz (stable, permanent)
   ```
   ✅ **For regular gaming** - Stable URL, players can bookmark

**Total Cost**: 
- Testing: **$0**
- Regular gaming: **$1-3/year** (~$0.25/month for domain)

→ Full deployment guide in [Local Hosting Options](#local-hosting-options-self-hosted-on-your-pc) section below.

## Key Questions Answered

### Q: What is the primary server?
**A: The Node.js Backend is the primary server.**
- It starts first (boots both Discord Bot and VTT Server)
- It holds all game state (GameStateManager)
- It executes all game logic (dice rolling, validation, etc.)
- Discord Bot and VTT Server are both "adapters" to the core logic

**Important**: "Primary" means **logic authority**, not a monolith:
- Core game logic is in shared services
- Discord Bot and VTT Server are **equal-citizen adapters**
- They both call the same core services
- Neither is subordinate to the other
- This architecture supports future scaling (e.g., mobile app adapter)

### Q: Does it have bidirectional communication?
**A: YES, fully bidirectional on both sides:**

**Discord ↔ Backend:**
- Discord → Backend: User sends slash commands
- Backend → Discord: Bot posts messages/embeds

**VTT ↔ Backend:**
- VTT → Backend: WebSocket messages (roll dice, move token, etc.)
- Backend → VTT: WebSocket broadcasts (state updates, events)

### Q: Is it just sending events to VTT?
**A: No, it's bidirectional events + HTTP:**

**HTTP (Request/Response):**
- Used for initial data: `GET /api/game/:id/state`
- VTT loads → fetches current state → renders UI
- One-time requests (fetch characters, upload map, etc.)

**WebSocket (Bidirectional Events):**
- VTT sends events: `{ type: 'ROLL', data: {...} }`
- Backend processes and broadcasts to ALL clients
- Real-time: rolls, token moves, chat messages

**Event-Driven (Backend Internal):**
- GameStateManager emits events on state changes
- Discord Bot and VTT Server both listen to these events
- Changes in one place automatically sync everywhere

### Q: How do React and Pixi.js interact in VTT?
**A: They work together in one React app:**

**React (UI Layer):**
- HTML/CSS elements: sidebar, chat, forms, buttons
- Handles user input, routing, modals

**Pixi.js (Game Layer):**
- WebGL canvas: map, tokens, grid, fog of war
- Rendered inside React component `<PixiMap />`
- High-performance graphics (1000+ sprites at 60fps)

**Both share Zustand store** (state management)
- WebSocket updates store → React + Pixi both re-render

### Visual Summary: The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                        THE BIG PICTURE                      │
└─────────────────────────────────────────────────────────────┘

Discord Users                              VTT Users
    (Chat)                                 (Browser)
      │                                        │
      │ /roll 5k3                             │ Click "Roll"
      ▼                                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    NODE.JS BACKEND                          │
│                  (PRIMARY SERVER)                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         GameStateManager (Event Hub)                │  │
│  │         • Holds all game state                       │  │
│  │         • Emits events on changes                    │  │
│  └────────────┬──────────────────────┬──────────────────┘  │
│               │                      │                     │
│     ┌─────────▼────────┐   ┌────────▼──────────┐          │
│     │  Discord Bot     │   │   VTT Server      │          │
│     │  (Discord.js)    │   │  (Express + WS)   │          │
│     └─────────┬────────┘   └────────┬──────────┘          │
│               │                      │                     │
│     ┌─────────▼──────────────────────▼──────────┐          │
│     │         Core Services                     │          │
│     │  • DiceService (your existing logic)      │          │
│     │  • CharacterService                       │          │
│     │  • CombatService                          │          │
│     └───────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
      │                                        │
      │ Posts to Discord                      │ WebSocket broadcast
      ▼                                        ▼
Discord Channel                         VTT Browsers
  (Everyone sees roll)                   ┌──────────────┐
                                        │  React App   │
                                        │  + Pixi.js   │
                                        │              │
                                        │ • UI (React) │
                                        │ • Map (Pixi) │
                                        └──────────────┘
                                         (Everyone sees roll)

SYNC: Roll in Discord → appears in VTT
      Roll in VTT → appears in Discord
      Everything synced in real-time!
```

## Startup Sequence

### How the System Boots Up

```
1. Node.js Backend Starts (PRIMARY)
   ├─> Loads environment variables
   ├─> Creates GameStateManager singleton
   │   └─> In-memory game state initialized
   │
   ├─> 2. Starts Discord Bot
   │   ├─> Discord.js connects to Discord Gateway
   │   ├─> Registers slash commands
   │   ├─> Sets up event listeners on GameStateManager
   │   └─> Bot goes online (green dot in Discord)
   │
   └─> 3. Starts VTT Server
       ├─> Express HTTP server starts (port 3000)
       ├─> WebSocket server attached to HTTP server
       ├─> Sets up WebSocket event listeners on GameStateManager
       ├─> Serves static files (React app)
       └─> Ready to accept connections
       
4. VTT Client Connects (when user opens browser)
   ├─> Browser requests http://vtt.example.com
   ├─> Backend serves index.html (React app)
   ├─> React app loads in browser
   ├─> HTTP: Fetches initial game state
   ├─> WebSocket: Establishes real-time connection
   └─> React + Pixi.js render UI

RESULT: 
- Discord Bot is always running (24/7)
- VTT Server is always running (24/7)
- VTT Clients connect on-demand (when users open browser)
```

### Crash Scenarios

**If Discord Bot crashes:**
- VTT continues working
- Users can still use VTT
- Rolls in VTT won't appear in Discord until bot restarts
- GameStateManager still tracks everything

**If VTT Server crashes:**
- Discord Bot continues working
- Users can still use Discord commands
- VTT clients disconnect (browser shows "Reconnecting...")
- Rolls in Discord won't appear in VTT until server restarts

**If whole backend crashes:**
- Both Discord and VTT stop
- Game state is lost (in-memory, not persisted)
- On restart: Fresh state, users must rejoin

**Future (Phase 5 - Database):**
- Game state persisted to database
- On restart: State restored from DB
- No data loss

## Deep Integration Features

### ✅ Implemented (Phase 1 & 2)
- L5R 4th Edition dice rolling
- Roll & Keep system
- Explosion modes (skilled/unskilled/mastery)
- Advanced mechanics (emphasis, raises, target numbers)

### 🎯 New VTT Features (Phase 3)

#### Real-Time Synchronization
- **Discord → VTT**: Rolls made in Discord appear in VTT chat/map
- **VTT → Discord**: Rolls made in VTT posted to Discord channel
- **Character Sheets**: Create once, use everywhere
- **Combat Tracker**: Shared initiative, HP, status effects
- **Map State**: Token positions synced

#### VTT-Specific Features
- **2D Map Rendering** (Pixi.js canvas)
- **Token Management** (drag & drop characters)
- **Fog of War** (GM-controlled visibility)
- **Dice Animation** (3D dice rolling on map)
- **Measurement Tools** (distance, area of effect)
- **Chat Integration** (Discord messages in VTT)

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              CLIENTS                                         │
├─────────────────────────────────────────────────────────────┤
│  Discord                           Browser (React + Pixi)   │
│  • Slash commands                  • Interactive map        │
│  • Bot responses                   • Drag & drop tokens     │
│  • Rich embeds                     • Dice roller UI         │
└──────────┬──────────────────────────────────┬───────────────┘
           │                                  │
           │ Discord Gateway                  │ WebSocket + HTTP
           │ (Bidirectional)                  │ (Bidirectional)
           │                                  │
┌──────────▼──────────────────────────────────▼───────────────┐
│              BACKEND (Node.js + TypeScript)                 │
│                    PRIMARY SERVER                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            GameStateManager (Singleton)                │ │
│  │         SINGLE SOURCE OF TRUTH                         │ │
│  │  • In-memory game state (all games)                    │ │
│  │  • Event emitter (emits on every state change)         │ │
│  │  • No direct client communication                      │ │
│  └────────────────────────────────────────────────────────┘ │
│         │                            │                       │
│         │ Emits events               │ Emits events          │
│         ▼                            ▼                       │
│  ┌──────────────────┐        ┌────────────────────┐         │
│  │  Discord Bot     │        │   VTT Server       │         │
│  │  (Discord.js)    │        │   (Express + WS)   │         │
│  │                  │        │                    │         │
│  │  • Commands ─────┼───────►│  • HTTP API        │         │
│  │  • Events        │  Calls │  • WebSocket       │         │
│  │  • Embeds        │  Core  │  • Static files    │         │
│  └──────────────────┘        └────────────────────┘         │
│         │                            │                       │
│  ┌──────▼────────────────────────────▼────────────┐         │
│  │           Shared Core Logic                    │         │
│  │        (Called by BOTH Bot and VTT)            │         │
│  │  • DiceService (existing)                      │         │
│  │  • CharacterService                            │         │
│  │  • CombatService                               │         │
│  │  • MapService                                  │         │
│  │                                                 │         │
│  │  All services call GameStateManager            │         │
│  │  GameStateManager emits events                 │         │
│  └─────────────────────────────────────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Communication Patterns

### Primary Entry Point: Backend Server

The **Backend (Node.js)** is the primary/main server that:
1. ✅ **Boots first** - Starts both Discord Bot and VTT Server
2. ✅ **Holds all state** - GameStateManager is the single source of truth
3. ✅ **Executes all logic** - Dice rolling, game rules, validation
4. ✅ **Coordinates sync** - Events from GameStateManager trigger notifications

### Bidirectional Communication: YES

Both Discord and VTT have **full bidirectional** communication with the backend:

#### Discord Bot ↔ Backend
- **Discord → Backend**: Slash commands (e.g., `/roll 5k3`)
- **Backend → Discord**: Bot posts messages, embeds, updates

#### VTT (Browser) ↔ Backend
- **VTT → Backend**: WebSocket messages (e.g., roll dice, move token)
- **Backend → VTT**: WebSocket broadcasts (state updates, events)

### Communication Protocols

#### 1. HTTP (VTT → Backend)
**Purpose**: Initial data fetching, one-time requests  
**Direction**: VTT → Backend (Request/Response)  
**Used for**:
- Initial page load: `GET /api/game/:id/state`
- Fetch character list: `GET /api/characters`
- Upload map: `POST /api/maps`

**Example Flow**:
```
VTT loads page
    ↓
GET /api/game/my-game/state
    ↓
Backend responds with full game state
    ↓
VTT renders initial map, tokens, chat history
```

#### 2. WebSocket (VTT ↔ Backend)
**Purpose**: Real-time bidirectional communication  
**Direction**: Bidirectional (Client ↔ Server)  
**Used for**:
- Dice rolls (VTT → Backend, Backend → All VTT clients)
- Token movement (VTT → Backend, Backend → All VTT clients)
- Chat messages (VTT → Backend, Backend → All VTT clients)
- State updates (Backend → VTT clients)

**Example Flow**:
```
Player moves token in VTT
    ↓
VTT sends: { type: 'TOKEN_MOVE', tokenId: 'abc', position: {x: 5, y: 3} }
    ↓
Backend receives, validates
    ↓
GameStateManager.updateTokenPosition()
    ↓
GameStateManager emits 'tokenMove' event
    ↓
Backend broadcasts to ALL VTT clients (including sender)
    ↓
All VTT clients update token position on map
```

#### 3. Discord Gateway (Discord Bot ↔ Discord API)
**Purpose**: Discord's own protocol  
**Direction**: Bidirectional  
**Managed by**: Discord.js library  
**Used for**:
- Receiving slash commands
- Sending messages/embeds
- User/guild events

### Complete Data Flow Summary

```
┌───────────────────────────────────────────────────────────────┐
│                    COMPLETE SYSTEM FLOW                       │
└───────────────────────────────────────────────────────────────┘

USER ACTION (Discord or VTT)
        │
        ├──────────── Discord: /roll 5k3
        │             VTT: Click "Roll" button
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND RECEIVES REQUEST                                   │
│  • Discord Bot: interaction event                           │
│  • VTT Server: WebSocket message                            │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  CORE SERVICE EXECUTES LOGIC                                │
│  • DiceService.roll() (your existing logic)                 │
│  • Validates input                                          │
│  • Executes roll (explosion, emphasis, etc.)                │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  GAMESTATE MANAGER UPDATES STATE                            │
│  • gameState.addRollResult(gameId, rollResult)              │
│  • Updates in-memory game state                             │
│  • Emits event: 'roll'                                      │
└─────────────────────────────────────────────────────────────┘
        │
        ├─────────────────────┬─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  DISCORD    │      │ VTT SERVER  │      │ SYNC SERVICE│
│  BOT        │      │ WEBSOCKET   │      │ (Optional)  │
│             │      │             │      │             │
│ Listens to  │      │ Listens to  │      │ Coordinates │
│ 'roll'      │      │ 'roll'      │      │ complex     │
│ event       │      │ event       │      │ syncing     │
└─────────────┘      └─────────────┘      └─────────────┘
        │                     │
        │                     │
        ▼                     ▼
┌─────────────┐      ┌─────────────┐
│  Discord    │      │ VTT Clients │
│  Channel    │      │ (Browsers)  │
│             │      │             │
│ Posts embed │      │ • Update    │
│ with roll   │      │   Zustand   │
│ results     │      │ • React     │
│             │      │   re-render │
│             │      │ • Pixi.js   │
│             │      │   animate   │
└─────────────┘      └─────────────┘

RESULT: All users see the roll, regardless of where it originated
```

### Communication Pattern Comparison

| Aspect | Discord Bot | VTT Server |
|--------|-------------|------------|
| **Protocol** | Discord Gateway | HTTP + WebSocket |
| **Library** | Discord.js | Express + ws |
| **Direction** | Bidirectional | Bidirectional |
| **Entry Point** | Slash commands | WebSocket messages |
| **Output** | Discord channel posts | WebSocket broadcasts |
| **Share Logic?** | ✅ Yes (calls same services) | ✅ Yes (calls same services) |
| **Know about each other?** | ❌ No (decoupled via events) | ❌ No (decoupled via events) |

### Important: Both are Equal Citizens

```
Discord Bot                    VTT Server
     │                              │
     │                              │
     ├──────────┬───────────────────┤
                │
                ▼
         Core Services
         (DiceService,
          CharacterService,
          CombatService)
                │
                ▼
         GameStateManager
         (Single source of truth)
```

Neither Discord nor VTT is "primary" from a logic perspective:
- Both call the same core services
- Both listen to the same events
- Both are synchronized through GameStateManager
- **Backend is the primary server** that coordinates both

## Project Structure (Monorepo)

```
butterfly-lady/
├── packages/
│   ├── backend/                    # Node.js server
│   │   ├── src/
│   │   │   ├── index.ts           # Entry point (boots both)
│   │   │   │
│   │   │   ├── bot/               # Discord bot
│   │   │   │   ├── index.ts       # Bot initialization
│   │   │   │   ├── commands/
│   │   │   │   │   ├── roll.ts    # Existing
│   │   │   │   │   ├── character.ts  # NEW: Character commands
│   │   │   │   │   ├── combat.ts     # NEW: Combat commands
│   │   │   │   │   └── map.ts        # NEW: Map status commands
│   │   │   │   └── events/
│   │   │   │       └── message.ts    # Sync messages to VTT
│   │   │   │
│   │   │   ├── vtt/               # VTT server
│   │   │   │   ├── server.ts      # Express + HTTP
│   │   │   │   ├── websocket.ts   # WebSocket server
│   │   │   │   ├── routes/
│   │   │   │   │   ├── game.ts    # GET /api/game/state
│   │   │   │   │   ├── roll.ts    # POST /api/roll
│   │   │   │   │   └── character.ts  # Character CRUD
│   │   │   │   └── handlers/      # WebSocket message handlers
│   │   │   │       ├── roll.ts
│   │   │   │       ├── token.ts   # Token movement
│   │   │   │       └── sync.ts
│   │   │   │
│   │   │   ├── core/              # Shared business logic
│   │   │   │   ├── dice/          # Existing dice logic
│   │   │   │   │   ├── dice.ts
│   │   │   │   │   ├── parser.ts
│   │   │   │   │   └── formatter.ts
│   │   │   │   ├── game/
│   │   │   │   │   └── GameStateManager.ts  # Singleton
│   │   │   │   ├── characters/
│   │   │   │   │   └── CharacterService.ts
│   │   │   │   ├── combat/
│   │   │   │   │   └── CombatService.ts
│   │   │   │   └── map/
│   │   │   │       └── MapService.ts
│   │   │   │
│   │   │   ├── services/          # Cross-cutting concerns
│   │   │   │   ├── SyncService.ts    # Discord ↔ VTT sync
│   │   │   │   └── ValidationService.ts
│   │   │   │
│   │   │   ├── types/             # Existing types
│   │   │   └── utils/             # Existing utils
│   │   │
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── frontend/                  # React + Pixi.js VTT
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── Map/           # Pixi.js components
│   │   │   │   │   ├── PixiMap.tsx      # Main canvas
│   │   │   │   │   ├── Token.tsx        # Character token
│   │   │   │   │   ├── Grid.tsx         # Grid overlay
│   │   │   │   │   └── FogOfWar.tsx     # Fog system
│   │   │   │   │
│   │   │   │   ├── UI/            # React UI overlays
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Toolbar.tsx
│   │   │   │   │   └── ChatPanel.tsx    # Discord sync
│   │   │   │   │
│   │   │   │   ├── Dice/
│   │   │   │   │   ├── DiceRoller.tsx   # UI for rolling
│   │   │   │   │   └── DiceAnimation.tsx # 3D dice
│   │   │   │   │
│   │   │   │   ├── Character/
│   │   │   │   │   ├── CharacterSheet.tsx
│   │   │   │   │   ├── CharacterList.tsx
│   │   │   │   │   └── QuickStats.tsx
│   │   │   │   │
│   │   │   │   └── Combat/
│   │   │   │       ├── InitiativeTracker.tsx
│   │   │   │       ├── TurnOrder.tsx
│   │   │   │       └── HealthBar.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useWebSocket.ts      # WS connection
│   │   │   │   ├── useGameState.ts      # Zustand store
│   │   │   │   ├── usePixi.ts           # Pixi helpers
│   │   │   │   └── useDice.ts           # Dice rolling
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── api.ts               # HTTP client
│   │   │   │   └── websocket.ts         # WS client
│   │   │   │
│   │   │   ├── store/
│   │   │   │   └── gameStore.ts         # Zustand store
│   │   │   │
│   │   │   └── types/                   # Shared types
│   │   │
│   │   ├── public/
│   │   │   └── assets/                  # Map tiles, tokens
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── shared/                    # Shared TypeScript types
│       ├── src/
│       │   ├── types/
│       │   │   ├── dice.ts        # Existing
│       │   │   ├── game.ts        # NEW
│       │   │   ├── character.ts   # NEW
│       │   │   ├── combat.ts      # NEW
│       │   │   ├── map.ts         # NEW
│       │   │   └── websocket.ts   # NEW: WebSocket message types
│       │   └── constants.ts
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json
├── docker-compose.yml             # Updated for VTT
└── README.md
```

## Event-Driven Architecture

### How It Works

The entire system is **event-driven** with a **hybrid approach**:

1. **Request/Response** (HTTP): For initial data fetching
2. **Event-Driven** (WebSocket + GameStateManager): For real-time updates

### Event Flow Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    EVENT FLOW                               │
└─────────────────────────────────────────────────────────────┘

ANY CLIENT ACTION (Discord or VTT)
        ↓
Core Service executes logic (DiceService, CombatService, etc.)
        ↓
Service calls GameStateManager to update state
        ↓
GameStateManager.emit('eventName', data)
        ↓
        ├──────────────────────┬─────────────────────┐
        ↓                      ↓                     ↓
   SyncService          Discord Bot            VTT WebSocket
   (Listens to all)     (Listens to all)       (Broadcasts to clients)
        ↓                      ↓                     ↓
   Coordinates           Posts to Discord      All VTT browsers
   both sides            channel               update UI
```

### GameStateManager: The Event Hub

**Role**: Central event emitter that ALL services use

```typescript
// Conceptual flow (no implementation yet)
class GameStateManager extends EventEmitter {
  addRollResult(gameId: string, roll: RollResult) {
    // 1. Update internal state
    this.games.get(gameId).rolls.push(roll);
    
    // 2. Emit event (anyone can listen)
    this.emit('roll', { gameId, roll });
  }
}

// Discord Bot listens
gameState.on('roll', ({ gameId, roll }) => {
  // Post to Discord channel
});

// VTT WebSocket listens
gameState.on('roll', ({ gameId, roll }) => {
  // Broadcast to all VTT clients in that game
});
```

### Benefits of Event-Driven Approach

✅ **Decoupled**: Discord Bot doesn't know about VTT, and vice versa  
✅ **Extensible**: Add new listeners without changing core logic  
✅ **Consistent**: Same event triggers multiple actions  
✅ **Real-Time**: Changes propagate immediately to all clients  

## React vs Pixi.js in the VTT App

### VTT Application Structure

The VTT frontend is a **single React application** that uses **both React and Pixi.js**:

```
┌─────────────────────────────────────────────────────────────┐
│              VTT APPLICATION (Browser)                       │
│              Single React App                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                React Components (UI Layer)              │ │
│  │  • Sidebar                    • Chat Panel              │ │
│  │  • Toolbar                    • Character Sheets        │ │
│  │  • Dice Roller                • Combat Tracker          │ │
│  │  • Modals/Dialogs             • Settings                │ │
│  │                                                          │ │
│  │  Role: HTML/CSS UI elements (buttons, forms, lists)    │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                                │
│                             │ Renders                        │
│                             ▼                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Pixi.js Canvas (Game Map Layer)              │ │
│  │  • 2D Game Map                • Tokens                  │ │
│  │  • Grid                       • Fog of War              │ │
│  │  • Measurements               • Visual Effects          │ │
│  │                                                          │ │
│  │  Role: WebGL-rendered game board (NOT HTML/CSS)        │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                                │
│                             │ Both use                       │
│                             ▼                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Zustand Store (Shared State)                │ │
│  │  • Game state           • Character data               │ │
│  │  • Token positions      • Combat state                 │ │
│  │  • Roll results         • Map data                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                                │
│                             │ Updates from                   │
│                             ▼                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              WebSocket Connection                      │ │
│  │  Receives events from backend                          │ │
│  │  Sends actions to backend                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Division of Responsibilities

#### React Components
**What**: Traditional UI elements  
**Rendered with**: HTML + CSS (DOM)  
**Examples**:
- Sidebar with character list
- Chat panel showing messages
- Dice roller form (input fields, buttons)
- Combat tracker table
- Modal dialogs

**Why React**: 
- Great for forms, lists, text
- Easy state management
- Accessible (screen readers, keyboard nav)

#### Pixi.js Canvas
**What**: Interactive game map  
**Rendered with**: WebGL (GPU-accelerated)  
**Examples**:
- 2D game map with tiles
- Character tokens (draggable sprites)
- Grid overlay
- Fog of War (dynamic masking)
- Measurement rulers
- Area-of-effect circles

**Why Pixi.js**:
- Performance: 1000+ sprites at 60fps
- WebGL acceleration
- Perfect for game graphics
- Smooth animations, particle effects

### How React and Pixi.js Work Together

```
┌─────────────────────────────────────────────────────────────┐
│  App.tsx (React Root)                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  <div className="vtt-layout">                          │ │
│  │                                                         │ │
│  │    <Sidebar />     ← React component                   │ │
│  │                                                         │ │
│  │    <div className="map-container">                     │ │
│  │      <PixiMap />  ← React wrapper for Pixi canvas      │ │
│  │    </div>                                              │ │
│  │                                                         │ │
│  │    <ChatPanel />   ← React component                   │ │
│  │                                                         │ │
│  │  </div>                                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

Inside `<PixiMap />` (React component):
```typescript
// This is a React component that creates a Pixi canvas
function PixiMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixiApp = useRef<PIXI.Application>(null);
  
  useEffect(() => {
    // Create Pixi.js application (runs once)
    pixiApp.current = new PIXI.Application({
      view: canvasRef.current,
      width: 1600,
      height: 1200,
    });
    
    // Add sprites, grid, etc. to Pixi stage
    const token = new PIXI.Sprite(texture);
    pixiApp.current.stage.addChild(token);
  }, []);
  
  // React renders the canvas element
  // Pixi.js draws INTO the canvas
  return <canvas ref={canvasRef} />;
}
```

### Example: Token Movement Flow

```
1. User drags token on Pixi canvas
   ↓
2. Pixi.js detects drag event (internal to Pixi)
   ↓
3. React component handler gets called
   ↓
4. Component sends WebSocket message:
   { type: 'TOKEN_MOVE', tokenId: 'abc', position: {x: 5, y: 3} }
   ↓
5. Backend receives, updates GameStateManager
   ↓
6. Backend broadcasts to ALL VTT clients
   ↓
7. VTT receives WebSocket message
   ↓
8. Zustand store updates
   ↓
9. React component re-renders (not visible to user)
   ↓
10. Pixi.js sprite position updates (visible animation)
```

## Tech Stack

### Backend
- **Runtime**: Node.js 20
- **Language**: TypeScript (strict)
- **Discord**: Discord.js v14
- **HTTP Server**: Express
- **WebSocket**: ws (native WebSocket)
- **Validation**: Zod
- **Testing**: Vitest

### Frontend
- **Framework**: React 18
- **Canvas**: Pixi.js v7 (2D WebGL)
- **State**: Zustand
- **WebSocket**: Native WebSocket API
- **Build**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (accessible)

### Shared
- **Package Manager**: pnpm (monorepo)
- **Types**: Shared TypeScript package
- **Linting**: ESLint + Prettier

## Deep Integration Implementation

### 1. Game State Manager (Singleton)

```typescript
// backend/src/core/game/GameStateManager.ts
export class GameStateManager {
  private static instance: GameStateManager;
  private games: Map<string, GameState> = new Map();
  
  // Event emitter for state changes
  on(event: string, callback: Function) { ... }
  emit(event: string, data: any) { ... }
  
  // State management
  getGame(gameId: string): GameState { ... }
  updateTokenPosition(gameId: string, tokenId: string, pos: Position) { ... }
  addRollResult(gameId: string, roll: RollResult) { ... }
  
  // Automatically syncs to both Discord and VTT
}
```

### 2. Sync Service (Discord ↔ VTT)

```typescript
// backend/src/services/SyncService.ts
export class SyncService {
  constructor(
    private gameState: GameStateManager,
    private discordClient: Client,
    private wsServer: WebSocketServer
  ) {
    // Listen to game state changes
    gameState.on('roll', (data) => this.syncRoll(data));
    gameState.on('tokenMove', (data) => this.syncToken(data));
  }
  
  // When roll happens, notify both Discord and VTT
  private async syncRoll(data: RollEvent) {
    // Send to Discord channel
    await this.postToDiscord(data);
    
    // Broadcast to all VTT clients
    this.broadcastToVTT(data);
  }
}
```

### 3. WebSocket Messages (Typed)

```typescript
// shared/src/types/websocket.ts
export type WSMessage = 
  | { type: 'ROLL', data: RollResult }
  | { type: 'TOKEN_MOVE', data: { tokenId: string, position: Position } }
  | { type: 'CHAT_MESSAGE', data: { user: string, message: string } }
  | { type: 'GAME_STATE', data: GameState }
  | { type: 'COMBAT_UPDATE', data: CombatState };
```

### 4. React Hook for Real-Time Updates

```typescript
// frontend/src/hooks/useGameState.ts
export function useGameState() {
  const { socket } = useWebSocket();
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  useEffect(() => {
    socket.on('GAME_STATE', (data) => setGameState(data));
    socket.on('ROLL', (roll) => {
      // Show dice animation
      // Add to chat
    });
    socket.on('TOKEN_MOVE', (data) => {
      // Update token on map
    });
  }, [socket]);
  
  return { gameState };
}
```

## Detailed Interaction Flows

### Example 1: Roll from Discord → Syncs to VTT

```
┌─────────────┐                ┌──────────────────┐                ┌─────────────┐
│   Discord   │                │     BACKEND      │                │     VTT     │
│   Client    │                │   (Node.js)      │                │  (Browser)  │
└─────────────┘                └──────────────────┘                └─────────────┘
       │                                │                                  │
       │ 1. User types:                 │                                  │
       │    /roll 5k3 tn:15             │                                  │
       ├───────────────────────────────>│                                  │
       │ Discord Gateway sends          │                                  │
       │ interaction event              │                                  │
       │                                │                                  │
       │                         2. Discord.js receives                    │
       │                            interaction                            │
       │                                │                                  │
       │                         3. rollCommand.execute()                  │
       │                            calls DiceService.roll()               │
       │                                │                                  │
       │                         4. DiceService calls                      │
       │                            GameStateManager                       │
       │                            .addRollResult()                       │
       │                                │                                  │
       │                         5. GameStateManager                       │
       │                            emits 'roll' event                     │
       │                                │                                  │
       │                         6a. Discord Bot listener                  │
       │<───────────────────────    posts embed to channel                │
       │ Bot posts result              │                                  │
       │ (rich embed)                  │                                  │
       │                               │ 6b. WebSocket Server listener    │
       │                               │     broadcasts to VTT clients    │
       │                               ├─────────────────────────────────>│
       │                               │  { type: 'ROLL', data: {...} }  │
       │                               │                                  │
       │                               │                         7. VTT receives event
       │                               │                            updates Zustand store
       │                               │                                  │
       │                               │                         8. React re-renders
       │                               │                            - Chat shows roll
       │                               │                            - Pixi.js animates dice
       │                               │                                  │
```

**Key Points**:
- Discord user never touches VTT
- VTT users see the roll appear automatically
- Backend is the bridge between both worlds

### Example 2: Roll from VTT → Syncs to Discord

```
┌─────────────┐                ┌──────────────────┐                ┌─────────────┐
│     VTT     │                │     BACKEND      │                │   Discord   │
│  (Browser)  │                │   (Node.js)      │                │   Channel   │
└─────────────┘                └──────────────────┘                └─────────────┘
       │                                │                                  │
       │ 1. User clicks "Roll 5k3"      │                                  │
       │    in dice roller UI           │                                  │
       │                                │                                  │
       │ 2. React component calls       │                                  │
       │    sendWebSocketMessage()      │                                  │
       ├───────────────────────────────>│                                  │
       │ WebSocket:                     │                                  │
       │ { type: 'ROLL',                │                                  │
       │   data: { expression: '5k3',   │                                  │
       │           options: {...} } }   │                                  │
       │                                │                                  │
       │                         3. WebSocket handler                      │
       │                            receives message                       │
       │                                │                                  │
       │                         4. Handler calls                          │
       │                            DiceService.roll()                     │
       │                                │                                  │
       │                         5. DiceService calls                      │
       │                            GameStateManager                       │
       │                            .addRollResult()                       │
       │                                │                                  │
       │                         6. GameStateManager                       │
       │                            emits 'roll' event                     │
       │                                │                                  │
       │                               6a. WebSocket listener              │
       │<─────────────────────────     broadcasts to ALL VTT              │
       │ ALL browsers receive          │  (including sender)              │
       │ { type: 'ROLL', ... }         │                                  │
       │                               │                                  │
       │                               │ 6b. Discord Bot listener         │
       │                               ├─────────────────────────────────>│
       │                               │  Posts to Discord channel        │
       │                               │                                  │
       │ 7. VTT updates UI             │                              Discord users
       │    - Zustand store            │                              see roll appear
       │    - Chat message             │                                  │
       │    - Dice animation           │                                  │
       │                               │                                  │
```

**Key Points**:
- VTT user never touches Discord
- Discord channel shows roll automatically
- ALL VTT clients (including sender) get the update via WebSocket

### Example 3: Token Movement (VTT Only)

```
┌─────────────┐                ┌──────────────────┐                ┌─────────────┐
│  VTT Client │                │     BACKEND      │                │ VTT Client  │
│      A      │                │   (WebSocket)    │                │      B      │
└─────────────┘                └──────────────────┘                └─────────────┘
       │                                │                                  │
       │ 1. Player A drags token        │                                  │
       │    on Pixi.js canvas           │                                  │
       │                                │                                  │
       │ 2. Pixi drag end event         │                                  │
       │    triggers React handler      │                                  │
       ├───────────────────────────────>│                                  │
       │ { type: 'TOKEN_MOVE',          │                                  │
       │   tokenId: 'abc',              │                                  │
       │   position: {x: 5, y: 3} }     │                                  │
       │                                │                                  │
       │                         3. Validate move                          │
       │                            (not through walls, etc.)              │
       │                                │                                  │
       │                         4. GameStateManager                       │
       │                            .updateTokenPosition()                 │
       │                                │                                  │
       │                         5. Emits 'tokenMove' event                │
       │                                │                                  │
       │                         6. WebSocket broadcasts                   │
       │<─────────────────────────     to ALL clients                     │
       │ ALL receive update            ├─────────────────────────────────>│
       │                               │                                  │
       │ 7. Player A:                  │                          7. Player B:
       │    Optimistic update          │                             Receives update
       │    (already moved token)      │                             Animates token
       │    Confirms position          │                             to new position
       │                               │                                  │
```

**Key Points**:
- VTT-only action (doesn't involve Discord)
- Backend still validates and broadcasts
- Player A gets confirmation, Player B sees the move

### Example 4: Initial Page Load (HTTP + WebSocket)

```
┌─────────────┐                ┌──────────────────┐
│     VTT     │                │     BACKEND      │
│  (Browser)  │                │   (Node.js)      │
└─────────────┘                └──────────────────┘
       │                                │
       │ 1. User opens                  │
       │    https://vtt.example.com     │
       ├───────────────────────────────>│
       │ HTTP GET /                     │
       │                                │
       │<───────────────────────────────┤
       │ 2. Returns index.html          │
       │    (React app bundle)          │
       │                                │
       │ 3. React app boots             │
       │    Reads game ID from URL      │
       │                                │
       │ 4. Fetch initial data          │
       ├───────────────────────────────>│
       │ HTTP GET /api/game/my-game     │
       │                                │
       │<───────────────────────────────┤
       │ 5. Returns full game state     │
       │    { tokens: [...],            │
       │      characters: [...],        │
       │      rolls: [...] }            │
       │                                │
       │ 6. React renders UI            │
       │    Pixi.js draws map           │
       │                                │
       │ 7. Establish WebSocket         │
       ├───────────────────────────────>│
       │ wss://vtt.yourdomain.com/ws    │
       │ (Browser always uses WSS!)     │
       │                                │
       │<───────────────────────────────┤
       │ 8. WebSocket connected         │
       │                                │
       │ 9. Send JOIN_GAME              │
       ├───────────────────────────────>│
       │ { type: 'JOIN_GAME',           │
       │   gameId: 'my-game' }          │
       │                                │
       │                         10. Backend adds client
       │                             to game room
       │                                │
       │<───────────────────────────────┤
       │ 11. Confirm joined             │
       │     { type: 'JOINED' }         │
       │                                │
       │ NOW: Real-time updates begin   │
       │      Any event in game         │
       │      is broadcast to this      │
       │      client                    │
       │                                │
```

**Key Points**:
- **HTTP** for initial data (request/response)
- **WebSocket** for real-time updates (bidirectional)
- Two-phase loading: fetch state, then subscribe to changes

---

### Critical: Browser URLs vs Internal URLs

**⚠️ Important distinction** for development and deployment:

| Context | Example URL | Usage |
|---------|------------|-------|
| **Browser** (production) | `wss://vtt.yourdomain.com/ws` | Players' browsers always use public HTTPS/WSS URL |
| **Browser** (local dev) | `ws://localhost:3000` | Only during local development without tunnel |
| **Docker internal** | `http://backend:3000` | Backend services talking to each other |
| **Cloudflare ingress** | `http://backend:3000` | Tunnel → Backend (internal only) |

**Rules**:
- ✅ Browsers **always** connect via `wss://` (or `ws://localhost` in dev)
- ❌ Browsers **never** use Docker service names (`ws://backend:3000`)
- ✅ Docker services **can** use internal names
- ✅ Cloudflare Tunnel connects via Docker network internally

**Example**: Frontend WebSocket connection code:

```typescript
// ✅ CORRECT - Browser code
const wsUrl = import.meta.env.PROD 
  ? 'wss://vtt.butterfly-l5r.xyz/ws'    // Production (via Cloudflare)
  : 'ws://localhost:3000/ws';            // Local development

const socket = new WebSocket(wsUrl);
```

```typescript
// ❌ WRONG - This will never work in browser
const socket = new WebSocket('ws://backend:3000');
```

## Implementation Phases

### Phase 3A: VTT Foundation (Current → Week 1)
- [ ] Set up monorepo (pnpm workspaces)
- [ ] Create `packages/frontend` with Vite + React
- [ ] Create Express server in backend
- [ ] Add WebSocket server
- [ ] Basic GameStateManager
- [ ] Simple HTTP API (`GET /api/health`)

### Phase 3B: Basic VTT (Week 1-2)
- [ ] Pixi.js canvas with grid
- [ ] Token rendering (static)
- [ ] WebSocket connection (frontend ↔ backend)
- [ ] Basic chat UI
- [ ] Dice roller UI (calls existing logic)

### Phase 3C: Deep Integration (Week 2-3)
- [ ] SyncService implementation
- [ ] Discord → VTT roll sync
- [ ] VTT → Discord roll sync
- [ ] Shared character sheets (basic)
- [ ] Combat tracker (basic)

### Phase 3D: Advanced VTT (Week 3-4)
- [ ] Drag & drop tokens
- [ ] Fog of War
- [ ] Measurement tools
- [ ] Dice animations (3D or 2D)
- [ ] Map upload/management
- [ ] GM tools (show/hide tokens)

### Phase 4: Character Management (Later)
- [ ] Full character sheets
- [ ] Character builder
- [ ] Roll with character stats
- [ ] Inventory management

### Phase 5: RAG/LLM Integration (Later)
- [ ] Rule lookups
- [ ] Lore queries
- [ ] NPC generation

## Deployment

### ⚠️ Important: Development vs Production

This section covers **both local development and production deployment**. Don't mix them up!

| Aspect | Development | Production |
|--------|------------|------------|
| **Purpose** | Coding, testing | Real gaming sessions |
| **Docker** | Optional | Recommended |
| **Cloudflare Tunnel** | Optional temp tunnel | Named tunnel + domain |
| **Port Exposure** | `3000:3000` OK | `127.0.0.1:3000:3000` or none |
| **Environment** | `NODE_ENV=development` | `NODE_ENV=production` |
| **Hot Reload** | Yes (tsx watch) | No (compiled) |
| **URLs** | `localhost:3000` | `https://vtt.yourdomain.xyz` |

---

### Development
```bash
# Terminal 1: Backend (Discord + HTTP + WS)
cd packages/backend
pnpm dev

# Terminal 2: Frontend (React + Vite)
cd packages/frontend
pnpm dev  # Runs on http://localhost:5173
```

### Production (Docker)
```yaml
# docker-compose.yml
services:
  backend:
    build: ./packages/backend
    ports:
      - "3000:3000"  # HTTP/WS
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - NODE_ENV=production
  
  frontend:
    build: ./packages/frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

## Local Hosting Options (Self-Hosted on Your PC)

> **🎯 Important Note**: This section describes **production deployment** for regular gaming sessions, not local development.
> 
> If you're just coding/testing, see [Development](#development) section instead.
> 
> **Production** = Players connecting to play games  
> **Development** = You writing code with hot-reload

### Overview: Private, Secure Deployment

This system is designed to run **locally on your PC** with Docker. Players access the VTT through links posted in Discord. No cloud deployment or hosting fees required!

```
Your PC (Running Docker)
├── Discord Bot ──────────────────> Discord API (Internet)
│   • Posts VTT link in channel
│   • Bot appears online
│   
└── VTT Server (HTTP + WebSocket)
    • Runs locally on your PC
    • Port 3000 (configurable)
    │
    ├──> Players click link in Discord
    └──> Browser opens VTT → connects to your PC
```

### Option 1: LAN Only (Most Secure) ⭐ RECOMMENDED

**Perfect for**: In-person game nights, maximum security

**Cost**: 💰 **FREE**

**How it works**:
- VTT only accessible on your local network (same WiFi)
- Firewall blocks external access automatically
- Players must be physically at your location or on VPN

**Setup Steps**:

1. **Find your PC's local IP address**:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   
   # Look for: 192.168.1.100 (or similar)
   ```

2. **Update `.env` file**:
   ```bash
   DISCORD_TOKEN=your_bot_token
   DISCORD_CLIENT_ID=1448956089570820126
   VTT_URL=http://192.168.1.100:3000  # Your local IP
   VTT_CHANNEL_ID=your_discord_channel_id
   ```

3. **Update `docker-compose.yml`** (bind to local IP):
   ```yaml
   services:
     backend:
       ports:
         - "192.168.1.100:3000:3000"  # Only your local IP
   ```

4. **Start Docker**:
   ```bash
   docker-compose up -d
   ```

5. **Bot posts link in Discord**:
   ```
   🦋 Butterfly Lady VTT
   [Open Virtual Tabletop] → http://192.168.1.100:3000
   ```

**Pros**:
- ✅ Maximum security (no external exposure)
- ✅ Fast (local network speeds)
- ✅ No router configuration needed
- ✅ No port forwarding
- ✅ Free

**Cons**:
- ❌ Only works for players on same WiFi
- ❌ Not suitable for remote players

---

### Option 2: Cloudflare Tunnel (Remote + Secure) 🌟 RECOMMENDED

**Perfect for**: Remote players, maximum convenience + security

**Cost**: 💰 **Domain required (~$1-3/year)** + Cloudflare free tier

**What is Cloudflare Tunnel?**

Cloudflare Tunnel creates a **secure, encrypted tunnel** from your PC to Cloudflare's network. Players connect through Cloudflare, which forwards traffic to your PC through the tunnel.

**Architecture**:
```
Player Browser
     ↓
     ↓ HTTPS (encrypted)
     ↓
Cloudflare Edge Network (worldwide)
     ↓
     ↓ Secure Tunnel (encrypted)
     ↓
Your PC (Docker running VTT)
     ↓
No exposed IP, no port forwarding!
```

**Benefits**:
- ✅ **Cloudflare Tunnel is FREE** (account is free)
- ✅ **HTTPS included** (automatic SSL certificate)
- ✅ **No port forwarding** needed
- ✅ **Your IP stays hidden** (not exposed to players)
- ✅ **DDoS protection** (Cloudflare shields you)
- ✅ **Fast** (Cloudflare's global CDN)
- ✅ **Players connect from anywhere**
- ✅ **Works behind any firewall/NAT**

**Important: Two Types of Cloudflare Tunnels**

| Feature | Temporary Tunnel | Named Tunnel |
|---------|-----------------|--------------|
| **Command** | `cloudflared tunnel --url` | `cloudflared tunnel create NAME` |
| **URL** | Random (e.g., `abc123.trycloudflare.com`) | Your domain (e.g., `vtt.yourdomain.xyz`) |
| **Cost** | Free | Domain: $1-3/year |
| **Stability** | Changes each restart | Permanent |
| **Account Needed** | No | Yes (free) |
| **Cloudflare Access** | ❌ Not supported | ✅ Supported |
| **Use Case** | Testing, demos, one-off sessions | Regular gaming, production |

**⚠️ Important**: Temporary tunnels are **not** for regular gaming sessions!

---

### Domain Requirement for Production

For **named tunnels** (regular gaming sessions), you need:
- A **domain name** (~$1-3/year for `.xyz`, `.fun`, etc.)
- Or use a **subdomain** if you already own a domain

**Why?** Named tunnels require a domain for:
- ✅ Stable, bookmarkable URLs (players can save it)
- ✅ Cloudflare Access policies (authentication)
- ✅ Long-term reliability
- ✅ Professional appearance

**Where to buy cheap domains**:
- Namecheap, Porkbun, Cloudflare Registrar
- Look for `.xyz`, `.fun`, `.online`, `.site` TLDs (cheapest)
- Often $1-3/year for first year

---

**Setup Steps**:

#### Quick Start (Temporary Tunnel - Testing Only ⚠️)

**Use Case**: One-off testing, demos, or trying out the system

**⚠️ Important**: This is NOT for regular gaming sessions!
- URL changes every restart (players can't bookmark it)
- Cannot use Cloudflare Access (no authentication)
- Not intended for production use per Cloudflare docs

**Quick Test Steps**:

1. **Install cloudflared**:
   ```bash
   # macOS (Homebrew)
   brew install cloudflare/cloudflare/cloudflared
   
   # Linux
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   
   # Windows
   # Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
   ```

2. **Start your VTT with Docker**:
   ```bash
   docker-compose up -d
   # VTT now running on http://localhost:3000
   ```

3. **Create temporary tunnel**:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

4. **You'll see a random URL**:
   ```
   Your quick Tunnel: https://random-name-7a2b.trycloudflare.com
   ```

5. **Test in browser** - but don't share this with players for long-term use!

**For regular gaming, use Named Tunnel below** ↓

---

#### Named Tunnel (Recommended for Production) ⭐

**Prerequisites**:
- Cloudflare account (free, no credit card)
- A domain name ($1-3/year for cheap TLDs like `.xyz`, `.fun`)
- Domain DNS managed by Cloudflare (free)

**Why a domain?** Named tunnels require a domain for stable URLs, Access policies, and production reliability.

**Setup Steps**:

1. **Get a cheap domain** (one-time):
   - Namecheap, Porkbun, or Cloudflare Registrar
   - Recommend: `.xyz` ($1-2/year), `.fun` ($2-3/year)
   - Example: `butterfly-l5r.xyz`

2. **Add domain to Cloudflare** (free):
   - Go to Cloudflare dashboard
   - Add site → Enter your domain
   - Update nameservers at registrar (Cloudflare provides instructions)

3. **Create Cloudflare account** (if you don't have one):
   - Go to https://dash.cloudflare.com/sign-up
   - No credit card required

4. **Login to cloudflared**:
   ```bash
   cloudflared tunnel login
   ```
   - Opens browser to authenticate
   - Downloads credentials automatically

5. **Create named tunnel**:
   ```bash
   cloudflared tunnel create butterfly-lady
   # Outputs tunnel ID: e.g., "a1b2c3d4-5678-90ab-cdef-1234567890ab"
   ```

6. **Create config file** `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: butterfly-lady
   credentials-file: /Users/yourname/.cloudflared/a1b2c3d4-5678-90ab-cdef-1234567890ab.json
   
   ingress:
     - hostname: vtt.butterfly-l5r.xyz  # Your domain!
       service: http://localhost:3000
     - service: http_status:404
   ```

7. **Route DNS**:
   ```bash
   cloudflared tunnel route dns butterfly-lady vtt.butterfly-l5r.xyz
   ```
   - This creates a CNAME record in Cloudflare
   - Points your domain to the tunnel

8. **Start tunnel**:
   ```bash
   cloudflared tunnel run butterfly-lady
   ```

9. **Run as service** (Linux/macOS):
   ```bash
   cloudflared service install
   sudo systemctl start cloudflared
   sudo systemctl enable cloudflared
   ```

10. **Your permanent URL**: `https://vtt.butterfly-l5r.xyz`
    - Same URL forever
    - Players can bookmark it
    - Auto-renews SSL certificate

**Named Tunnel Benefits**:
- ✅ Stable URL (never changes)
- ✅ Custom domain (professional)
- ✅ Cloudflare Access support (authentication)
- ✅ Auto-starts with your PC (if configured as service)
- ✅ Better performance and reliability
- ✅ Access logs and analytics

---

### Option 3: Port Forwarding (Manual)

**Cost**: 💰 **FREE** (but requires router access)

**How it works**:
- Configure router to forward port 3000 to your PC
- Players access via your public IP

**Setup**:
1. Find public IP: https://whatismyipaddress.com/
2. Router admin panel → Port Forwarding
3. Forward external port 3000 → your PC's 192.168.1.100:3000
4. Players use: `http://YOUR_PUBLIC_IP:3000`

**Pros**:
- ✅ Free
- ✅ Direct connection (low latency)

**Cons**:
- ❌ Exposes your public IP
- ❌ No HTTPS (unless you set up manually)
- ❌ Public IP may change (need dynamic DNS)
- ❌ Security risk (must add authentication!)
- ❌ Requires router configuration

**⚠️ NOT RECOMMENDED** - Use Cloudflare Tunnel instead!

---

## Deployment Comparison

| Feature | LAN Only | Cloudflare Tunnel | Port Forward |
|---------|----------|-------------------|--------------|
| **Cost** | Free | Free | Free |
| **Setup Complexity** | Easy | Easy | Medium |
| **Remote Access** | ❌ No | ✅ Yes | ✅ Yes |
| **HTTPS** | ❌ No | ✅ Yes (auto) | ❌ No |
| **Port Forwarding** | Not needed | Not needed | Required |
| **IP Exposure** | Hidden | Hidden | Exposed |
| **DDoS Protection** | N/A | ✅ Yes | ❌ No |
| **Configuration** | One-time | One-time | Router config |
| **Recommended For** | In-person | Remote players | Not recommended |

---

## Discord Integration for Sharing VTT Link

### Automatic Link Posting

Bot posts VTT link on startup:

```typescript
// backend/src/bot/index.ts
client.once('ready', async () => {
  console.log('✅ Butterfly Lady is online!');
  
  // Post VTT link to designated channel
  if (process.env.VTT_CHANNEL_ID) {
    const channel = await client.channels.fetch(process.env.VTT_CHANNEL_ID);
    
    if (channel?.isTextBased()) {
      await channel.send({
        embeds: [{
          title: '🦋 Butterfly Lady Virtual Tabletop',
          description: 'Click the link below to join the game!',
          fields: [
            {
              name: '🎲 VTT Access',
              value: `[Open Virtual Tabletop](${process.env.VTT_URL})`,
              inline: false
            },
            {
              name: '📖 Instructions',
              value: '• Click link to open VTT in browser\n• Drag tokens to move\n• Use dice roller or /roll in Discord',
              inline: false
            }
          ],
          color: 0x7B2CBF,
          thumbnail: {
            url: 'https://i.imgur.com/your-butterfly-icon.png'
          },
          footer: {
            text: 'L5R 4th Edition • Roll & Keep'
          }
        }]
      });
      console.log('📢 VTT link posted to Discord');
    }
  }
});
```

### `/vtt` Command

Add a command for players to get the link anytime:

```typescript
// backend/src/commands/vtt.ts
export const vttCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('vtt')
    .setDescription('Get the Virtual Tabletop link'),
  
  async execute(interaction) {
    await interaction.reply({
      embeds: [{
        title: '🦋 Virtual Tabletop',
        description: `[Click here to open VTT](${process.env.VTT_URL})`,
        color: 0x7B2CBF
      }],
      ephemeral: true  // Only visible to user who typed command
    });
  }
};
```

---

## Security Considerations

### For LAN Only
- ✅ Already secure (firewall blocks external access)
- ✅ No additional security needed
- Optional: Add password in VTT for extra protection

### For Cloudflare Tunnel
- ✅ HTTPS included (encrypted traffic)
- ✅ Your IP is hidden
- ✅ DDoS protection included
- Recommended: Add Discord OAuth authentication

### Authentication Options

You have two main options for protecting your VTT (or combine both):

#### Option A: Cloudflare Zero Trust Access (Easiest)

**Recommended for most users** - No code required!

Cloudflare Access sits in front of your application and handles authentication:

**Setup**:
1. Go to Cloudflare Zero Trust dashboard (free)
2. Create Access Policy for your VTT domain
3. Choose authentication method:
   - Email OTP (free, no setup)
   - GitHub, Google, etc.
   - Or even Discord (via OIDC)
4. Add your players' emails to allowed list

**How it works**:
```
Player clicks VTT link
    ↓
Cloudflare Access intercepts
    ↓
Player authenticates (email OTP)
    ↓
Cloudflare passes authenticated request to your app
    ↓
Your app doesn't need auth code!
```

**Benefits**:
- ✅ No code in your app
- ✅ Cloudflare handles it all
- ✅ Works before traffic reaches your PC
- ✅ Free tier available
- ✅ Email-based access (no OAuth setup)

**Drawbacks**:
- Manual email list management
- Can't check Discord server membership automatically

---

#### Option B: Discord OAuth in App (Most Integrated)

**Best for Discord-centric gaming** - Only Discord server members can access

```typescript
// backend/src/vtt/middleware/auth.ts
import { Strategy as DiscordStrategy } from 'passport-discord';

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: `${process.env.VTT_URL}/auth/discord/callback`,
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
  // Check if user is in your Discord server
  const isInGuild = profile.guilds?.some(
    guild => guild.id === process.env.DISCORD_GUILD_ID
  );
  
  if (isInGuild) {
    done(null, profile);
  } else {
    done(new Error('Not a member of the game server'));
  }
}));

// Protect VTT routes
app.use('/vtt', requireAuth, express.static('frontend/dist'));
```

**Benefits**:
- ✅ Automatic Discord server membership check
- ✅ Players authenticate once with Discord
- ✅ Can see Discord username/avatar in VTT
- ✅ Tight integration with Discord

**Drawbacks**:
- Requires coding in your app
- Need Discord OAuth setup

---

#### Option C: Both (Defense in Depth)

Use Cloudflare Access for basic protection, then Discord OAuth for rich integration:

```
Player → Cloudflare Access (email) → Discord OAuth → VTT
```

This is **overkill for most gaming groups** but provides maximum security.

---

#### Recommendation

**For most users**: Start with **Cloudflare Access** (Option A)
- Zero code required
- Free
- Easy email-based whitelist
- Add Discord OAuth later if you want richer integration

**For Discord-heavy groups**: Use **Discord OAuth** (Option B)
- Automatic server membership check
- Better user experience for Discord-centric groups

---

## Complete Setup Example: Cloudflare Tunnel

### 1. Environment Setup

```bash
# .env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=1448956089570820126
VTT_URL=https://vtt.butterfly-l5r.xyz  # Your domain
VTT_CHANNEL_ID=1234567890
NODE_ENV=production
```

### 2. Cloudflare Tunnel Config

Create `cloudflared/config.yml`:

```yaml
tunnel: butterfly-lady
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: vtt.butterfly-l5r.xyz
    service: http://backend:3000  # Docker service name!
  - service: http_status:404
```

Place your tunnel credentials in `cloudflared/credentials.json`.

### 3. Docker Compose (Recommended Production Setup)

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./packages/backend
    container_name: butterfly-lady-backend
    # NO ports exposed! Tunnel connects via Docker network
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
      - VTT_URL=${VTT_URL}
      - VTT_CHANNEL_ID=${VTT_CHANNEL_ID}
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - vtt-network

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: butterfly-lady-tunnel
    command: tunnel run
    volumes:
      - ./cloudflared:/etc/cloudflared
    restart: unless-stopped
    networks:
      - vtt-network
    depends_on:
      - backend

networks:
  vtt-network:
    driver: bridge
```

**Key points**:
- ✅ **No exposed ports** - more secure
- ✅ `cloudflared` connects to `backend` via Docker network
- ✅ Everything starts with one command
- ✅ Auto-restarts on failure

### 4. Start Everything (One Command!)

```bash
# Create tunnel first (one-time setup)
cloudflared tunnel create butterfly-lady

# Copy credentials to ./cloudflared/credentials.json
# Create ./cloudflared/config.yml (see above)

# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# You should see:
# ✅ Discord bot connected
# ✅ VTT server started
# ✅ Cloudflare tunnel connected
```

### 5. Alternative: Expose Port for Local Development

If you want to access VTT locally (localhost) AND via tunnel:

```yaml
services:
  backend:
    ports:
      - "127.0.0.1:3000:3000"  # Only localhost, not 0.0.0.0
    # ... rest same
```

**Security note**: Never use `"3000:3000"` (binds to all interfaces). Always use `"127.0.0.1:3000:3000"` if exposing ports.

### 4. Share Link

Bot automatically posts in Discord:
```
🦋 Butterfly Lady Virtual Tabletop
[Open Virtual Tabletop] ← Players click here
```

### 5. Players Connect

1. Click link in Discord
2. Browser opens HTTPS URL
3. VTT loads (React + Pixi.js)
4. WebSocket connects
5. Player sees map, can roll dice, move tokens
6. Everything syncs with Discord and other players!

---

## Troubleshooting

### Cloudflare Tunnel Issues

**Problem**: Tunnel won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Check Docker is running
docker-compose ps

# Check cloudflared is installed
cloudflared --version
```

**Problem**: Players can't connect
- Check firewall allows cloudflared
- Verify Docker container is running: `docker ps`
- Check logs: `docker-compose logs backend`
- Test locally first: `curl http://localhost:3000/api/health`

**Problem**: WebSocket won't connect
- Cloudflare Tunnel supports WebSockets by default (no config needed)
- Check browser console for errors
- Verify HTTPS is used (not HTTP)

### General Issues

**Problem**: Bot online but VTT link doesn't work
- Check `VTT_URL` in `.env` is correct
- Make sure Docker is running: `docker ps`
- Test local access: `http://localhost:3000`

**Problem**: Rolls in Discord don't show in VTT
- Check WebSocket connection in browser DevTools
- Verify GameStateManager is emitting events
- Check backend logs for errors

---

## Cost Summary

### LAN Only Setup
| Component | Cost |
|-----------|------|
| **Node.js Backend** | Free (your PC) |
| **Discord Bot** | Free (Discord API) |
| **Docker** | Free (Docker Desktop) |
| **TOTAL** | **$0** |

### Cloudflare Tunnel Setup (Remote Players)
| Component | Cost |
|-----------|------|
| **Node.js Backend** | Free (your PC) |
| **Discord Bot** | Free (Discord API) |
| **Docker** | Free (Docker Desktop) |
| **Cloudflare Tunnel** | Free |
| **Cloudflare Account** | Free (no CC required) |
| **SSL Certificate** | Free (via Cloudflare) |
| **DDoS Protection** | Free (via Cloudflare) |
| **Domain Name** | **$1-3/year** (required for named tunnel) |
| **TOTAL** | **$1-3/year** (~$0.25/month) |

**Bottom Line**: 
- LAN only: **$0** forever
- Remote access: **$1-3 one-time per year** for domain

**Cheap domain recommendations**:
- `.xyz` - $1-2/year (Namecheap, Porkbun)
- `.fun` - $2-3/year
- `.online` - $2-4/year

---

## Recommended Setup for Most Users

**For regular remote gaming groups**:

### Production Setup (Named Tunnel)
1. ✅ **Buy cheap domain** ($1-3/year, e.g., `butterfly-l5r.xyz`)
2. ✅ **Use Cloudflare Tunnel** (named, permanent)
3. ✅ Free tunnel, HTTPS included
4. ✅ No port forwarding, no exposed IP
5. ✅ Players connect from anywhere
6. ✅ Stable URL players can bookmark
7. ✅ Add Cloudflare Access or Discord OAuth (only server members)

**Total cost**: **$1-3/year** (~$0.25/month) 🎉

### Development/Testing Only
- Use temporary tunnel (`cloudflared tunnel --url`)
- **Not for regular gaming** (URL changes each time)
- Free, no domain needed
- Good for testing or one-off sessions

## API Endpoints

### HTTP REST API
```
GET  /api/health           # Health check
GET  /api/game/:id/state   # Get full game state
POST /api/roll             # Execute roll (returns result)
GET  /api/characters       # List characters
POST /api/characters       # Create character
GET  /api/characters/:id   # Get character
PUT  /api/characters/:id   # Update character
```

### WebSocket Messages
```
Client → Server:
  - ROLL              # Execute roll
  - TOKEN_MOVE        # Move token
  - CHAT_MESSAGE      # Send chat
  - JOIN_GAME         # Join game room
  
Server → Client:
  - GAME_STATE        # Full state update
  - ROLL              # Roll result
  - TOKEN_MOVE        # Token moved
  - CHAT_MESSAGE      # New chat message
  - COMBAT_UPDATE     # Initiative/HP change
```

### Why Not Just Use POST for Everything?

**Question**: Why use WebSocket? Why not just HTTP POST `/api/roll`?

**Answer**: You COULD use POST, but you'd lose real-time sync:

#### Scenario 1: Using Only HTTP POST (BAD)
```
Player A rolls via POST /api/roll
    ↓
Backend processes roll
    ↓
Returns result to Player A
    ↓
❌ Player B doesn't know about the roll!
❌ Player B needs to poll: GET /api/rolls every 2 seconds
❌ Inefficient, laggy, not real-time
```

#### Scenario 2: Using WebSocket (GOOD)
```
Player A rolls via WebSocket { type: 'ROLL' }
    ↓
Backend processes roll
    ↓
Backend broadcasts to ALL connected clients
    ↓
✅ Player A gets result immediately
✅ Player B gets result immediately (push, not poll)
✅ Player C, D, E all get it too
✅ Real-time, efficient, no polling
```

### Hybrid Approach: HTTP + WebSocket (BEST)

We use **BOTH** for different purposes:

**HTTP POST/GET** for:
- Initial page load (fetch full game state)
- File uploads (maps, character portraits)
- One-time operations (create character, delete game)
- External API integrations

**WebSocket** for:
- Real-time game events (rolls, token moves)
- Chat messages
- Combat tracker updates
- Any action that other players need to see immediately

**Example**:
```
VTT loads: HTTP GET /api/game/:id/state (once)
         ↓
User plays: WebSocket messages (continuously)
         ↓
Upload map: HTTP POST /api/maps/upload (once)
```

## Discord Commands (Extended)

### Existing
- `/roll <expression>` - Roll dice

### New Commands
- `/character create <name>` - Create character
- `/character sheet [name]` - Show character sheet
- `/character roll <name> <skill>` - Roll with character stats
- `/combat start` - Start combat encounter
- `/combat initiative` - Roll initiative
- `/combat next` - Next turn
- `/map status` - Show token positions
- `/map move <token> <position>` - Move token from Discord

## Security Considerations

1. **Authentication**: VTT requires login (Discord OAuth)
2. **Game Rooms**: Each Discord server = separate game
3. **Permissions**: GM vs Player roles (Discord roles)
4. **Rate Limiting**: Prevent spam rolls
5. **Input Validation**: Zod schemas for all inputs

## Performance

- **WebSocket**: Binary protocol for efficiency
- **Pixi.js**: Hardware-accelerated rendering
- **State Management**: Optimistic updates in VTT
- **Caching**: Cache character sheets, maps

## Benefits of This Architecture

✅ **Single Codebase**: Share 100% of game logic  
✅ **Real-Time**: Instant sync between Discord and VTT  
✅ **Flexible**: Use Discord only, VTT only, or both  
✅ **Type-Safe**: Shared TypeScript types across stack  
✅ **Scalable**: Can add database later (Phase 5)  
✅ **Fast Development**: Vite HMR, tsx watch mode  

## Next Steps

### Phase 1: Choose Your Deployment Strategy

**Decide how you'll host the VTT**:

- **Option A: LAN Only** (in-person games)
  - ✅ Most secure
  - ✅ Easiest setup
  - ✅ No external dependencies
  - Best for: Weekly game night at your house

- **Option B: Cloudflare Tunnel** (remote players) ⭐ **RECOMMENDED**
  - ✅ 100% free
  - ✅ HTTPS included
  - ✅ No port forwarding
  - ✅ Players anywhere in the world
  - Best for: Remote gaming groups

### Phase 2: Set Up Development Environment

1. **Review this architecture document** thoroughly
2. **Start Phase 3A**: Set up monorepo structure (see Migration Guide)
3. **Test Discord Bot** with existing functionality
4. **Add basic VTT server** (Express + WebSocket)
5. **Create simple React frontend** with Pixi.js canvas

### Phase 3: Implement Core VTT Features

1. **Basic map rendering** (Pixi.js)
2. **Token management** (static first, then draggable)
3. **WebSocket connection** (frontend ↔ backend)
4. **GameStateManager** implementation
5. **Sync service** (Discord ↔ VTT)

### Phase 4: Deploy and Test

1. **Set up Docker** on your PC
2. **Choose deployment**:
   - LAN: Use local IP (192.168.x.x)
   - Remote: Install Cloudflare Tunnel
3. **Test locally** first
4. **Share link** with one test player
5. **Iterate** based on feedback

### Phase 5: Add Advanced Features

1. **Drag & drop tokens**
2. **Fog of War**
3. **Dice animations**
4. **Combat tracker**
5. **Character sheets**
6. **Discord OAuth** (authentication)

---

## Quick Start Checklist

Ready to begin? Here's your immediate action plan:

### Today
- [ ] Read this architecture document completely
- [ ] Decide: LAN only or Cloudflare Tunnel?
- [ ] If Cloudflare: Create free account + install cloudflared
- [ ] Review Migration Guide (MIGRATION_GUIDE.md)

### This Week
- [ ] Set up monorepo structure (packages/backend, packages/frontend)
- [ ] Move existing Discord bot code to packages/backend
- [ ] Create basic Express server alongside Discord bot
- [ ] Create basic React app with Vite
- [ ] Test: Can you access React app in browser?

### Next Week
- [ ] Add Pixi.js canvas to React app
- [ ] Implement WebSocket server in backend
- [ ] Connect frontend to backend via WebSocket
- [ ] Test: Can browser receive messages from backend?

### Week 3
- [ ] Implement GameStateManager
- [ ] Make roll command work from VTT
- [ ] Make roll from Discord appear in VTT
- [ ] Test with real player!

### Week 4
- [ ] Add token rendering
- [ ] Add basic map image
- [ ] Deploy with chosen method (LAN or Cloudflare)
- [ ] Share with gaming group
- [ ] 🎉 Play your first game with VTT!

---

## Resources

### Documentation
- **VTT Architecture**: This document
- **Migration Guide**: MIGRATION_GUIDE.md
- **Implementation Summary**: IMPLEMENTATION_SUMMARY.md

### External Resources
- **Cloudflare Tunnel Docs**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Discord.js Guide**: https://discordjs.guide/
- **Pixi.js Documentation**: https://pixijs.com/guides
- **React Documentation**: https://react.dev/

### Community
- **Discord.js Community**: https://discord.gg/djs
- **Pixi.js Forum**: https://github.com/pixijs/pixijs/discussions
- **L5R Community**: Share your progress!

---

**Let's build the ultimate L5R virtual tabletop!** 🦋⚔️🎲

**Cost**: $0/month • **Privacy**: 100% yours • **Players**: Connect from anywhere
