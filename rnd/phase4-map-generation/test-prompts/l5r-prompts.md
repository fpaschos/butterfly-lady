# L5R Battlemap Prompts

Ready-to-use prompts for generating **Legend of the Five Rings** battlemaps with Stable Diffusion.

**All prompts designed for**:
- Top-down orthogonal view (VTT-ready)
- Rokugani architecture (not European)
- Clear grid alignment
- Flat lighting for readability

---

## Quick Reference

| Type | Best For | Size | Time |
|------|----------|------|------|
| [Rural Naisō](#1-rural-nais-province) | Farmland, villages | 768×768 | ~2 min |
| [Urban Town](#2-urban-town-district) | Merchant districts, streets | 768×768 | ~2 min |
| [Military Dojo](#3-military-dojo-compound) | Training grounds, barracks | 768×768 | ~2 min |
| [Castle Courtyard](#4-castle-courtyard) | Fortifications, noble estates | 1024×1024 | ~4 min |
| [Forest Path](#5-forest-path-encounter) | Wilderness, ambush sites | 768×768 | ~2 min |
| [River Crossing](#6-river-crossing) | Bridges, ford encounters | 768×768 | ~2 min |
| [Mountain Pass](#7-mountain-pass-road) | Highland encounters | 768×768 | ~2 min |
| [Tea House](#8-tea-house-interior) | Social encounters, intrigue | 512×512 | ~1 min |
| [Temple Grounds](#9-temple-grounds) | Shrines, sacred sites | 768×768 | ~2 min |
| [Courtyard Garden](#10-courtyard-garden) | Noble estates, duels | 768×768 | ~2 min |

---

## Universal Negative Prompt

**Use this negative prompt with ALL L5R maps** to avoid European/fantasy aesthetics:

```
european architecture, medieval fantasy, stone castles, thatched roofs, 
half-timbered buildings, cobblestone streets, gothic, romanesque,
perspective view, isometric, 3d rendering, angled view,
characters, people, soldiers, peasants, anime faces,
text, watermark, signature, blurry, low quality, jpeg artifacts
```

Copy this once, use everywhere.

---

## Standard Settings

**Recommended for all prompts unless noted otherwise:**

| Setting | Value | Notes |
|---------|-------|-------|
| **Checkpoint** | DreamShaper_8 | Best for battlemaps |
| **Sampler** | DPM++ 2M Karras | Good quality/speed balance |
| **Steps** | 25 | Sufficient detail |
| **CFG Scale** | 6-7 | Not too strict |
| **Size** | 768×768 | Standard battlemap size |
| **Batch** | 1 | CPU is slow |

**ControlNet**: Use "L5R Battlemap" preset (see [`controlnet-presets.md`](controlnet-presets.md))

---

## 1. Rural Naisō Province

**Scenario**: Farmland village, roadside encounters, peasant homes.

### Positive Prompt

```
top-down tabletop rpg battlemap, rokugani rural naisō province,
wooden farmhouses with sliding shoji doors, thatched rice straw roofs,
packed earth roads, small stone shrine with red torii gate,
bamboo fences, rice paddies, vegetable gardens, well,
flat overhead lighting, clear readable layout, grid-aligned,
no perspective, orthogonal view
```

### Negative Prompt

Use [Universal Negative Prompt](#universal-negative-prompt)

### Settings

- **Size**: 768×768
- **Steps**: 25
- **CFG**: 6

### Expected Elements

- 3-5 wooden farmhouses
- Dirt roads connecting buildings
- Small shrine with torii
- Bamboo fencing
- Agricultural areas (paddies, gardens)
- Village well or water feature

### Good For

- Bandit ambushes
- Peasant village investigations
- Rural magistrate encounters
- Traveling between cities

---

## 2. Urban Town District

**Scenario**: Merchant district, town streets, shops and inns.

### Positive Prompt

```
top-down tabletop rpg battlemap, rokugani urban town district,
wooden shops with fabric awnings, tea houses, sake brewery,
narrow streets, paper lanterns hanging, stone well plaza,
wooden cart, barrel storage, merchant stalls,
flat overhead lighting, clear street layout, grid-aligned,
no perspective, orthogonal view
```

### Negative Prompt

Use [Universal Negative Prompt](#universal-negative-prompt)

**Additional**:
```
, busy crowds, market chaos, cluttered
```

### Settings

- **Size**: 768×768 or 1024×768 (wider for long streets)
- **Steps**: 25
- **CFG**: 6.5

### Expected Elements

- Multiple shop fronts
- 2-3 street intersections
- Central plaza or well
- Paper lanterns for atmosphere
- Merchant stalls/carts
- Storage areas (barrels, crates)

### Good For

- Urban combat
- Chase scenes
- Market investigations
- Inn/tea house encounters

---

## 3. Military Dojo Compound

**Scenario**: Samurai training grounds, bushi school.

### Positive Prompt

```
top-down tabletop rpg battlemap, rokugani military dojo compound,
large wooden training hall with open sides, tatami practice area,
weapon racks with bokken and yari, training dummies,
small living quarters, meditation garden with stone path,
wooden fence perimeter, cherry blossom tree,
flat overhead lighting, clear layout, grid-aligned,
no perspective, orthogonal view
```

### Negative Prompt

Use [Universal Negative Prompt](#universal-negative-prompt)

**Additional**:
```
, european training yard, castle bailey, stone buildings
```

### Settings

- **Size**: 768×768
- **Steps**: 25
- **CFG**: 7

### Expected Elements

- Main training hall (largest building)
- Open tatami practice area
- Weapon racks (visual detail)
- Small meditation garden
- Living quarters
- Wooden perimeter fence
- Cherry tree or garden feature

### Good For

- Dojo duels
- Training montages
- Assassin infiltrations
- School challenges

---

## 4. Castle Courtyard

**Scenario**: Noble estate, castle grounds, fortified areas.

### Positive Prompt

```
top-down tabletop rpg battlemap, rokugani castle courtyard,
stone foundation walls, wooden castle keep with curved tile roofs,
guard towers with shoji windows, gravel courtyard,
decorative stone garden, pine trees, stone lanterns,
wooden gates with iron reinforcement, patrol walkways,
flat overhead lighting, clear fortification layout, grid-aligned,
no perspective, orthogonal view
```

### Negative Prompt

Use [Universal Negative Prompt](#universal-negative-prompt)

**Additional**:
```
, european castle, stone towers, battlements, moat, drawbridge
```

### Settings

- **Size**: 1024×1024 (larger for castle scale)
- **Steps**: 30 (more detail needed)
- **CFG**: 7

### Expected Elements

- Main keep or castle building
- Stone foundation (not all stone)
- Wooden defensive structures
- Guard towers
- Decorative gardens
- Gravel/stone courtyard
- Defensive walls and gates

### Good For

- Castle defense scenarios
- Noble intrigue
- Assassination attempts
- Formal duels
- Court encounters

### ⚠️ Note

Generation time: ~4 minutes at 1024×1024 on CPU.

---

## 5. Forest Path Encounter

**Scenario**: Wilderness road, forest ambush, traveling encounters.

### Positive Prompt

```
top-down tabletop rpg battlemap, rokugani forest path,
narrow dirt road through dense forest, pine and bamboo trees,
rocky outcrops, fallen logs, small stream crossing,
forest undergrowth, natural cover, clear path through center,
flat overhead lighting, clear terrain features, grid-aligned,
no perspective, orthogonal view
```

### Negative Prompt

Use [Universal Negative Prompt](#universal-negative-prompt)

**Additional**:
```
, european forest, oak trees, deciduous forest, mushrooms
```

### Settings

- **Size**: 768×768
- **Steps**: 25
- **CFG**: 6

### Expected Elements

- Central dirt path
- Dense forest on sides
- Pine/bamboo appropriate to region
- Rocky areas for cover
- Stream or natural feature
- Fallen logs (cover/obstacles)

### Good For

- Bandit ambushes
- Wilderness travel
- Hunting scenarios
- Forest spirits/yokai encounters

---

## 6. River Crossing

**Scenario**: Bridge encounters, ford crossings, riverside combat.

### Positive Prompt

```
top-down tabletop rpg battlemap, rokugani river crossing,
wooden arched bridge with red railings, flowing river,
stone riverbank reinforcement, stepping stones ford,
willow trees, bamboo groves along shore, small shrine,
clear water flow direction, grid-aligned,
flat overhead lighting, no perspective, orthogonal view
```

### Negative Prompt

Use [Universal Negative Prompt](#universal-negative-prompt)

**Additional**:
```
, european bridge, stone arch bridge, medieval bridge
```

### Settings

- **Size**: 768×1024 (taller for river flow)
- **Steps**: 25
- **CFG**: 6.5

### Expected Elements

- Wooden bridge (red railing detail)
- Flowing river (clear direction)
- Alternative ford crossing
- Riverside vegetation (willow, bamboo)
- Stone reinforced banks
- Small shrine or cultural marker

### Good For

- Bridge duels
- River crossing ambushes
- Toll encounters
- Water spirit encounters

---

## 7. Mountain Pass Road

**Scenario**: Highland road, mountain encounter, cliff paths.

### Positive Prompt

```
top-down tabletop rpg battlemap, rokugani mountain pass road,
narrow switchback road, rocky cliff faces, loose scree,
small stone shrine cairn, pine trees on slopes,
steep drop-offs, mountain stream, rope bridge,
clear elevation changes, grid-aligned,
flat overhead lighting, no perspective, orthogonal view
```

### Negative Prompt

Use [Universal Negative Prompt](#universal-negative-prompt)

**Additional**:
```
, european alps, snow peaks, european mountain
```

### Settings

- **Size**: 768×768
- **Steps**: 25
- **CFG**: 7

### Expected Elements

- Narrow winding road
- Cliff faces (visual, not functional in 2D)
- Rocky terrain
- Pine trees on slopes
- Rope bridge or precarious crossing
- Mountain shrine
- Elevation indicators (visual texture)

### Good For

- Mountain ambushes
- Treacherous travel
- Avalanche/rockslide encounters
- Mountain monastery access

### ⚠️ Note

2D top-down limits elevation representation. Use visual cues (darker rock for cliffs).

---

## 8. Tea House Interior

**Scenario**: Social intrigue, indoor encounters, formal meetings.

### Positive Prompt

```
top-down tabletop rpg battlemap, rokugani tea house interior,
tatami mat rooms, sliding shoji paper doors, low wooden tables,
floor cushions zabuton, tokonoma alcove with scroll,
small indoor garden view, paper lanterns, wooden pillars,
clear room divisions, grid-aligned,
soft overhead lighting, no perspective, orthogonal view
```

### Negative Prompt

Use [Universal Negative Prompt](#universal-negative-prompt)

**Additional**:
```
, european interior, furniture, chairs, stone walls, fireplace
```

### Settings

- **Size**: 512×512 (smaller interior)
- **Steps**: 25
- **CFG**: 6

### Expected Elements

- 2-3 tatami rooms
- Shoji sliding doors
- Low tables with cushions
- Tokonoma alcove (cultural detail)
- Paper lanterns
- Indoor garden view (engawa)
- Wooden support pillars

### Good For

- Social intrigue
- Assassination attempts (indoor)
- Formal meetings
- Tea ceremony encounters
- Geisha house intrigue

### ⚠️ Note

Smaller size = faster generation (~1 min).

---

## 9. Temple Grounds

**Scenario**: Shrine/temple, sacred sites, monk encounters.

### Positive Prompt

```
top-down tabletop rpg battlemap, rokugani buddhist temple grounds,
wooden temple hall with curved tile roof, stone pagoda,
red torii gates, stone lanterns, gravel path,
meditation garden with raked sand, koi pond, cherry trees,
small monk quarters, incense burner, bell tower,
flat overhead lighting, sacred layout, grid-aligned,
no perspective, orthogonal view
```

### Negative Prompt

Use [Universal Negative Prompt](#universal-negative-prompt)

**Additional**:
```
, european church, cathedral, stone temple, greek temple
```

### Settings

- **Size**: 768×768
- **Steps**: 25
- **CFG**: 7

### Expected Elements

- Main temple hall
- Torii gates (entrance)
- Stone pagoda
- Meditation garden (raked sand)
- Koi pond
- Stone lanterns (decorative)
- Cherry or sacred tree
- Monk quarters

### Good For

- Spiritual quests
- Monk encounters
- Cursed temple investigations
- Sacred duels
- Sanctuary seeking

---

## 10. Courtyard Garden

**Scenario**: Noble estate garden, formal duels, private meetings.

### Positive Prompt

```
top-down tabletop rpg battlemap, rokugani courtyard garden,
raked gravel zen garden, stepping stone path,
ornamental rocks, manicured pine trees, bamboo fence,
small koi pond with wooden bridge, stone lanterns,
wooden engawa walkway, shoji screens backdrop,
symmetrical design, grid-aligned,
flat overhead lighting, no perspective, orthogonal view
```

### Negative Prompt

Use [Universal Negative Prompt](#universal-negative-prompt)

**Additional**:
```
, european garden, flower beds, fountains, hedgemaze
```

### Settings

- **Size**: 768×768
- **Steps**: 25
- **CFG**: 6.5

### Expected Elements

- Zen raked gravel
- Stepping stone path
- Ornamental rocks (garden design)
- Manicured trees (pine, maple)
- Koi pond with bridge
- Stone lanterns
- Engawa (wooden walkway)
- Bamboo fencing

### Good For

- Formal duels
- Private meetings
- Contemplation scenes
- Garden party intrigue
- Assassination attempts

---

## Prompt Engineering Tips

### Emphasizing Keywords

Use `(keyword:weight)` to emphasize important elements:

```
(top-down view:1.3), (orthogonal:1.2), rokugani architecture
```

Weights:
- **1.1**: Slight emphasis
- **1.2-1.3**: Strong emphasis
- **1.5+**: Very strong (can distort)

### De-emphasizing Elements

Use `(keyword:0.8)` to reduce unwanted tendencies:

```
wooden buildings, (stone:0.7), (grey:0.8)
```

### Combining Related Terms

Group similar concepts:

```
[japanese|rokugani|samurai era] architecture
```

SD will vary which term dominates per generation.

### Adding Seasonal Flavor

**Spring**:
```
, cherry blossoms, pink petals, spring green
```

**Summer**:
```
, lush green, humid atmosphere, summer heat
```

**Autumn**:
```
, red maple leaves, autumn colors, golden light
```

**Winter**:
```
, light snow dusting, bare branches, winter cold
```

---

## Common Issues & Solutions

### Maps Look European

**Problem**: Stone castles, medieval aesthetic.

**Solutions**:
1. Add `(rokugani:1.2)` or `(japanese feudal:1.2)`
2. Strengthen negative prompt: `(european:1.3), (medieval:1.3)`
3. Use DreamShaper 8 model (better at Asian aesthetics)
4. Add specific details: `sliding shoji doors`, `curved tile roofs`, `bamboo`

### Too Much Perspective

**Problem**: 3D angled view instead of flat.

**Solutions**:
1. Add: `(top-down view:1.3), (orthogonal:1.2), (flat map:1.2)`
2. Negative: `(perspective:1.3), (isometric:1.3), (3d:1.3)`
3. Increase ControlNet Unit 0 weight to 1.2 (forces flat structure)

### Not Enough Buildings

**Problem**: Sparse map, few structures.

**Solutions**:
1. Be specific: `5 wooden buildings`, `multiple shops`, `dense district`
2. Lower CFG Scale to 5.5 (more creative freedom)
3. Add: `detailed layout`, `complex structures`

### Buildings Too Similar

**Problem**: All buildings look the same.

**Solutions**:
1. Vary descriptions: `large dojo hall, small shrine, merchant shop, storage shed`
2. Add functional details: `shop with awning, house with garden, storage with barrels`
3. Generate multiple batches, cherry-pick best variety

### Colors Too Muted

**Problem**: Grey/brown, no color variety.

**Solutions**:
1. Add color hints: `red torii gates`, `blue roof tiles`, `green bamboo`
2. Add: `colorful`, `vibrant`, `detailed textures`
3. Adjust in post (Photoshop, GIMP) for VTT use

### Too Cluttered / Noisy

**Problem**: Hard to read, too many details.

**Solutions**:
1. Add: `clean layout`, `clear paths`, `simple design`, `readable`
2. Increase CFG Scale to 7.5 (more prompt adherence)
3. Negative: `cluttered`, `busy`, `chaotic`, `messy`

---

## Advanced Techniques

### Creating Map Series

Generate consistent style across campaign:

1. **Save successful prompt** as base template
2. **Lock seed** (note seed number from successful generation)
3. **Vary only location details**:
   - Base: `rokugani [LOCATION], [STRUCTURES], flat lighting`
   - Swap `[LOCATION]`: urban district → rural village → dojo compound
4. **Keep same settings** (steps, CFG, size, sampler)

Result: Different maps with consistent art style.

### Hybrid Maps (Interior + Exterior)

Generate compound encounters:

```
top-down tabletop rpg battlemap, rokugani compound,
courtyard garden (exterior), tea house interior rooms with tatami,
sliding doors connecting spaces, partial walls, 
mixed indoor outdoor view, clear room divisions,
flat overhead lighting, grid-aligned, no perspective
```

Good for:
- Mansion infiltrations
- Indoor/outdoor chase scenes
- Multi-room encounters

### Seasonal Variations

Generate same map in different seasons:

1. Save base prompt
2. Add seasonal tags: `cherry blossoms spring` → `autumn red maple` → `winter snow`
3. Keep same ControlNet sketch (if using)
4. Optional: lock seed for similar composition

Good for campaigns with time passage.

### Grid Overlay (Post-Processing)

Make VTT-ready:

1. Generate map without grid
2. Import to image editor (Photoshop, GIMP, Krita)
3. Add grid overlay layer (5ft = 1 square)
4. Set grid opacity: 20-30%
5. Export for VTT (PNG with transparency)

Standard VTT grid: 70px per square for 1400×1400px map.

---

## Batch Testing Workflow

When testing new prompts:

1. **Generate 4 variations**:
   - Same prompt, vary CFG: 5, 6, 7, 8
   - Compare adherence vs creativity

2. **Pick best CFG**, then vary steps:
   - Same prompt+CFG, vary steps: 15, 20, 25, 30
   - Compare quality vs time

3. **Lock successful settings**, vary seed:
   - Generate 4-8 with same prompt+settings
   - Pick best composition

4. **Document**:
   - Save successful prompt to this file
   - Note seed, settings, generation time
   - Screenshot for reference

---

## Testing Checklist

Before using a prompt in production:

- [ ] Generated map is top-down (no perspective)
- [ ] Architecture is Rokugani (not European)
- [ ] Map is readable (clear paths, distinct buildings)
- [ ] Appropriate scale (buildings not too small/large)
- [ ] Grid-alignable (structures roughly rectangular)
- [ ] No characters/text present
- [ ] Colors appropriate (not too dark/light)
- [ ] Generation time acceptable
- [ ] Consistent style with previous maps (if series)

---

## Contributing Prompts

Found a great prompt? Add it here:

### Template

```markdown
## [Number]. [Map Name]

**Scenario**: [Description of use case]

### Positive Prompt
[Prompt text]

### Negative Prompt
Use [Universal Negative Prompt](#universal-negative-prompt)

**Additional**:
[Any additional negative prompt terms]

### Settings
- **Size**: [dimensions]
- **Steps**: [number]
- **CFG**: [number]

### Expected Elements
- [Element 1]
- [Element 2]
...

### Good For
- [Use case 1]
- [Use case 2]
...
```

---

## Resources

### L5R Reference Material

- **L5R 4th Edition Core Rulebook**: Building descriptions, cultural notes
- **L5R Emerald Empire**: Detailed cultural and architectural information
- **Historical Japan**: Heian/Sengoku period architecture (visual reference)

### Prompt Engineering

- [Stable Diffusion Prompt Book](https://openart.ai/promptbook)
- [AUTOMATIC1111 Prompt Editing](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Features#prompt-editing)

### VTT Integration

When ready to use maps in VTT:
1. Add grid overlay (70px per square standard)
2. Export as PNG (lossless)
3. Upload to VTT (Roll20, Foundry, etc.)
4. Set grid alignment (usually auto-detects)

---

## Next Steps

1. **Test prompts** from this library
2. **Document successes** (save seeds, settings)
3. **Iterate variations** for your campaign
4. **Build map library** for common encounter types
5. **Share findings** for future Phase 4 integration

Happy map generation! 🗺️⚔️
