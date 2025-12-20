#!/bin/bash
set -e

# Get the script's directory and change to the project root (rnd/phase4-map-generation/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================================"
echo "L5R Native macOS SD WebUI - Uninstaller"
echo "========================================================"
echo ""
echo "This will remove:"
echo "  - WebUI installation ($PROJECT_ROOT/stable-diffusion-webui)"
echo "  - Conda environment 'sd-webui'"
echo ""
echo "This will NOT remove:"
echo "  - Downloaded models ($PROJECT_ROOT/models/)"
echo "  - Generated images ($PROJECT_ROOT/outputs/)"
echo "  - Docker setup"
echo "  - Homebrew or Conda itself"
echo ""

read -p "Are you sure you want to uninstall? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborting uninstall."
    exit 0
fi

echo ""
echo "Starting uninstall..."
echo ""

# ============================================================
# Step 1: Remove WebUI Directory
# ============================================================
echo "Step 1/2: Removing WebUI installation..."

WEBUI_DIR="$PROJECT_ROOT/stable-diffusion-webui"

if [ -d "$WEBUI_DIR" ]; then
    echo "  Removing: $WEBUI_DIR"
    rm -rf "$WEBUI_DIR"
    echo "  ✅ WebUI removed"
else
    echo "  ⚠️  WebUI directory not found (already removed?)"
fi

# ============================================================
# Step 2: Remove Conda Environment
# ============================================================
echo ""
echo "Step 2/2: Removing conda environment..."

# Try to detect conda in common locations
CONDA_INIT=""
if [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
    CONDA_INIT="$HOME/miniconda3/etc/profile.d/conda.sh"
elif [ -f "$HOME/anaconda3/etc/profile.d/conda.sh" ]; then
    CONDA_INIT="$HOME/anaconda3/etc/profile.d/conda.sh"
elif [ -f "/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh" ]; then
    CONDA_INIT="/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh"
fi

if [ -n "$CONDA_INIT" ]; then
    source "$CONDA_INIT"
    
    if conda env list | grep -q "^sd-webui "; then
        echo "  Removing conda environment 'sd-webui'..."
        conda env remove -n sd-webui -y
        echo "  ✅ Conda environment removed"
    else
        echo "  ⚠️  Conda environment 'sd-webui' not found (already removed?)"
    fi
else
    echo "  ⚠️  Conda not found, skipping environment removal"
fi

# ============================================================
# Completion
# ============================================================
echo ""
echo "========================================================"
echo "✅ Uninstall Complete"
echo "========================================================"
echo ""
echo "Removed:"
echo "  - WebUI installation"
echo "  - Conda environment 'sd-webui'"
echo ""
echo "Preserved:"
echo "  - Models: $PROJECT_ROOT/models/"
echo "  - Outputs: $PROJECT_ROOT/outputs/"
echo "  - Docker setup: $PROJECT_ROOT/docker-compose.yml"
echo ""
echo "To reinstall:"
echo "  ./scripts/setup-native-webui.sh"
echo ""
echo "To remove Homebrew/Conda (if you want):"
echo "  brew uninstall --cask miniconda"
echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)\""
echo ""
