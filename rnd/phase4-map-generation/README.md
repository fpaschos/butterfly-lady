# L5R Battlemap Generation R&D

**Phase 4 Research & Development**: Testing Stable Diffusion + ControlNet for L5R battlemaps

⚠️ **This is R&D only** - isolated testing environment, not production code.

---

## Overview

This Docker setup lets you test AI-generated battlemaps for **Legend of the Five Rings 4th Edition** using:

- ✅ **Stable Diffusion 1.5** with **DreamShaper 8** model
- ✅ **ControlNet** (scribble, lineart, canny, tile)
- ✅ **AUTOMATIC1111 WebUI** for easy testing
- ✅ **L5R-specific prompts** for Rokugani architecture

### What This Tests

- Prompt engineering for L5R aesthetic (not European medieval)
- ControlNet workflow: sketch → layout → clean lines → upscale
- Top-down orthogonal maps suitable for VTT grid systems
- Performance and quality on macOS hardware

### What This Is NOT

- ❌ Not production-ready
- ❌ Not optimized for speed (uses CPU, not GPU)
- ❌ Not integrated with Discord bot (that's for later)

---

## ⚠️ Important: macOS Reality Check

### Docker on macOS Limitations

**Docker CANNOT use Metal GPU on macOS.**

- No CUDA (not on Mac)
- Docker cannot access Metal
- CPU-only generation = **1-3 minutes per 768×768 image**
- Intel Mac = extremely slow (not recommended)

### This Setup Is Good For:

✅ Testing prompts and ControlNet behavior  
✅ Experimenting with L5R aesthetic  
✅ Understanding the workflow  
✅ Prototyping before production  

### After Testing, Switch to Native:

👉 **For real usage**, run Stable Diffusion **natively on macOS**:

- **DiffusionBee** (easiest, M1/M2/M3 optimized)
- **InvokeAI** (more features)
- **AUTOMATIC1111 Metal build** (same UI, 10× faster)

Same models, same prompts, **10× faster generation**.

---

## Prerequisites

### Required

- **macOS** (Apple Silicon M1/M2/M3 strongly recommended)
- **Docker Desktop for Mac** ([download](https://www.docker.com/products/docker-desktop))
- **Git** (pre-installed on macOS)
- **16 GB RAM minimum** (32 GB recommended)
- **~20 GB free disk space** (10-15 GB for models, rest for outputs)

### Docker Configuration

In Docker Desktop:

1. Open **Settings** → **Resources**
2. Set **Memory** to **≥ 12 GB** (16 GB if you have 32 GB RAM)
3. Set **Disk image size** to at least **60 GB**
4. Click **Apply & Restart**

---

## Quick Start

### 1. Download Models

Models are **NOT** included in the repo (too large). Download them first:

```bash
cd rnd/phase4-map-generation
./scripts/download_models.sh
```

This downloads:
- **SD v1.5 base model** (~4 GB)
- **DreamShaper 8** (~2 GB)
- **4× ControlNet models** (~1.5 GB each)

**Total**: ~10-15 GB, takes 10-30 minutes depending on connection.

⏸️ Downloads are **resumable** - if interrupted, just run the script again.

### 2. Start Docker Container

```bash
docker compose up -d
```

First start takes **5-10 minutes** as it:
- Pulls the AUTOMATIC1111 image (~5 GB)
- Initializes the WebUI
- Indexes models

### 3. Check Status

```bash
docker compose logs -f stable-diffusion
```

Wait for: `Running on local URL: http://0.0.0.0:7860`

Press `Ctrl+C` to exit logs (container keeps running).

### 4. Open WebUI

Open in browser: **http://localhost:7860**

### 5. Enable ControlNet Extension

**First time only:**

1. Click **Extensions** tab
2. Check if **ControlNet** is listed
3. If not:
   - Click **Available** sub-tab
   - Search: `sd-webui-controlnet`
   - Click **Install**
   - Restart container: `docker compose restart stable-diffusion`

ControlNet should now appear below the main generation options.

---

## Usage Workflow

### Step 1: Load ControlNet Preset

See [`test-prompts/controlnet-presets.md`](test-prompts/controlnet-presets.md) for the full **"L5R Battlemap"** preset configuration.

Quick summary:

**ControlNet Unit 0** (Sketch → Layout):
- ✅ Enable
- Preprocessor: `scribble_xdog`
- Model: `control_v11p_sd15_scribble`
- Weight: **1.1**
- Control Mode: **ControlNet more important**

**ControlNet Unit 1** (Architecture Cleanup):
- ✅ Enable
- Preprocessor: `lineart_realistic`
- Model: `control_v11p_sd15_lineart`
- Weight: **0.7**

**ControlNet Unit 2** (Upscaling - optional):
- ⭕ Enable only for large maps
- Model: `control_v11f1e_sd15_tile`
- Weight: **0.6**

💾 Save as preset: **"L5R Battlemap"** (use preset dropdown).

### Step 2: Choose Test Prompt

See [`test-prompts/l5r-prompts.md`](test-prompts/l5r-prompts.md) for ready-to-use prompts:

- **Rural Naisō Province** (farms, shrines, bamboo)
- **Urban Town** (merchant districts, tea houses)
- **Military Dojo** (training grounds, wooden walls)
- **Castle Courtyard** (stone walls, guard towers)
- **Natural Terrain** (forests, rivers, mountain passes)

### Step 3: Generation Settings

**Recommended for testing:**

- **Checkpoint**: `DreamShaper_8.safetensors`
- **Sampling method**: `DPM++ 2M Karras`
- **Sampling steps**: **25** (good balance)
- **CFG Scale**: **6-7** (not too strict)
- **Size**: **768×768** (start small, faster)
- **Batch count**: **1** (CPU is slow)

### Step 4: Generate

Click **Generate** and wait **1-3 minutes**.

### Step 5: Iterate

Adjust:
- ControlNet weights (higher = more control, lower = more freedom)
- Prompt details (add/remove specific elements)
- Negative prompt (exclude unwanted elements)
- CFG scale (creativity vs prompt adherence)

---

## Example: Rural Naisō Province

### Positive Prompt

```
top-down tabletop rpg battlemap, rokugani rural province, 
wooden farmhouses with sliding doors, packed earth roads, 
small stone shrine with torii gate, bamboo fences, 
rice paddies, flat lighting, clear readable layout, 
no perspective, grid-aligned
```

### Negative Prompt

```
european, medieval, fantasy armor, thatched roofs, 
stone cottages, perspective, isometric, 3d, characters, 
people, text, watermark, blurry
```

### Settings

- Steps: **25**
- CFG: **6**
- Size: **768×768**
- Sampler: **DPM++ 2M Karras**

### Expected Result

A clean, top-down map with:
- Wooden Japanese-style buildings
- Clear grid-aligned roads
- Cultural markers (shrine, torii, bamboo)
- Flat lighting (no shadows/perspective)
- No European medieval elements

⏱️ **Generation time**: ~2 minutes on M2 Mac, ~3 minutes on M1.

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker compose logs stable-diffusion
```

**Common issues:**
- Not enough RAM allocated to Docker (need ≥12 GB)
- Models not downloaded (run `./scripts/download_models.sh`)
- Port 7860 already in use (stop other services)

### Models Not Found

Ensure models are in correct locations:

```
models/
├── checkpoints/
│   ├── v1-5-pruned.safetensors
│   └── DreamShaper_8.safetensors
└── ControlNet/
    ├── control_v11p_sd15_scribble.safetensors
    ├── control_v11p_sd15_lineart.safetensors
    ├── control_v11p_sd15_canny.safetensors
    └── control_v11f1e_sd15_tile.safetensors
```

If missing, re-run: `./scripts/download_models.sh`

### ControlNet Extension Missing

1. WebUI → **Extensions** → **Available**
2. Search: `sd-webui-controlnet`
3. Click **Install**
4. Restart: `docker compose restart stable-diffusion`

### Customizing WebUI Settings (Native Setup)

The native setup uses `webui-local-config.sh` for configuration:

```bash
# Edit the local config file
nano webui-local-config.sh
```

**Common customizations:**

```bash
# Change port
export COMMANDLINE_ARGS="--skip-torch-cuda-test --no-half --precision full --api --listen --port 8080"

# Enable live output during startup
export WEBUI_LAUNCH_LIVE_OUTPUT=1

# Add authentication
export COMMANDLINE_ARGS="--skip-torch-cuda-test --no-half --precision full --api --listen --gradio-auth username:password"
```

**Why this file?**
- Lives in R&D folder (tracked by git)
- **NOT** part of WebUI repo (won't be overwritten by WebUI updates)
- Easy to customize without modifying scripts

### Generation Is Too Slow

**This is expected on macOS + Docker.**

Options:
1. **Reduce size**: Try 512×512 instead of 768×768 (~50% faster)
2. **Reduce steps**: Try 20 instead of 25 (~20% faster)
3. **Switch to native**: Install DiffusionBee (10× faster)

### Images Look European, Not Japanese

**Prompt engineering tips:**

✅ **Do include:**
- "rokugani", "japanese feudal", "samurai era"
- Specific architecture: "sliding doors", "paper walls", "curved tile roofs"
- Cultural markers: "torii gate", "shrine", "bamboo", "tatami"

❌ **Do exclude (negative prompt):**
- "european", "medieval", "fantasy"
- "thatched roof", "stone cottage", "half-timber"
- "castle" (unless Japanese castle context)

### Maps Have Perspective/Isometric View

**Add to negative prompt:**
- "perspective"
- "isometric"
- "3d"
- "angled"

**Add to positive prompt:**
- "top-down"
- "orthogonal"
- "flat view"
- "grid-aligned"

---

## File Structure

```
rnd/phase4-map-generation/
├── README.md                      # This file
├── docker-compose.yml             # Docker configuration
├── webui-local-config.sh          # Local WebUI settings (native setup)
├── .gitignore                     # Excludes models/outputs from git
│
├── models/                        # Downloaded models (not in git)
│   ├── checkpoints/              # SD base models (~6 GB)
│   └── ControlNet/               # ControlNet models (~6 GB)
│
├── outputs/                       # Generated images (not in git)
│   └── txt2img-images/           # Auto-created by WebUI
│
├── scripts/
│   └── download_models.sh        # Model downloader
│
└── test-prompts/
    ├── controlnet-presets.md     # ControlNet configurations
    └── l5r-prompts.md           # L5R-specific prompts
```

---

## Useful Commands

### Start Container (Background)

```bash
docker compose up -d
```

### Stop Container

```bash
docker compose down
```

### View Logs

```bash
docker compose logs -f stable-diffusion
```

### Restart Container

```bash
docker compose restart stable-diffusion
```

### Check Status

```bash
docker compose ps
```

### Remove Everything (Clean Slate)

```bash
docker compose down
docker volume prune
```

Models and outputs are NOT deleted (in local folders).

---

## Performance Expectations

### Apple Silicon (M1/M2/M3)

- **512×512**: ~1 minute
- **768×768**: ~2 minutes
- **1024×1024**: ~4 minutes

### Intel Mac

- **512×512**: ~3 minutes
- **768×768**: ~5 minutes
- **1024×1024**: ~10+ minutes

❗ **Not recommended for serious testing on Intel.**

---

## Next Steps After R&D

### 1. Switch to Native macOS Setup

**For production testing**, install:

- **DiffusionBee** (recommended): https://diffusionbee.com/
  - Drag & drop interface
  - M1/M2/M3 optimized
  - Same models work
  
- **InvokeAI**: https://invoke.ai/
  - More features
  - ControlNet support
  - Command-line + WebUI

- **AUTOMATIC1111 Metal**: https://github.com/AUTOMATIC1111/stable-diffusion-webui
  - Install with Metal support
  - Same UI as this Docker
  - 10× faster

Copy models from `models/` to new setup.

### 2. Fine-Tune Prompts

Based on testing:
- Document successful prompt patterns
- Create prompt templates for different map types
- Build negative prompt library
- Determine optimal ControlNet weights

### 3. Consider LoRA Training

If results need more L5R-specific style:
- Train custom LoRA on L5R artwork
- Fine-tune for Rokugani architecture
- Requires ~50-100 training images
- Can be done with DreamBooth or LoRA training tools

### 4. Integration Planning

When ready to integrate into main bot:

1. **Add to Phase 4 roadmap**
2. **Create `packages/image-gen`** in main monorepo
3. **Implement SD API client** (call native or remote SD)
4. **Add Discord commands**: `/generate map [type]`
5. **Asset storage** (save generated maps)
6. **VTT integration** (Phase 5)

See main project [`VTT_ARCHITECTURE.md`](../../VTT_ARCHITECTURE.md) for integration plans.

---

## Resources

### Stable Diffusion

- [AUTOMATIC1111 WebUI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- [Stable Diffusion v1.5](https://huggingface.co/runwayml/stable-diffusion-v1-5)
- [DreamShaper Model](https://huggingface.co/Lykon/DreamShaper)

### ControlNet

- [ControlNet GitHub](https://github.com/lllyasviel/ControlNet)
- [ControlNet v1.1 Models](https://huggingface.co/lllyasviel/ControlNet-v1-1)
- [ControlNet Paper](https://arxiv.org/abs/2302.05543)

### L5R References

- Use official L5R 4th Edition artwork for style reference
- Study Rokugani architecture (not Chinese or general Asian)
- Focus on Heian/Sengoku period Japan aesthetic

---

## Contributing to R&D

This is a testing environment. Document your findings:

- **Successful prompts** → Add to `test-prompts/l5r-prompts.md`
- **ControlNet settings** → Update `test-prompts/controlnet-presets.md`
- **Issues/workarounds** → Note in this README
- **Generated samples** → Save best results to `outputs/samples/`

When ready, findings inform Phase 4 implementation in main project.

---

## License

This R&D setup uses:
- **AUTOMATIC1111 WebUI**: AGPL-3.0
- **Stable Diffusion**: CreativeML Open RAIL-M
- **ControlNet**: Apache-2.0

Generated images are yours to use in your L5R games.

---

## Questions?

This is **R&D only** - isolated testing, safe to experiment.

**Main project**: See [`../../README.md`](../../README.md)  
**Phase 4 plans**: See [`../../VTT_ARCHITECTURE.md`](../../VTT_ARCHITECTURE.md)

Happy map generating! 🗾🎲
