#!/bin/bash
set -e

# Get the script's directory and change to the project root (rnd/phase4-map-generation/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEBUI_DIR="$PROJECT_ROOT/stable-diffusion-webui"

echo "========================================================"
echo "Starting Stable Diffusion WebUI (Native macOS with MPS)"
echo "========================================================"
echo ""
echo "Project root: $PROJECT_ROOT"
echo "WebUI directory: $WEBUI_DIR"
echo ""

# Check if WebUI is installed
if [ ! -d "$WEBUI_DIR" ]; then
    echo "❌ WebUI not found at: $WEBUI_DIR"
    echo ""
    echo "Please run the setup script first:"
    echo "  ./scripts/setup-native-webui.sh"
    echo ""
    exit 1
fi

# Try to detect conda in common locations
CONDA_INIT=""
if [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
    CONDA_INIT="$HOME/miniconda3/etc/profile.d/conda.sh"
elif [ -f "$HOME/anaconda3/etc/profile.d/conda.sh" ]; then
    CONDA_INIT="$HOME/anaconda3/etc/profile.d/conda.sh"
elif [ -f "/opt/homebrew/anaconda3/etc/profile.d/conda.sh" ]; then
    CONDA_INIT="/opt/homebrew/anaconda3/etc/profile.d/conda.sh"
elif [ -f "/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh" ]; then
    CONDA_INIT="/opt/homebrew/Caskroom/miniconda/base/etc/profile.d/conda.sh"
fi

if [ -z "$CONDA_INIT" ]; then
    echo "❌ Conda not found!"
    echo ""
    echo "Please ensure conda is installed and initialized."
    echo "Run: ./scripts/setup-native-webui.sh"
    exit 1
fi

# Initialize conda for this shell
source "$CONDA_INIT"

# Check if sd-webui environment exists
if ! conda env list | grep -q "^sd-webui "; then
    echo "❌ Conda environment 'sd-webui' not found"
    echo ""
    echo "Please run the setup script first:"
    echo "  ./scripts/setup-native-webui.sh"
    exit 1
fi

echo "Activating conda environment 'sd-webui'..."
conda activate sd-webui

if [ $? -ne 0 ]; then
    echo "❌ Failed to activate conda environment"
    exit 1
fi

echo "✅ Conda environment activated: $(conda info --envs | grep '*' | awk '{print $1}')"
echo ""

# Source local WebUI configuration (outside git repo, safe to customize)
LOCAL_CONFIG="$PROJECT_ROOT/webui-local-config.sh"
if [ -f "$LOCAL_CONFIG" ]; then
    echo "Loading local configuration..."
    source "$LOCAL_CONFIG"
    echo "✅ Local config loaded"
else
    echo "⚠️  Local config not found: $LOCAL_CONFIG"
    echo "   Using default settings (may be slower on Apple Silicon)"
fi

echo ""
echo "Configuration:"
echo "  - MPS (Metal GPU): Enabled"
echo "  - API: Enabled (http://localhost:7860/docs)"
echo "  - Port: 7860"
echo "  - Listen: All interfaces (0.0.0.0)"
echo ""

# Check if port 7860 is already in use
if lsof -Pi :7860 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 7860 is already in use!"
    echo ""
    echo "If Docker WebUI is running, stop it first:"
    echo "  docker compose down"
    echo ""
    echo "Or change the port in this script."
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Starting WebUI..."
echo ""
echo "First launch will take 5-10 minutes to install dependencies."
echo "Subsequent launches will be faster (~30 seconds)."
echo ""
echo "Press Ctrl+C to stop the server."
echo ""
echo "========================================================"
echo ""

# Navigate to WebUI directory and launch
cd "$WEBUI_DIR"
./webui.sh
