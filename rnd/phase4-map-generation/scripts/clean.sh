#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

echo "=========================================="
echo "Clean L5R Map Generation R&D Environment"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will remove:"
echo "   - Docker container"
echo "   - Generated images (outputs/)"
echo "   - Docker volumes"
echo ""
echo "Models in models/ will be preserved."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Stopping container..."
docker compose down -v 2>/dev/null || true

echo ""
echo "Cleaning generated images..."
if [ -d "outputs" ]; then
    rm -rf outputs/*
    echo "✅ Cleaned outputs/"
fi

echo ""
echo "=========================================="
echo "✅ Cleanup complete!"
echo "=========================================="
echo ""
echo "Models are still in models/ directory."
echo "To remove models too, manually delete:"
echo "  - models/checkpoints/"
echo "  - models/ControlNet/"
echo ""
