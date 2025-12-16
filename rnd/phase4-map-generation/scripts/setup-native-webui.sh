#!/bin/bash
set -e

# Get the script's directory and change to the project root (rnd/phase4-map-generation/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================================"
echo "L5R Native macOS SD WebUI Setup (M1 Metal/MPS)"
echo "========================================================"
echo ""
echo "This script will:"
echo "  1. Verify Homebrew is installed"
echo "  2. Verify conda is installed"
echo "  3. Create conda environment 'sd-webui'"
echo "  4. Clone AUTOMATIC1111 WebUI"
echo "  5. Symlink existing models (no re-download)"
echo "  6. Install ControlNet extension"
echo ""
echo "Working directory: $PROJECT_ROOT"
echo ""

# Check if already installed
if [ -d "$PROJECT_ROOT/stable-diffusion-webui" ]; then
    echo "⚠️  Native WebUI already installed at:"
    echo "   $PROJECT_ROOT/stable-diffusion-webui"
    echo ""
    read -p "Do you want to reinstall? This will remove the existing installation. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting installation."
        exit 0
    fi
    echo "Removing existing installation..."
    rm -rf "$PROJECT_ROOT/stable-diffusion-webui"
fi

# ============================================================
# Step 1: Verify Homebrew
# ============================================================
echo ""
echo "📦 Step 1/6: Verifying Homebrew..."
echo ""

if command -v brew &> /dev/null; then
    echo "✅ Homebrew is installed"
    BREW_PATH=$(which brew)
    echo "   Location: $BREW_PATH"
else
    echo "❌ ERROR: Homebrew not found"
    echo ""
    echo "Homebrew is required but not installed on your system."
    echo ""
    echo "To install Homebrew, visit: https://brew.sh/"
    echo "Or run this command:"
    echo ""
    echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    echo ""
    echo "After installation, run this setup script again."
    echo ""
    exit 1
fi

# ============================================================
# Step 2: Verify Conda
# ============================================================
echo ""
echo "🐍 Step 2/6: Verifying conda..."
echo ""

# Try to detect conda in common locations
CONDA_PATH=""
if command -v conda &> /dev/null; then
    CONDA_PATH=$(which conda)
elif [ -f "$HOME/miniconda3/bin/conda" ]; then
    CONDA_PATH="$HOME/miniconda3/bin/conda"
elif [ -f "$HOME/anaconda3/bin/conda" ]; then
    CONDA_PATH="$HOME/anaconda3/bin/conda"
elif [ -f "/opt/homebrew/anaconda3/bin/conda" ]; then
    CONDA_PATH="/opt/homebrew/anaconda3/bin/conda"
elif [ -f "/opt/homebrew/Caskroom/miniconda/base/bin/conda" ]; then
    CONDA_PATH="/opt/homebrew/Caskroom/miniconda/base/bin/conda"
fi

if [ -n "$CONDA_PATH" ]; then
    echo "✅ Conda is installed"
    echo "   Location: $CONDA_PATH"
else
    echo "❌ ERROR: Conda not found"
    echo ""
    echo "Conda (Miniconda or Anaconda) is required but not installed."
    echo ""
    echo "To install Miniconda:"
    echo "  1. Via Homebrew (recommended):"
    echo "     brew install --cask miniconda"
    echo ""
    echo "  2. Via official installer:"
    echo "     Visit https://docs.conda.io/en/latest/miniconda.html"
    echo ""
    echo "  3. Via Anaconda (heavier but includes more tools):"
    echo "     Visit https://www.anaconda.com/download"
    echo ""
    echo "After installation, restart your terminal and run this script again."
    echo ""
    exit 1
fi

# Initialize conda for this shell session
if [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
    source "$HOME/miniconda3/etc/profile.d/conda.sh"
elif [ -f "$HOME/anaconda3/etc/profile.d/conda.sh" ]; then
    source "$HOME/anaconda3/etc/profile.d/conda.sh"
elif [ -f "/opt/homebrew/anaconda3/etc/profile.d/conda.sh" ]; then
    source "/opt/homebrew/anaconda3/etc/profile.d/conda.sh"
fi

# ============================================================
# Step 3: Create Conda Environment
# ============================================================
echo ""
echo "🔧 Step 3/6: Creating conda environment 'sd-webui'..."
echo ""

# Check if environment already exists
if conda env list | grep -q "^sd-webui "; then
    echo "⚠️  Conda environment 'sd-webui' already exists"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing existing environment..."
        conda env remove -n sd-webui -y
        echo "Creating new environment..."
        conda create -n sd-webui python=3.10 -y
        echo "✅ Conda environment 'sd-webui' recreated"
    else
        echo "✅ Using existing conda environment 'sd-webui'"
    fi
else
    echo "Creating conda environment with Python 3.10..."
    conda create -n sd-webui python=3.10 -y
    echo "✅ Conda environment 'sd-webui' created"
fi

# ============================================================
# Step 4: Clone AUTOMATIC1111 WebUI
# ============================================================
echo ""
echo "📥 Step 4/6: Cloning AUTOMATIC1111 WebUI..."
echo ""

if [ -d "$PROJECT_ROOT/stable-diffusion-webui" ]; then
    echo "⚠️  WebUI directory already exists (from partial install?)"
    rm -rf "$PROJECT_ROOT/stable-diffusion-webui"
fi

echo "Cloning from GitHub..."
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git "$PROJECT_ROOT/stable-diffusion-webui"

if [ $? -eq 0 ]; then
    echo "✅ WebUI cloned successfully"
else
    echo "❌ Failed to clone WebUI"
    exit 1
fi

# ============================================================
# Step 5: Symlink Existing Models
# ============================================================
echo ""
echo "🔗 Step 5/6: Symlinking existing models..."
echo ""

WEBUI_DIR="$PROJECT_ROOT/stable-diffusion-webui"

# Verify models exist
if [ ! -d "$PROJECT_ROOT/models/checkpoints" ] || [ ! -d "$PROJECT_ROOT/models/ControlNet" ]; then
    echo "❌ Models not found in $PROJECT_ROOT/models/"
    echo ""
    echo "Please run ./scripts/download_models.sh first to download models."
    exit 1
fi

# Check if models are actually downloaded
if [ ! -f "$PROJECT_ROOT/models/checkpoints/v1-5-pruned.safetensors" ]; then
    echo "❌ Base SD model (v1-5-pruned.safetensors) not found"
    echo ""
    echo "Please run ./scripts/download_models.sh first."
    exit 1
fi

echo "Models found:"
echo "  - $(ls -1 $PROJECT_ROOT/models/checkpoints/*.safetensors | wc -l | tr -d ' ') checkpoint(s)"
echo "  - $(ls -1 $PROJECT_ROOT/models/ControlNet/*.safetensors 2>/dev/null | wc -l | tr -d ' ') ControlNet model(s)"
echo ""

# Remove default model directories
cd "$WEBUI_DIR"
rm -rf models/Stable-diffusion models/ControlNet

# Create symlinks
ln -s ../../models/checkpoints models/Stable-diffusion
ln -s ../../models/ControlNet models/ControlNet

# Verify symlinks
if [ -L "models/Stable-diffusion" ] && [ -L "models/ControlNet" ]; then
    echo "✅ Model symlinks created successfully"
    echo "   models/Stable-diffusion -> ../../models/checkpoints"
    echo "   models/ControlNet -> ../../models/ControlNet"
else
    echo "❌ Failed to create model symlinks"
    exit 1
fi

# Create outputs symlink to redirect generated images to project outputs folder
echo ""
echo "Creating outputs symlink..."

# Ensure project outputs directory exists
mkdir -p "$PROJECT_ROOT/outputs"

if [ -d "outputs" ] && [ ! -L "outputs" ]; then
    mv outputs outputs.backup
    echo "   Backed up existing outputs to outputs.backup"
fi

# Remove if it's already a symlink (for reinstalls)
if [ -L "outputs" ]; then
    rm outputs
fi

ln -s ../outputs outputs

if [ -L "outputs" ]; then
    echo "✅ Outputs symlink created successfully"
    echo "   outputs -> ../outputs"
    echo "   (Generated images will save to $PROJECT_ROOT/outputs/)"
else
    echo "⚠️  Failed to create outputs symlink"
    echo "   Images will save to WebUI's default location"
fi

cd "$PROJECT_ROOT"

# ============================================================
# Step 6: Install ControlNet Extension
# ============================================================
echo ""
echo "🎮 Step 6/6: Installing ControlNet extension..."
echo ""

EXTENSIONS_DIR="$WEBUI_DIR/extensions"
mkdir -p "$EXTENSIONS_DIR"

if [ -d "$EXTENSIONS_DIR/sd-webui-controlnet" ]; then
    echo "✅ ControlNet extension already exists"
else
    echo "Cloning ControlNet extension..."
    git clone https://github.com/Mikubill/sd-webui-controlnet.git "$EXTENSIONS_DIR/sd-webui-controlnet"
    
    if [ $? -eq 0 ]; then
        echo "✅ ControlNet extension installed"
    else
        echo "⚠️  Failed to clone ControlNet extension"
        echo "   You can install it manually later from the WebUI Extensions tab"
    fi
fi

# ============================================================
# Step 6: Create Local Configuration
# ============================================================
echo ""
echo "🎯 Step 6/6: Creating local configuration..."
echo ""

LOCAL_CONFIG="$PROJECT_ROOT/webui-local-config.sh"
if [ ! -f "$LOCAL_CONFIG" ]; then
    cat > "$LOCAL_CONFIG" << 'EOF'
#!/bin/bash
# Local WebUI configuration for L5R Map Generation R&D
# This file is NOT part of the WebUI git repo and safe to customize

# Enable Metal Performance Shaders (MPS) for Apple Silicon GPU
export PYTORCH_ENABLE_MPS_FALLBACK=1

# Override default COMMANDLINE_ARGS with MPS-optimized settings
# These flags enable Metal GPU acceleration on macOS
export COMMANDLINE_ARGS="--skip-torch-cuda-test --no-half --precision full --api --listen --port 7860 --skip-version-check"

# Additional environment variables (optional)
# export WEBUI_LAUNCH_LIVE_OUTPUT=1  # Show real-time output during startup
EOF
    
    chmod +x "$LOCAL_CONFIG"
    echo "✅ Local config created: webui-local-config.sh"
    echo "   (You can edit this file to customize WebUI launch options)"
else
    echo "ℹ️  Local config already exists"
fi

# ============================================================
# Completion
# ============================================================
echo ""
echo "========================================================"
echo "✅ Native macOS SD WebUI Setup Complete!"
echo "========================================================"
echo ""
echo "Installation summary:"
echo "  - WebUI: $WEBUI_DIR"
echo "  - Conda env: sd-webui (Python 3.10)"
echo "  - Models: Symlinked to $PROJECT_ROOT/models/"
echo "  - Outputs: Symlinked to $PROJECT_ROOT/outputs/"
echo "  - ControlNet: Installed"
echo ""
echo "Next steps:"
echo ""
echo "  1. Launch the WebUI:"
echo "     cd $PROJECT_ROOT"
echo "     ./scripts/start-native-webui.sh"
echo ""
echo "  2. First launch will:"
echo "     - Install PyTorch with MPS (M1 GPU) support (~2GB)"
echo "     - Install SD WebUI dependencies"
echo "     - Start server on http://localhost:7860"
echo "     - Take 5-10 minutes"
echo ""
echo "  3. Expected performance:"
echo "     - 512×512 image: 10-20 seconds (vs 10+ min on CPU Docker)"
echo "     - Uses Apple M1 Metal GPU (MPS)"
echo ""
echo "To uninstall:"
echo "  ./scripts/uninstall-native-webui.sh"
echo ""
