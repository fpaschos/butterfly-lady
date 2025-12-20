# Good Prompts for L5R Village Generation

**Tested and working prompts for generating top-down Japanese village battlemaps.**

---

## Workflow Overview

1. **txt2img** - Generate initial layout with ControlNet Scribble
2. **img2img** - Refine details with inpainting:
   - Roof details (denoising 0.48, CFG 5)
   - Road refinement (denoising 0.54, CFG 4.5)
   - Water refinement (denoising 0.61, CFG 4.5)
   - Forest refinement (denoising 0.85, CFG 7.5)
   - Fields refinement (denoising 0.85, CFG 7.5)

---

## txt2img - Initial Generation

### Checkpoint
- **RealisticVision v5.1** (`realisticVisionV51_v51VAE`)

### Prompt
```
top-down, battlemap, japanese village,
orthographic view,
simple layout,
visible roads,
clean roofs,
empty ground,
lake,
map layout only,
vtt ready
```

### Negative Prompt
```
perspective, isometric
```

### Settings
- **Steps:** 25
- **Sampler:** DPM++ 2M Karras
- **CFG Scale:** 4.5
- **Size:** 768×768

### ControlNet Unit 0
- **Module:** scribble_xdog
- **Model:** control_v11p_sd15_scribble
- **Weight:** 1.15
- **Control Mode:** ControlNet is more important
- **Guidance:** 0.0 → 1.0

### Tested Seed
- **3752698284** (known good result)

---

## img2img - Roof details refinement

### Checkpoint
- **RealisticVision v5.1** (`realisticVisionV51_v51VAE`)

### Prompt
```
top-down, battlemap, (japanese village:1.2),
orthographic view,
thatched roofs, (feudal japan:1.3), village house, clean details,
map layout only,
vtt ready
```

### Negative Prompt
```
perspective, isometric, blur
```

### Settings
- **Steps:** 25
- **Sampler:** DPM++ 2M Karras
- **CFG Scale:** 5
- **Size:** 512×512
- **Denoising Strength:** 0.48

### Inpaint Settings
- **Mask Blur:** 4
- **Inpaint Area:** Only masked
- **Masked Area Padding:** 32

### Tested Seed
- **3177301685** (known good result)

---

## img2img - Road Refinement

### Checkpoint
- **RealisticVision v5.1** (`realisticVisionV51_v51VAE`)

### Prompt
```
top-down, battlemap, (japanese village:1.2), (feudal japan:1.3),
orthographic view, (village roads:1.4), (connected:1.5), wide,
vtt ready, clean details
```

### Negative Prompt
```
perspective, isometric, blur
```

### Settings
- **Steps:** 25
- **Sampler:** DPM++ 2M Karras
- **CFG Scale:** 4.5
- **Size:** 512×512
- **Denoising Strength:** 0.54

### Inpaint Settings
- **Mask Blur:** 4
- **Inpaint Area:** Only masked
- **Masked Area Padding:** 32

### Tested Seed
- **1113706778** (known good result)

---

## img2img - Water Refinement

### Checkpoint
- **RealisticVision v5.1** (`realisticVisionV51_v51VAE`)

### Prompt
```
top-down, battlemap,
lake, crystal water, amazing, masterpiece,
vtt ready, clean details
```

### Negative Prompt
```
perspective, isometric, blur
```

### Settings
- **Steps:** 25
- **Sampler:** DPM++ 2M Karras
- **CFG Scale:** 4.5
- **Size:** 512×512
- **Denoising Strength:** 0.61

### Inpaint Settings
- **Mask Blur:** 4
- **Inpaint Area:** Only masked
- **Masked Area Padding:** 32

### Tested Seed
- **2024223706** (known good result)

---

## img2img - Forest Refinement

### Checkpoint
- **RealisticVision v5.1** (`realisticVisionV51_v51VAE`)

### Prompt
```
top-down, battlemap,
lush trees, bushes, forest, natural,
vtt ready, clean details
```

### Negative Prompt
```
perspective, isometric, blur
```

### Settings
- **Steps:** 25
- **Sampler:** DPM++ 2M Karras
- **CFG Scale:** 7.5
- **Size:** 512×512
- **Denoising Strength:** 0.85

### Inpaint Settings
- **Mask Blur:** 4
- **Inpaint Area:** Only masked
- **Masked Area Padding:** 32

### Tested Seed
- **3630424687** (known good result)

---

## img2img - Fields Refinement

### Checkpoint
- **RealisticVision v5.1** (`realisticVisionV51_v51VAE`)

### Prompt
```
top-down, battlemap, (fields:1.4), summer, irrigation paths,
vtt ready, clean details
```

### Negative Prompt
```
perspective, isometric, blur
```

### Settings
- **Steps:** 25
- **Sampler:** DPM++ 2M Karras
- **CFG Scale:** 7.5
- **Size:** 512×512
- **Denoising Strength:** 0.85

### Inpaint Settings
- **Mask Blur:** 4
- **Inpaint Area:** Only masked
- **Masked Area Padding:** 32

### Tested Seed
- **222617290** (known good result)

---

## Key Success Factors

### Critical Elements
- ✅ **CFG Scale:** Keep low (4.5-5) for clean layouts, higher (7.5) for organic elements
- ✅ **Denoising Strategy:** Progressive increase (0.48 → 0.54 → 0.61 → 0.85)
  - Lower for structural elements (roofs, roads)
  - Higher for natural elements (water, forest, fields)
- ✅ **Control Mode:** "ControlNet is more important" for strict layout adherence
- ✅ **Prompt:** Keep simple and direct
- ✅ **Negative:** Minimal - just prevent perspective issues

### What Works
- Simple, direct language ("top-down", "battlemap", "orthographic")
- Emphasis on layout clarity ("simple layout", "clean roofs")
- Cultural specificity ("japanese village", "feudal japan", "thatched roofs")
- VTT focus ("map layout only", "vtt ready")

### What Doesn't Work
- Long, complex prompts
- High CFG scale (causes distortion)
- Too many quality tags
- Mentioning colors explicitly

---

## Quick Reference

### txt2img Recipe
```
Model: RealisticVision v5.1
Prompt: top-down, battlemap, japanese village, orthographic view
Negative: perspective, isometric
CFG: 4.5
ControlNet Scribble: Weight 1.15, "ControlNet is more important"
```

### img2img - Roof Details
```
Model: RealisticVision v5.1
Prompt: (japanese village:1.2), thatched roofs, (feudal japan:1.3)
Negative: perspective, isometric, blur
CFG: 5
Denoising: 0.48
```

### img2img - Road Refinement
```
Model: RealisticVision v5.1
Prompt: (village roads:1.4), (connected:1.5), wide, clean details
Negative: perspective, isometric, blur
CFG: 4.5
Denoising: 0.54
```

### img2img - Water Refinement
```
Model: RealisticVision v5.1
Prompt: lake, crystal water, amazing, masterpiece
Negative: perspective, isometric, blur
CFG: 4.5
Denoising: 0.61
```

### img2img - Forest Refinement
```
Model: RealisticVision v5.1
Prompt: lush trees, bushes, forest, natural
Negative: perspective, isometric, blur
CFG: 7.5
Denoising: 0.85
```

### img2img - Fields Refinement
```
Model: RealisticVision v5.1
Prompt: (fields:1.4), summer, irrigation paths
Negative: perspective, isometric, blur
CFG: 7.5
Denoising: 0.85
```
