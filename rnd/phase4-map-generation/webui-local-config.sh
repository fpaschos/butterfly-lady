#!/bin/bash
# Local WebUI configuration for L5R Map Generation R&D
# This file is NOT part of the WebUI git repo and won't be overwritten

# Enable Metal Performance Shaders (MPS) for Apple Silicon GPU
export PYTORCH_ENABLE_MPS_FALLBACK=1

# Override default COMMANDLINE_ARGS with MPS-optimized settings
# These flags enable Metal GPU acceleration on macOS
export COMMANDLINE_ARGS="--skip-torch-cuda-test --no-half --precision full --api --listen --port 7860 --skip-version-check"

# Additional environment variables (optional)
# export WEBUI_LAUNCH_LIVE_OUTPUT=1  # Show real-time output during startup
