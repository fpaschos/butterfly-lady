#!/bin/bash
set -e

# Get the script's directory and change to the project root (rnd/phase4-map-generation/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "================================================"
echo "L5R Battlemap Generation - Model Downloader"
echo "================================================"
echo ""
echo "This will download ~10-15 GB of models."
echo "Downloads are resumable and won't re-download existing files."
echo ""
echo "Working directory: $PROJECT_ROOT"
echo ""

# Create directories if they don't exist
mkdir -p models/checkpoints
mkdir -p models/ControlNet

echo "📦 Downloading base Stable Diffusion models..."
echo ""

cd models/checkpoints

# Base SD 1.5 model (required for ControlNet)
if [ ! -f "v1-5-pruned.safetensors" ]; then
    echo "⬇️  Downloading SD v1.5 base model..."
    wget -c https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned.safetensors
    echo "✅ SD v1.5 downloaded"
else
    echo "✅ SD v1.5 already exists"
fi

# DreamShaper 8 (better quality, good for battlemaps)
if [ ! -f "DreamShaper_8.safetensors" ]; then
    echo "⬇️  Downloading DreamShaper 8..."
    wget -c https://huggingface.co/Lykon/DreamShaper/resolve/main/DreamShaper_8_pruned.safetensors -O DreamShaper_8.safetensors
    echo "✅ DreamShaper 8 downloaded"
else
    echo "✅ DreamShaper 8 already exists"
fi

# GhostMix v2.0 (2.5D artistic style, excellent for Asian themes and fantasy game assets)
if [ ! -f "ghostmix_v20Bakedvae.safetensors" ]; then
    echo "⬇️  Downloading GhostMix v2.0-BakedVAE..."
    wget -c https://civitai.com/api/download/models/76907 -O ghostmix_v20Bakedvae.safetensors
    echo "✅ GhostMix v2.0-BakedVAE downloaded"
else
    echo "✅ GhostMix v2.0-BakedVAE already exists"
fi

# RealisticVision v5.1 (photorealistic, excellent for top-down battlemaps and architectural detail)
if [ ! -f "realisticVisionV51_v51VAE.safetensors" ]; then
    echo "⬇️  Downloading RealisticVision v5.1 (with VAE)..."
    wget -c https://civitai.com/api/download/models/130072 -O realisticVisionV51_v51VAE.safetensors
    echo "✅ RealisticVision v5.1 downloaded"
else
    echo "✅ RealisticVision v5.1 already exists"
fi

cd ../ControlNet

echo ""
echo "🎮 Downloading ControlNet models..."
echo ""

# Scribble - converts rough sketches to structured layouts
if [ ! -f "control_v11p_sd15_scribble.safetensors" ]; then
    echo "⬇️  Downloading ControlNet Scribble..."
    wget -c https://huggingface.co/lllyasviel/control_v11p_sd15_scribble/resolve/main/diffusion_pytorch_model.safetensors -O control_v11p_sd15_scribble.safetensors
    echo "✅ Scribble model downloaded"
else
    echo "✅ Scribble model already exists"
fi

# Lineart - cleans up architectural details
if [ ! -f "control_v11p_sd15_lineart.safetensors" ]; then
    echo "⬇️  Downloading ControlNet Lineart..."
    wget -c https://huggingface.co/lllyasviel/control_v11p_sd15_lineart/resolve/main/diffusion_pytorch_model.safetensors -O control_v11p_sd15_lineart.safetensors
    echo "✅ Lineart model downloaded"
else
    echo "✅ Lineart model already exists"
fi

# Canny - edge detection for precise control
if [ ! -f "control_v11p_sd15_canny.safetensors" ]; then
    echo "⬇️  Downloading ControlNet Canny..."
    wget -c https://huggingface.co/lllyasviel/control_v11p_sd15_canny/resolve/main/diffusion_pytorch_model.safetensors -O control_v11p_sd15_canny.safetensors
    echo "✅ Canny model downloaded"
else
    echo "✅ Canny model already exists"
fi

# Seg - semantic segmentation for precise object placement
if [ ! -f "control_v11p_sd15_seg.safetensors" ]; then
    echo "⬇️  Downloading ControlNet Seg (segmentation)..."
    wget -c https://huggingface.co/lllyasviel/control_v11p_sd15_seg/resolve/main/diffusion_pytorch_model.safetensors -O control_v11p_sd15_seg.safetensors
    echo "✅ Seg model downloaded"
else
    echo "✅ Seg model already exists"
fi

# Tile - for upscaling larger maps (optional)
if [ ! -f "control_v11f1e_sd15_tile.safetensors" ]; then
    echo "⬇️  Downloading ControlNet Tile (upscaling)..."
    # Try primary source first
    set +e  # Temporarily disable exit on error
    wget -c https://huggingface.co/lllyasviel/control_v11f1e_sd15_tile/resolve/main/diffusion_pytorch_model.safetensors -O control_v11f1e_sd15_tile.safetensors
    WGET_EXIT=$?
    set -e  # Re-enable exit on error
    
    if [ $WGET_EXIT -eq 0 ]; then
        echo "✅ Tile model downloaded"
    else
        echo "⚠️  Primary source failed (404), trying alternative repository..."
        # Try alternative source from SDExplains (has fp16 version, compatible)
        set +e
        wget -c https://huggingface.co/SDExplains/ControlNet_Models/resolve/main/control_v11f1e_sd15_tile_fp16.safetensors -O control_v11f1e_sd15_tile.safetensors
        WGET_EXIT=$?
        set -e
        
        if [ $WGET_EXIT -eq 0 ]; then
            echo "✅ Tile model downloaded from alternative source (fp16 version)"
        else
            echo "⚠️  Failed to download Tile model (optional for upscaling)"
            echo "   You can manually download it later from:"
            echo "   https://huggingface.co/lllyasviel/control_v11f1e_sd15_tile"
            echo "   Or: https://huggingface.co/SDExplains/ControlNet_Models"
            echo "   Continuing without Tile model..."
        fi
    fi
else
    echo "✅ Tile model already exists"
fi

# Shuffle - style transfer without structure control
if [ ! -f "control_v11e_sd15_shuffle.safetensors" ]; then
    echo "⬇️  Downloading ControlNet Shuffle (style transfer)..."
    wget -c --no-check-certificate https://huggingface.co/lllyasviel/control_v11e_sd15_shuffle/resolve/main/diffusion_pytorch_model.safetensors -O control_v11e_sd15_shuffle.safetensors
    echo "✅ Shuffle model downloaded"
else
    echo "✅ Shuffle model already exists"
fi

echo ""
echo "🎨 Downloading IP-Adapter models (style transfer)..."
echo ""

# IP-Adapter SD 1.5
if [ ! -f "ip-adapter_sd15.safetensors" ]; then
    echo "⬇️  Downloading IP-Adapter SD 1.5..."
    wget -c --no-check-certificate https://huggingface.co/h94/IP-Adapter/resolve/main/models/ip-adapter_sd15.safetensors
    echo "✅ IP-Adapter SD 1.5 downloaded"
else
    echo "✅ IP-Adapter SD 1.5 already exists"
fi

# IP-Adapter Plus SD 1.5 (enhanced version with better quality)
if [ ! -f "ip-adapter-plus_sd15.safetensors" ]; then
    echo "⬇️  Downloading IP-Adapter Plus SD 1.5..."
    wget -c --no-check-certificate https://huggingface.co/h94/IP-Adapter/resolve/main/models/ip-adapter-plus_sd15.safetensors
    echo "✅ IP-Adapter Plus SD 1.5 downloaded"
else
    echo "✅ IP-Adapter Plus SD 1.5 already exists"
fi

# CLIP Image Encoder (required for IP-Adapter)
echo "⬇️  Downloading CLIP Image Encoder (required for IP-Adapter)..."
mkdir -p image_encoder
cd image_encoder

if [ ! -f "model.safetensors" ]; then
    wget -c --no-check-certificate https://huggingface.co/h94/IP-Adapter/resolve/main/models/image_encoder/model.safetensors
    echo "✅ CLIP Image Encoder downloaded"
else
    echo "✅ CLIP Image Encoder already exists"
fi

cd ..

echo ""
echo "🎨 Downloading LoRA models (style enhancement)..."
echo ""

cd ../Lora

# Create Lora directory if it doesn't exist
mkdir -p .

# Table RPG / D&D Maps LoRA (excellent for top-down battlemaps)
if [ ! -f "TableRPGv1.safetensors" ]; then
    echo "⬇️  Downloading Table RPG LoRA..."
    wget -c https://civitai.com/api/download/models/76438 -O TableRPGv1.safetensors
    echo "✅ Table RPG LoRA downloaded"
else
    echo "✅ Table RPG LoRA already exists"
fi

cd ..

echo ""
echo "================================================"
echo "✅ All models downloaded successfully!"
echo "================================================"
echo ""
echo "Models saved to:"
echo "  - models/checkpoints/ (base SD models)"
echo "  - models/ControlNet/ (ControlNet processors + style transfer)"
echo "  - models/Lora/ (LoRA style enhancements)"
echo ""
echo "Checkpoint models included:"
echo "  - SD v1.5 (base model)"
echo "  - DreamShaper 8 (versatile, realistic)"
echo "  - GhostMix v2.0 (2.5D artistic, excellent for Asian/fantasy themes)"
echo "  - RealisticVision v5.1 (photorealistic, best for top-down battlemaps)"
echo ""
echo "ControlNet models included:"
echo "  - Scribble (sketches → maps)"
echo "  - Lineart (clean architectural lines)"
echo "  - Canny (precise edge detection)"
echo "  - Seg (semantic segmentation)"
echo "  - Tile (upscaling/tiling)"
echo "  - Shuffle (style transfer only)"
echo "  - IP-Adapter + IP-Adapter Plus (advanced style transfer)"
echo ""
echo "LoRA models included:"
echo "  - Table RPG v1 (top-down battlemap style enhancement)"
echo ""
echo "Total size: ~17-23 GB"
echo ""
echo "Next steps:"
echo "  1. Docker: docker compose up -d"
echo "  2. Native: ./scripts/start-native-webui.sh"
echo "  3. Open WebUI: http://localhost:7860"
echo "  4. See README.md for setup instructions"
echo ""
