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

cd ../..

echo ""
echo "================================================"
echo "✅ All models downloaded successfully!"
echo "================================================"
echo ""
echo "Models saved to:"
echo "  - models/checkpoints/ (base SD models)"
echo "  - models/ControlNet/ (ControlNet processors)"
echo ""
echo "Total size: ~10-15 GB"
echo ""
echo "Next steps:"
echo "  1. Start Docker: docker compose up -d"
echo "  2. Open WebUI: http://localhost:7860"
echo "  3. See README.md for setup instructions"
echo ""
