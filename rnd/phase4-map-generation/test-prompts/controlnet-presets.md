# ControlNet Presets for L5R Battlemaps

This document contains **tested ControlNet configurations** optimized for generating L5R battlemaps with Stable Diffusion.

---

## Preset: "L5R Battlemap"

**Purpose**: Generate top-down, VTT-ready battlemaps with Rokugani architecture.

**Workflow**:
1. **Scribble** → Convert rough sketch to structured layout
2. **Lineart** → Clean up architectural details
3. **Tile** → (Optional) Upscale for larger maps

---

## ControlNet Unit 0: Layout Structure

**Primary control for map layout from hand-drawn sketches.**

### Settings

| Setting | Value | Notes |
|---------|-------|-------|
| **Enable** | ✅ Yes | Primary control |
| **Preprocessor** | `scribble_xdog` | Converts sketches to clean lines |
| **Model** | `control_v11p_sd15_scribble` | SD 1.5 scribble control |
| **Weight** | `1.1` | Strong influence on layout |
| **Guidance Start** | `0.0` | Active from beginning |
| **Guidance End** | `1.0` | Active until end |
| **Control Mode** | `ControlNet is more important` | Prioritize structure |
| **Resize Mode** | `Crop and Resize` | Fit to generation size |

### How to Use

1. **Without input image**: Let SD generate layout based on prompt
2. **With sketch**: Upload hand-drawn map sketch (roads, buildings, walls)
   - Use simple black lines on white background
   - Focus on key structures (buildings, paths, walls)
   - Don't worry about details (preprocessor cleans it up)

### When to Adjust Weight

- **1.0**: Standard adherence to sketch
- **1.1-1.2**: Stronger adherence (recommended for complex layouts)
- **0.8-0.9**: More creative freedom, less strict to sketch

---

## ControlNet Unit 1: Architecture Cleanup

**Secondary control for refining architectural details and clean lines.**

### Settings

| Setting | Value | Notes |
|---------|-------|-------|
| **Enable** | ✅ Yes | Refinement control |
| **Preprocessor** | `lineart_realistic` | Extracts clean architectural lines |
| **Model** | `control_v11p_sd15_lineart` | SD 1.5 lineart control |
| **Weight** | `0.7` | Moderate influence |
| **Guidance Start** | `0.0` | Active from beginning |
| **Guidance End** | `1.0` | Active until end |
| **Control Mode** | `Balanced` | Equal with prompt |
| **Resize Mode** | `Crop and Resize` | Fit to generation size |

### How to Use

1. **Without input image**: Works with Unit 0's output to clean lines
2. **With reference**: Upload reference architecture photo/drawing
   - Traditional Japanese buildings work best
   - Preprocessor extracts clean lines automatically

### When to Adjust Weight

- **0.6-0.7**: Subtle cleanup (recommended)
- **0.8-0.9**: Stronger architectural fidelity
- **0.4-0.5**: More painterly, less precise lines

---

## ControlNet Unit 2: Tile Upscaling (Optional)

**Optional control for upscaling maps to larger sizes while maintaining detail.**

### Settings

| Setting | Value | Notes |
|---------|-------|-------|
| **Enable** | ⭕ Only for large maps | Not needed for 768×768 |
| **Preprocessor** | `tile_resample` | Smart upscaling |
| **Model** | `control_v11f1e_sd15_tile` | SD 1.5 tile control |
| **Weight** | `0.6` | Subtle enhancement |
| **Guidance Start** | `0.0` | Active from beginning |
| **Guidance End** | `1.0` | Active until end |
| **Control Mode** | `Balanced` | Equal with prompt |
| **Resize Mode** | `Just Resize` | Keep original proportions |

### When to Use

- Generating maps **> 768×768**
- Upscaling existing small maps to **1024×1024** or larger
- Need more detail in buildings/structures

### When to Skip

- Maps **≤ 768×768** (adds overhead without benefit)
- First tests (keep it simple)
- CPU generation (too slow)

### When to Adjust Weight

- **0.5-0.6**: Subtle detail enhancement (recommended)
- **0.7-0.8**: Stronger detail injection
- **0.3-0.4**: Minimal enhancement, more painterly

---

## Saving the Preset

### In AUTOMATIC1111 WebUI

1. Configure all three ControlNet units as above
2. Below ControlNet Unit 0, find **"Style"** dropdown
3. Click **"Save current prompts as style"**
4. Name it: **"L5R Battlemap"**
5. Description: **"Top-down Rokugani battlemap - scribble layout + lineart cleanup"**

### Loading the Preset

1. Open **"Style"** dropdown
2. Select **"L5R Battlemap"**
3. All three units configure automatically

---

## Alternative Presets

### Preset: "L5R Quick Test"

**For rapid prompt testing without input images.**

| Unit | Enable | Preprocessor | Model | Weight |
|------|--------|--------------|-------|--------|
| 0 | ⭕ No | - | - | - |
| 1 | ⭕ No | - | - | - |
| 2 | ⭕ No | - | - | - |

Pure text-to-image generation. Good for:
- Testing prompts quickly
- Seeing SD's default interpretation
- Experimenting with different models

### Preset: "L5R Sketch Only"

**For maximum control with hand-drawn maps.**

| Unit | Enable | Preprocessor | Model | Weight |
|------|--------|--------------|-------|--------|
| 0 | ✅ Yes | `scribble_xdog` | `scribble` | 1.3 |
| 1 | ⭕ No | - | - | - |
| 2 | ⭕ No | - | - | - |

Very strict adherence to sketch. Good for:
- Converting physical map sketches
- GM's hand-drawn dungeons
- Precise layout control

### Preset: "L5R Canny Edge"

**For photo-referenced maps (e.g., real Japanese gardens).**

| Unit | Enable | Preprocessor | Model | Weight |
|------|--------|--------------|-------|--------|
| 0 | ✅ Yes | `canny` | `control_v11p_sd15_canny` | 0.9 |
| 1 | ✅ Yes | `lineart_realistic` | `lineart` | 0.6 |
| 2 | ⭕ No | - | - | - |

Extracts precise edges from photos. Good for:
- Converting photos to stylized maps
- Using real location references
- Architectural accuracy

---

## Troubleshooting

### ControlNet Not Visible in WebUI

**Issue**: No ControlNet section below main generation area.

**Solution**:
1. Go to **Extensions** tab
2. Click **Available** sub-tab
3. Search: `sd-webui-controlnet`
4. Click **Install**
5. Restart WebUI: `docker compose restart stable-diffusion`

### Model Files Not Found

**Issue**: "Model file not found" error when selecting ControlNet model.

**Solution**:
1. Check models exist:
   ```bash
   ls -la models/ControlNet/
   ```
2. Should see:
   - `control_v11p_sd15_scribble.safetensors`
   - `control_v11p_sd15_lineart.safetensors`
   - `control_v11p_sd15_canny.safetensors`
   - `control_v11f1e_sd15_tile.safetensors`
3. If missing, re-run: `./scripts/download_models.sh`
4. Restart WebUI to detect models

### Output Doesn't Match Input Sketch

**Issue**: Generated map ignores sketch structure.

**Possible causes & solutions**:

1. **Weight too low**
   - Increase Unit 0 weight to 1.2-1.3
   - Change Control Mode to "ControlNet is more important"

2. **Preprocessor issues**
   - Try different preprocessor: `scribble_pidinet` or `scribble_hed`
   - Check preprocessed preview (enable "Allow Preview" in ControlNet)

3. **Sketch unclear**
   - Use thicker lines (3-5px)
   - Higher contrast (pure black on pure white)
   - Simplify sketch (only major structures)

4. **CFG Scale too low**
   - Increase CFG Scale to 7-8
   - Gives more weight to prompt + ControlNet

### Generation Has Unwanted Perspective

**Issue**: Map has 3D perspective instead of top-down.

**Solutions**:

1. **Add to negative prompt**:
   - "perspective", "isometric", "3d", "angled view"

2. **Emphasize in positive prompt**:
   - "(top-down view:1.3)", "(orthogonal:1.2)"
   - "flat map", "grid aligned", "no perspective"

3. **ControlNet adjustment**:
   - Use perfectly flat reference sketch
   - Increase Unit 0 weight to force flat layout

### Colors Look Wrong / Not L5R

**Issue**: Map looks European or generic fantasy.

**Not a ControlNet issue** - this is prompt engineering.

See [`l5r-prompts.md`](l5r-prompts.md) for L5R-specific prompts.

**Quick fixes**:
- Add to positive: "rokugani", "japanese feudal", "samurai era"
- Add to negative: "european", "medieval fantasy", "stone castles"
- Use DreamShaper 8 model (better at Asian aesthetics)

### Too Slow / Timeouts

**Issue**: Generation takes >5 minutes or times out.

**ControlNet adds overhead**:

1. **Disable Unit 2** (Tile) if not needed
2. **Reduce resolution**: 512×512 instead of 768×768
3. **Reduce steps**: 20 instead of 25
4. **Disable Unit 1** for quick tests (keep only Unit 0)

**Or switch to native macOS setup** (10× faster).

---

## Advanced Techniques

### Multi-Layer Generation

For complex maps, generate in layers:

1. **Layer 1**: Base terrain (fields, water, paths)
   - Use Scribble control only
   - Generate at 768×768

2. **Layer 2**: Buildings and structures
   - Use img2img with Layer 1 as base
   - Add Lineart control for architecture
   - Denoise: 0.5-0.6 (preserves base)

3. **Layer 3**: Details (gardens, fences, decorations)
   - Use img2img with Layer 2 as base
   - Lower ControlNet weights (0.4-0.5)
   - Denoise: 0.3-0.4 (subtle additions)

### Inpainting for Fixes

Fix specific map areas without regenerating:

1. Use **Inpaint** tab
2. Upload generated map
3. Mask area to fix (e.g., wrong building)
4. Enable ControlNet Unit 0 with sketch of correct structure
5. Generate with same prompt + "only masked" option

### Batch Generation with Variations

Generate multiple layouts from one sketch:

1. Set **Batch count**: 4
2. Enable **ControlNet Unit 0** with sketch
3. Vary **CFG Scale**: 6, 7, 8, 9 (one per batch)
4. Compare results, pick best

---

## Recommended Starting Point

**For first tests**, use this simple config:

### ControlNet Unit 0 Only

- ✅ Enable
- Preprocessor: `scribble_xdog`
- Model: `control_v11p_sd15_scribble`
- Weight: `1.1`
- Control Mode: `ControlNet is more important`
- **No input image** (let SD generate layout)

### Generation Settings

- Checkpoint: `DreamShaper_8`
- Steps: `25`
- CFG: `6`
- Size: `768×768`
- Sampler: `DPM++ 2M Karras`

### Prompt

Use any prompt from [`l5r-prompts.md`](l5r-prompts.md), e.g.:

**Positive**:
```
top-down tabletop rpg battlemap, rokugani rural province,
wooden farmhouses, packed earth roads, stone shrine,
flat lighting, clear layout, no perspective
```

**Negative**:
```
european, medieval, fantasy, perspective, isometric, characters
```

**Expected**: Clean top-down map in ~2 minutes.

Once working, add Unit 1 (Lineart) for refinement.

---

## Testing Checklist

When testing ControlNet configurations:

- [ ] Models downloaded and detected by WebUI
- [ ] ControlNet extension installed and visible
- [ ] Unit 0 (Scribble) configured correctly
- [ ] Generation completes without errors
- [ ] Output is top-down (no perspective)
- [ ] Output matches L5R aesthetic (not European)
- [ ] If using sketch: layout matches input structure
- [ ] Generation time acceptable (~2 min for 768×768)

If all checked, you're ready to experiment!

---

## Resources

### ControlNet Documentation

- [ControlNet GitHub](https://github.com/lllyasviel/ControlNet)
- [ControlNet v1.1 Models](https://huggingface.co/lllyasviel/ControlNet-v1-1)
- [AUTOMATIC1111 ControlNet Extension](https://github.com/Mikubill/sd-webui-controlnet)

### Preprocessor Reference

- **scribble_xdog**: Edge detection for sketches, good for layouts
- **scribble_pidinet**: Alternative sketch processor, sharper edges
- **lineart_realistic**: Realistic line extraction from photos
- **lineart_anime**: Anime-style line extraction
- **canny**: Precise edge detection, strict control
- **tile_resample**: Smart upscaling and detail enhancement

### Model Reference

- **scribble**: Layout control from rough sketches
- **lineart**: Architecture and line refinement
- **canny**: Edge-based precise control
- **tile**: Upscaling and detail injection

---

## Next Steps

1. **Test basic preset** (Unit 0 only, no input image)
2. **Try L5R prompts** from `l5r-prompts.md`
3. **Iterate on weights** to find your preferred style
4. **Add Unit 1** (Lineart) for refinement
5. **Document findings** for future integration

Happy experimenting! 🎨🗺️
