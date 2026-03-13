#!/usr/bin/env bash
# ============================================================
# Book API Tournament — Build & Validate Script Template
# ============================================================
# Copy this file into your entry directory and rename it to
# build-and-validate.sh. The script will use the directory name
# as the Docker image and container name automatically.
#
# Usage: ./build-and-validate.sh [extra-validator-args...]
# Example: ./build-and-validate.sh
#          ./build-and-validate.sh --verbose
#
# Runs the validator against the entry.
# ============================================================

set -euo pipefail

ENTRY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$ENTRY_DIR/../.." && pwd)"
ENTRY_NAME="$(basename "$ENTRY_DIR")"
PORT=8080

cleanup() {
    echo "Stopping container..."
    docker rm -f "$ENTRY_NAME" 2>/dev/null || true
}
trap cleanup EXIT

echo "=== Building $ENTRY_NAME ==="
docker build -t "$ENTRY_NAME" "$ENTRY_DIR"

echo ""
echo "=== Starting container on port $PORT ==="
docker run -d --name "$ENTRY_NAME" -p "$PORT:8080" "$ENTRY_NAME"

echo "Waiting for API to be ready..."
for i in $(seq 1 30); do
    if curl -s "http://localhost:$PORT/api/authors" > /dev/null 2>&1; then
        echo "API is ready."
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "ERROR: API did not start within 30 seconds."
        docker logs "$ENTRY_NAME"
        exit 1
    fi
    sleep 1
done

echo ""
echo "=== Running validator ==="
"$REPO_ROOT/validate/run.sh" "http://localhost:$PORT" --verbose "$@"
