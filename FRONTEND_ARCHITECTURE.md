# 🎨 Butterfly Lady Frontend Architecture

> **Document Version**: 1.0 - Unified Frontend (Map Editor + VTT)
>
> **Status**: Design Phase - Not yet implemented
> 
> **Related Docs**: See [VTT_ARCHITECTURE.md](VTT_ARCHITECTURE.md) for backend architecture

## Overview

The frontend is a **unified Vite + React + PixiJS application** that serves two primary use cases:

1. **Map Editor** (`/editor` route) - Create and AI-generate L5R battle maps
2. **VTT Game View** (`/vtt` route) - Play L5R games with synchronized state

Both modes share a common PixiJS engine, components, and utilities, enabling seamless workflow from map creation to gameplay.

---

## Why One Frontend?

| Benefit | Details |
|---------|---------|
| **Code Reuse** | Walls, lighting, geometry shared between editor and VTT |
| **Shared State** | One Zustand store manages both modes |
| **Simpler Dev** | One `pnpm dev` command, one port, easier debugging |
| **Unified UX** | Consistent UI/UX between map creation and gameplay |
| **Easier Routing** | Navigate between modes in-app without separate deployments |
| **Smaller Bundle** | Tree-shaking removes unused code per route |

---

## Technology Stack

### Core
- **Framework**: React 18 + TypeScript (strict)
- **Build Tool**: Vite (HMR, fast builds)
- **Routing**: React Router v6
- **State Management**: Zustand (lightweight, performant)

### Graphics Engine
- **2D Rendering**: Pixi.js v8 (WebGL accelerated)
- **Canvas Wrapper**: Custom hooks + React integration
- **Viewport**: pixi-viewport (pan/zoom/rotate)

### Map Editor Specific
- **ComfyUI Client**: Custom HTTP + WebSocket client
- **Geospatial**: @turf/turf (polygon operations)
- **Procedural**: d3-delaunay (Voronoi), simplex-noise (terrain)
- **Curves**: bezier-js (smooth roads)
- **Storage**: idb (IndexedDB wrapper for projects)

### VTT Specific
- **WebSocket**: Native WebSocket API (real-time sync)
- **HTTP Client**: Fetch API (initial state, REST)

### UI Components
- **Component Library**: Radix UI (accessible primitives)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

---

## Application Structure

### Routing

```typescript
// src/App.tsx
<BrowserRouter>
  <Routes>
    {/* Map Editor: Create and generate maps */}
    <Route path="/editor" element={<MapEditor />} />
    
    {/* VTT: Play game with generated maps */}
    <Route path="/vtt/:gameId?" element={<VTT />} />
    
    {/* Default: Redirect to editor */}
    <Route path="/" element={<Navigate to="/editor" replace />} />
  </Routes>
</BrowserRouter>
```

### Folder Structure

```
packages/frontend/
├── src/
│   ├── main.tsx                     # Vite entry
│   ├── App.tsx                      # Router setup
│   │
│   ├── pages/                       # Route components
│   │   ├── MapEditor.tsx            # /editor route
│   │   └── VTT.tsx                  # /vtt route
│   │
│   ├── components/
│   │   ├── editor/                  # Map editor UI
│   │   ├── vtt/                     # VTT game UI
│   │   ├── shared/                  # Shared components
│   │   ├── dice/                    # Dice roller (both)
│   │   └── character/               # Character sheets (both)
│   │
│   ├── engine/                      # Pixi.js systems
│   │   ├── core/                    # Shared Pixi core
│   │   ├── editor/                  # Editor-specific
│   │   ├── vtt/                     # VTT-specific
│   │   ├── walls/                   # SHARED: Collision & lighting
│   │   ├── lighting/                # SHARED: Dynamic lights
│   │   └── geometry/                # Math utilities
│   │
│   ├── services/
│   │   ├── comfyui/                 # AI generation
│   │   ├── api/                     # Backend communication
│   │   ├── export/                  # Map export
│   │   └── storage/                 # IndexedDB
│   │
│   ├── store/                       # Zustand stores
│   │   ├── editorStore.ts           # Editor state
│   │   ├── vttStore.ts              # VTT game state
│   │   └── sharedStore.ts           # User prefs
│   │
│   ├── data/                        # Static data
│   │   ├── patterns/                # Building patterns
│   │   ├── modes/                   # Map modes (village, city, etc.)
│   │   └── workflows/               # ComfyUI workflow JSONs
│   │
│   ├── types/                       # TypeScript definitions
│   ├── hooks/                       # React hooks
│   ├── utils/                       # Helper functions
│   └── styles/                      # CSS
│
├── public/
│   └── workflows/                   # ComfyUI workflow JSON files
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Map Editor Architecture

### User Workflow

```
1. User opens /editor
   ↓
2. Selects mode (Village, Town, City, Castle, Region)
   ↓
3. Draws layout with tools:
   - Blob Fill: Paint water, forest, fields
   - Road Tool: Draw curved roads, generate grids
   - Building Tool: Place houses, scatter structures
   ↓
4. Clicks "Generate Map"
   ↓
5. App exports layers → masks
   ↓
6. Uploads to ComfyUI
   ↓
7. Queues workflow (6-step: txt2img + 5× img2img)
   ↓
8. Displays live previews via WebSocket
   ↓
9. Final map ready
   ↓
10. User clicks "Preview VTT"
    ↓
11. Converts masks → walls (for collision/lighting)
    ↓
12. User clicks "Save & Open in VTT"
    ↓
13. Saves to IndexedDB, navigates to /vtt
```

### Drawing Tools

#### 1. Blob Fill Tool
**Purpose**: Paint organic terrain (water, forests, fields)

```typescript
// src/engine/editor/tools/BlobFillTool.ts
class BlobFillTool {
  private mode: 'water' | 'forest' | 'fields';
  private brushSize = 50;
  private roughness = 0.3;
  
  // User clicks and drags
  onDrag(point: Point) {
    const blob = this.generateOrganicBlob(point, this.brushSize);
    this.addToLayer(blob, this.mode);
  }
  
  // Uses Perlin noise for organic edges
  private generateOrganicBlob(center: Point, radius: number): Polygon {
    // Generate irregular shape with noise
    // Apply Chaikin smoothing
    // Return polygon
  }
}
```

**Features**:
- Click-drag to paint organic shapes
- Adjustable brush size (10-200px)
- Roughness control (0.0-1.0)
- Smooth edges (Chaikin algorithm)
- Flood fill mode (click enclosed area)
- Eraser mode

#### 2. Road Tool
**Purpose**: Draw roads with Bezier curves + procedural generation

```typescript
// src/engine/editor/tools/RoadTool.ts
class RoadTool {
  private mode: 'manual' | 'grid' | 'organic' | 'radial';
  private width = 6; // 6px for SD generation
  
  // Manual: User clicks waypoints
  onClick(point: Point) {
    this.points.push(point);
    if (this.points.length >= 2) {
      const curve = this.createSmoothCurve(this.points);
      this.renderRoad(curve);
    }
  }
  
  // Grid: Generate city grid
  generateGrid(bounds: Rectangle, spacing: number) {
    // Create perpendicular roads
  }
  
  // Organic: L-system branching
  generateOrganicRoads(center: Point, density: number) {
    // L-system: F[+F][-F]F (branching pattern)
  }
  
  // Radial: Roads from center
  generateRadialRoads(center: Point, count: number) {
    // Spokes radiating from center
  }
}
```

**Features**:
- **Manual Mode**: Click waypoints, auto-smooth Bezier
- **Grid Mode**: Generate rectangular city grid (spacing: 60-120px)
- **Organic Mode**: L-system branching (villages)
- **Radial Mode**: Spokes from center (town squares)
- Snap to endpoints (auto-connect)
- Width presets: 4px (paths), 6px (roads), 8px (main roads)

#### 3. Building Tool
**Purpose**: Place buildings with intelligent snapping

```typescript
// src/engine/editor/tools/BuildingTool.ts
class BuildingTool {
  private mode: 'single' | 'line' | 'area' | 'scatter';
  
  // Single: Drag-drop with road snapping
  onDrop(position: Point) {
    const road = this.findNearestRoad(position);
    if (road) {
      const snappedPos = road.closestPoint(position);
      const rotation = road.getAngleAt(snappedPos);
      this.placeBuilding(snappedPos, rotation);
    }
  }
  
  // Line: Place along road
  placeBuildingsAlongRoad(road: Road, spacing: number, side: 'left' | 'right' | 'both') {
    // Place buildings at intervals along road
    // Apply random pattern variations
  }
  
  // Area: Fill polygon with buildings
  fillAreaWithBuildings(polygon: Polygon, density: number) {
    // Grid-based placement inside polygon
  }
  
  // Scatter: Poisson disc distribution
  scatterBuildings(area: Polygon, count: number) {
    // Random but evenly distributed
  }
}
```

**Features**:
- **Single Mode**: Drag-drop, snaps to roads
- **Line Mode**: Click road → auto-place along road
- **Area Mode**: Select polygon → fill with buildings
- **Scatter Mode**: Poisson disc random placement
- 20+ building patterns (houses, shrines, barracks, etc.)
- Random variation (size ±10%, rotation)
- Smart spacing (never overlap)

### Building Pattern Library

```typescript
// src/data/patterns/buildings.ts
interface BuildingPattern {
  id: string;
  name: string;
  category: 'residential' | 'commercial' | 'religious' | 'military';
  width: number;
  height: number;
  shape: 'rect' | 'L' | 'T' | 'U' | 'compound';
  variations: {
    sizeRange: [number, number];
    rotationLocked?: boolean;
    features?: {
      courtyard?: number;  // Probability 0-1
      garden?: number;
      fence?: number;
      gate?: number;
    };
  };
}

export const BUILDING_PATTERNS: BuildingPattern[] = [
  {
    id: 'peasant_house',
    name: 'Peasant House',
    category: 'residential',
    width: 25,
    height: 25,
    shape: 'rect',
    variations: {
      sizeRange: [0.8, 1.2],
      rotationLocked: true,
      features: { garden: 0.3 }
    }
  },
  {
    id: 'samurai_estate',
    name: 'Samurai Estate',
    category: 'residential',
    width: 60,
    height: 60,
    shape: 'compound',
    variations: {
      sizeRange: [1.0, 1.5],
      features: { courtyard: 0.9, garden: 0.7, fence: 1.0, gate: 1.0 }
    }
  },
  // ... 18+ more patterns
];
```

### Map Modes

Modes define preset configurations for different map types:

```typescript
// src/data/modes/village.ts
export const VILLAGE_MODE: ModePreset = {
  mode: 'village',
  canvasSize: [768, 768],
  gridSpacing: 0,  // No grid (organic layout)
  roadStyle: 'organic',
  buildingDensity: 0.3,
  allowedBuildings: [
    'peasant_house',
    'merchant_house',
    'shrine',
    'well'
  ],
  terrainTypes: ['water', 'forest', 'fields'],
  comfyWorkflow: 'village-workflow.json',
  prompts: {
    base: 'top-down, battlemap, japanese village, orthographic view, simple layout',
    negative: 'perspective, isometric, blur, european, medieval',
    perLayer: {
      roofs: '(japanese village:1.2), thatched roofs, (feudal japan:1.3)',
      roads: '(village roads:1.4), dirt paths, connected',
      water: 'lake, crystal water, natural',
      forest: 'lush trees, bushes, forest, natural',
      fields: '(rice fields:1.4), irrigation, summer'
    }
  }
};
```

**Available Modes**:
- **Village**: Organic roads, low density, thatched roofs
- **Town**: Mixed roads, medium density, tile roofs
- **City**: Grid roads, high density, ornate buildings
- **Castle**: Radial roads, fortifications, walls
- **Region**: Large scale, multiple settlements, trade routes

### ComfyUI Integration

#### Workflow Pipeline

```typescript
// src/services/comfyui/ComfyUIClient.ts
class ComfyUIClient {
  private baseUrl = 'http://localhost:8188';
  private ws: WebSocket;
  private clientId = crypto.randomUUID();
  
  // 1. Connect to ComfyUI WebSocket
  connect(onMessage: (msg: ComfyUIMessage) => void) {
    this.ws = new WebSocket(`ws://localhost:8188/ws?clientId=${this.clientId}`);
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      onMessage(message);
    };
  }
  
  // 2. Upload images (sketch + masks)
  async uploadImage(blob: Blob, filename: string) {
    const formData = new FormData();
    formData.append('image', blob, filename);
    
    await fetch(`${this.baseUrl}/upload/image`, {
      method: 'POST',
      body: formData
    });
  }
  
  // 3. Queue workflow
  async queueWorkflow(workflow: any, inputs: WorkflowInputs) {
    const processed = this.injectInputs(workflow, inputs);
    
    const response = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: processed,
        client_id: this.clientId
      })
    });
    
    const { prompt_id } = await response.json();
    return prompt_id;
  }
  
  // 4. Get preview image URLs
  getImageUrl(filename: string) {
    return `${this.baseUrl}/view?filename=${filename}`;
  }
}
```

#### Generation Flow

```
User clicks "Generate"
    ↓
1. Export layers as Blobs (not base64!)
   - Color sketch → B&W sketch (for ControlNet)
   - Extract masks (water, roads, buildings, etc.)
    ↓
2. Upload all images to ComfyUI
   - user_sketch.png
   - mask_roofs.png
   - mask_roads.png
   - mask_water.png
   - mask_forest.png
   - mask_fields.png
    ↓
3. Load workflow JSON (based on mode)
   - village-workflow.json
   - Inject uploaded filenames
    ↓
4. Queue workflow (HTTP POST)
    ↓
5. WebSocket receives events:
   - 'progress': { value: 15, max: 25 }
   - 'executing': { node: '3' }  (which step)
   - 'executed': { output: { images: [...] } }
    ↓
6. Display preview images as they arrive
    ↓
7. Final image ready
```

### Mask Generation

Convert colored editor canvas to black & white masks:

```typescript
// src/services/export/MaskGenerator.ts
class MaskGenerator {
  // Generate separate mask for each terrain type
  async generateMasks(coloredCanvas: HTMLCanvasElement): Promise<Masks> {
    const ctx = coloredCanvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Color definitions
    const colors = {
      roofs: [255, 0, 0],      // Red
      roads: [139, 69, 19],    // Brown
      water: [0, 0, 255],      // Blue
      forest: [0, 128, 0],     // Green
      fields: [255, 255, 0]    // Yellow
    };
    
    const masks: Masks = {};
    
    for (const [name, rgb] of Object.entries(colors)) {
      masks[name] = await this.createMask(imageData, rgb);
    }
    
    return masks;
  }
  
  // Create B&W mask for specific color
  private async createMask(imageData: ImageData, targetRGB: number[]): Promise<Blob> {
    const maskCanvas = document.createElement('canvas');
    const ctx = maskCanvas.getContext('2d')!;
    const maskData = ctx.createImageData(imageData.width, imageData.height);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const matches = 
        Math.abs(imageData.data[i] - targetRGB[0]) <= 10 &&
        Math.abs(imageData.data[i+1] - targetRGB[1]) <= 10 &&
        Math.abs(imageData.data[i+2] - targetRGB[2]) <= 10;
      
      // White where color matches, black elsewhere
      const value = matches ? 255 : 0;
      maskData.data[i] = value;
      maskData.data[i+1] = value;
      maskData.data[i+2] = value;
      maskData.data[i+3] = 255;
    }
    
    ctx.putImageData(maskData, 0, 0);
    
    return new Promise(resolve => {
      maskCanvas.toBlob(blob => resolve(blob!), 'image/png');
    });
  }
}
```

---

## Wall Extraction System

After map generation, convert masks to wall polygons for VTT collision and lighting:

### Mask → Walls Pipeline

```typescript
// src/services/walls/MaskToWalls.ts
class MaskToWallConverter {
  // Main conversion
  async convertMaskToWalls(maskBlob: Blob, type: 'building' | 'terrain'): Promise<Wall[]> {
    const imageData = await this.blobToImageData(maskBlob);
    
    // 1. Edge detection (Marching Squares)
    const edges = this.detectEdges(imageData);
    
    // 2. Trace contours
    const contours = this.traceContours(edges);
    
    // 3. Simplify (Douglas-Peucker)
    const simplified = this.simplifyPolygons(contours, 2.0);
    
    // 4. Convert to wall segments
    const walls = this.polygonsToWalls(simplified, type);
    
    return walls;
  }
  
  // Marching Squares edge detection
  private detectEdges(imageData: ImageData): Point[][] {
    // Scan 2×2 cells, detect boundary pixels
    // Build contours from edge pixels
  }
  
  // Douglas-Peucker simplification
  private simplifyPolygons(polygons: Point[][], tolerance: number): Point[][] {
    // Reduce point count while preserving shape
    // tolerance = 2.0px is good balance
  }
  
  // Convert to wall line segments
  private polygonsToWalls(polygons: Point[][], type: string): Wall[] {
    const walls: Wall[] = [];
    
    for (const polygon of polygons) {
      for (let i = 0; i < polygon.length - 1; i++) {
        walls.push({
          id: crypto.randomUUID(),
          type,
          start: polygon[i],
          end: polygon[i + 1],
          blocksMovement: true,
          blocksLight: type === 'building',  // Buildings block light
          blocksSound: type === 'building'
        });
      }
    }
    
    return walls;
  }
}
```

### Wall Types

```typescript
interface Wall {
  id: string;
  type: 'building' | 'terrain' | 'road';
  start: Point;
  end: Point;
  blocksMovement: boolean;  // Collision detection
  blocksLight: boolean;     // Light occlusion
  blocksSound: boolean;     // Sound propagation (future)
  door?: boolean;           // Passable when open
  window?: boolean;         // Transparent to light
}
```

---

## VTT Game Architecture

### User Workflow

```
1. User navigates to /vtt/game-id
   ↓
2. HTTP: Fetch initial game state
   GET /api/game/game-id
   ↓
3. WebSocket: Connect for real-time updates
   ws://backend:3000/ws
   ↓
4. Render map with PixiJS:
   - Load map image
   - Load walls (pre-computed from editor)
   - Set up lighting
   - Place tokens
   ↓
5. User interacts:
   - Drag tokens (collision detection)
   - Roll dice (sync to Discord)
   - Chat messages
   - Combat tracker
   ↓
6. All actions sync via WebSocket
   - Other players see updates in real-time
   - Discord channel shows rolls/events
```

### VTT Components

#### Token System

```typescript
// src/engine/vtt/tokens/Token.ts
class Token extends PIXI.Sprite {
  id: string;
  characterId: string;
  position: Point;
  rotation: number;
  scale: number;
  visible: boolean;
  
  // Drag handlers
  onDragStart() { /* ... */ }
  onDragMove(newPos: Point) {
    // Check collision with walls
    if (!wallLayer.checkCollision(this.position, newPos)) {
      this.moveTo(newPos);
      // Send to backend
      websocket.send({ type: 'TOKEN_MOVE', data: { tokenId: this.id, position: newPos } });
    }
  }
  onDragEnd() { /* ... */ }
}
```

#### Collision Detection

```typescript
// src/engine/walls/WallLayer.ts
class WallLayer {
  private walls: Wall[];
  private spatialHash: WallSpatialHash;
  
  // Check if movement path intersects any wall
  checkCollision(start: Point, end: Point): boolean {
    // Only check nearby walls (spatial hash optimization)
    const nearbyWalls = this.spatialHash.queryLine(start, end);
    
    for (const wall of nearbyWalls) {
      if (!wall.blocksMovement) continue;
      
      if (this.lineIntersectsLine(start, end, wall.start, wall.end)) {
        return true;  // Collision detected
      }
    }
    
    return false;  // Path is clear
  }
  
  // Line-line intersection test
  private lineIntersectsLine(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
    // Standard 2D line intersection algorithm
  }
}
```

#### Performance Optimization

```typescript
// src/engine/walls/WallSpatialHash.ts
class WallSpatialHash {
  private grid: Map<string, Wall[]>;
  private cellSize = 64;  // 64px cells
  
  // Insert wall into grid
  insert(wall: Wall) {
    const cells = this.getAffectedCells(wall);
    for (const cell of cells) {
      const key = `${cell.x},${cell.y}`;
      if (!this.grid.has(key)) this.grid.set(key, []);
      this.grid.get(key)!.push(wall);
    }
  }
  
  // Query walls near a point (10x faster than checking all walls!)
  queryNearby(point: Point, radius: number): Wall[] {
    const cells = this.getCellsInRadius(point, radius);
    const walls: Wall[] = [];
    
    for (const cell of cells) {
      const key = `${cell.x},${cell.y}`;
      if (this.grid.has(key)) {
        walls.push(...this.grid.get(key)!);
      }
    }
    
    return [...new Set(walls)];  // Deduplicate
  }
}
```

---

## Dynamic Lighting System

### Ray-Casting Lights

```typescript
// src/engine/lighting/LightingLayer.ts
class DynamicLightingLayer extends PIXI.Container {
  private walls: Wall[];
  private lights: Light[];
  private lightingTexture: PIXI.RenderTexture;
  
  // Add light source
  addLight(light: Light) {
    this.lights.push(light);
    this.update();
  }
  
  // Main lighting calculation (called each frame)
  update() {
    const graphics = new PIXI.Graphics();
    
    // Start with darkness
    graphics.beginFill(0x000000, 0.8);
    graphics.drawRect(0, 0, this.width, this.height);
    graphics.endFill();
    
    // Draw each light's visible area
    for (const light of this.lights) {
      const visiblePolygon = this.calculateVisibilityPolygon(light);
      this.drawLight(graphics, light, visiblePolygon);
    }
    
    // Render to texture, apply as multiply blend
    app.renderer.render(graphics, { renderTexture: this.lightingTexture });
  }
  
  // Ray-casting to find visible area
  private calculateVisibilityPolygon(light: Light): Point[] {
    const rays: Point[] = [];
    const rayCount = 360;  // One ray per degree
    
    for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI * 2) / rayCount) {
      const direction = { x: Math.cos(angle), y: Math.sin(angle) };
      
      // Find closest wall intersection
      let closestHit = null;
      let closestDist = light.radius;
      
      for (const wall of this.walls) {
        if (!wall.blocksLight) continue;
        
        const hit = this.rayIntersectsWall(light.position, direction, wall);
        if (hit) {
          const dist = this.distance(light.position, hit);
          if (dist < closestDist) {
            closestHit = hit;
            closestDist = dist;
          }
        }
      }
      
      // Ray endpoint (wall or max radius)
      rays.push(closestHit || {
        x: light.position.x + direction.x * light.radius,
        y: light.position.y + direction.y * light.radius
      });
    }
    
    return rays;
  }
}

interface Light {
  id: string;
  position: Point;
  radius: number;      // Max light distance
  color: number;       // 0xFFAA00 (warm torch)
  intensity: number;   // 0.0 - 1.0
  type: 'torch' | 'lantern' | 'candle' | 'daylight';
}
```

### Features

- **Ray-casting**: 360° rays from each light source
- **Wall Occlusion**: Buildings cast shadows
- **Real-time**: Updates every frame (60 FPS)
- **Multiple Lights**: Supports unlimited light sources
- **Color & Intensity**: Customizable per light
- **Fog of War**: Can be combined with visibility system

---

## State Management

### Zustand Stores

```typescript
// src/store/editorStore.ts
interface EditorState {
  // Canvas
  mode: MapMode;  // 'village' | 'town' | 'city' | etc.
  canvasSize: [number, number];
  zoom: number;
  pan: Point;
  
  // Tools
  activeTool: Tool;
  toolOptions: Record<string, any>;
  
  // Map data
  terrain: TerrainBlob[];
  roads: Road[];
  buildings: Building[];
  
  // Selection
  selectedObjects: string[];
  
  // History (undo/redo)
  history: EditorState[];
  historyIndex: number;
  
  // Generation
  generationStatus: GenerationStatus;
  prompts: PromptSet;
  
  // Actions
  setMode: (mode: MapMode) => void;
  selectTool: (tool: Tool) => void;
  addRoad: (road: Road) => void;
  addBuilding: (building: Building) => void;
  undo: () => void;
  redo: () => void;
  exportToComfyUI: () => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // ... state and actions
}));
```

```typescript
// src/store/vttStore.ts
interface VTTState {
  // Game
  gameId: string;
  map: MapData | null;
  walls: Wall[];
  
  // Entities
  tokens: Token[];
  characters: Character[];
  
  // Combat
  combat: CombatState | null;
  
  // Lighting
  lights: Light[];
  
  // WebSocket
  connected: boolean;
  
  // Actions
  moveToken: (tokenId: string, position: Point) => void;
  rollDice: (expression: string) => void;
  sendChatMessage: (message: string) => void;
}

export const useVTTStore = create<VTTState>((set, get) => ({
  // ... state and actions
}));
```

---

## Storage & Persistence

### IndexedDB

```typescript
// src/services/storage/IndexedDBStore.ts
class ProjectStore {
  private db: IDBDatabase;
  
  // Save project (map + layout + settings)
  async saveProject(project: Project) {
    const tx = this.db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    
    await store.put({
      id: project.id,
      name: project.name,
      mode: project.mode,
      canvas: await this.canvasToBlob(project.canvas),
      objects: project.objects,
      settings: project.settings,
      createdAt: project.createdAt,
      updatedAt: new Date()
    });
  }
  
  // Load project
  async loadProject(id: string): Promise<Project> {
    const tx = this.db.transaction('projects', 'readonly');
    const store = tx.objectStore('projects');
    const data = await store.get(id);
    
    return {
      ...data,
      canvas: await this.blobToCanvas(data.canvas)
    };
  }
  
  // List all projects
  async listProjects(): Promise<ProjectMetadata[]> {
    const tx = this.db.transaction('projects', 'readonly');
    const store = tx.objectStore('projects');
    const projects = await store.getAll();
    
    return projects.map(p => ({
      id: p.id,
      name: p.name,
      mode: p.mode,
      thumbnail: p.thumbnail,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
  }
}
```

**Why IndexedDB?**
- ✅ Store large Blobs efficiently (no 5-10MB limit like localStorage)
- ✅ Async API (doesn't block UI)
- ✅ ~50% of disk space available
- ✅ Native browser support

**Never use base64 for storage!**
- ❌ 33% larger than Blob
- ❌ Slower encoding/decoding
- ❌ Blocks main thread

---

## Performance Optimizations

### PixiJS Optimizations

```typescript
// Use object pooling for frequently created/destroyed objects
class TokenPool {
  private pool: Token[] = [];
  
  acquire(): Token {
    return this.pool.pop() || new Token();
  }
  
  release(token: Token) {
    token.reset();
    this.pool.push(token);
  }
}

// Use sprite batching
const batchRenderer = new PIXI.BatchRenderer();

// Cull off-screen objects
viewport.on('moved', () => {
  const bounds = viewport.getVisibleBounds();
  for (const token of tokens) {
    token.visible = bounds.contains(token.x, token.y);
  }
});
```

### Bundle Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pixi': ['pixi.js'],
          'editor': ['./src/engine/editor'],
          'vtt': ['./src/engine/vtt']
        }
      }
    }
  }
});
```

**Result**: Editor code only loads on `/editor` route, VTT code only on `/vtt` route.

---

## Development Workflow

### Running Locally

```bash
# Install dependencies
pnpm install

# Start dev server (HMR enabled)
cd packages/frontend
pnpm dev

# Open browser
# http://localhost:5173/editor
# http://localhost:5173/vtt
```

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## Future Enhancements

### Phase 4.5: Advanced Editor Features
- [ ] Multi-layer support (background, mid, foreground)
- [ ] Custom brush shapes
- [ ] Pattern editor (create custom buildings)
- [ ] Terrain height maps (3D feel)
- [ ] Animation timeline (moving water, wind)

### Phase 5.5: Advanced VTT Features
- [ ] Animated tokens (sprite sheets)
- [ ] Particle effects (fire, smoke, magic)
- [ ] Sound effects (ambient, combat)
- [ ] Measurement tools (rulers, area templates)
- [ ] Conditions/status icons on tokens
- [ ] Turn order tracker (automated)

---

## Tech Debt & Considerations

### Known Limitations
- **Mobile**: Not optimized for touch/mobile (desktop-first)
- **Browser Support**: Requires modern browsers (WebGL 2.0, ES2020)
- **File Size**: Large maps (>2048×2048) may cause performance issues
- **Undo/Redo**: Limited to 50 steps (memory constraint)

### Security
- **XSS**: All user input sanitized
- **CORS**: ComfyUI must allow frontend origin
- **Storage**: IndexedDB is per-origin, can't share between domains

---

## Testing Strategy

### Manual Testing
- Test each tool (blob fill, roads, buildings)
- Verify ComfyUI connection (upload, queue, preview)
- Test wall extraction (collision, lighting)
- Verify WebSocket sync (VTT ↔ Backend)

### Future: Automated Testing
- **Vitest**: Unit tests for utilities, geometry
- **Playwright**: E2E tests for user workflows
- **Visual Regression**: Percy or Chromatic

---

## Resources

### Libraries Documentation
- **Pixi.js**: https://pixijs.com/guides
- **React Router**: https://reactrouter.com/
- **Zustand**: https://github.com/pmndrs/zustand
- **ComfyUI API**: https://github.com/comfyanonymous/ComfyUI

### Algorithms
- **Marching Squares**: https://en.wikipedia.org/wiki/Marching_squares
- **Douglas-Peucker**: https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
- **Poisson Disc**: https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
- **L-Systems**: https://en.wikipedia.org/wiki/L-system

---

**Ready to build the ultimate L5R map editor + VTT!** 🎨🗾🎲
