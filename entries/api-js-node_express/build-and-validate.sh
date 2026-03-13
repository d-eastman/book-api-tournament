#!/usr/bin/env bash
# Build, run, and validate this entry.
# Usage: ./build-and-validate.sh [validator-args...]
# Example: ./build-and-validate.sh --verbose

set -euo pipefail

ENTRY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$ENTRY_DIR/../.." && pwd)"
IMAGE_NAME="api-js-node_express"
CONTAINER_NAME="api-js-node_express"
PORT=8080

cleanup() {
    echo "Stopping container..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
}
trap cleanup EXIT

echo "=== Building $IMAGE_NAME ==="
docker build -t "$IMAGE_NAME" "$ENTRY_DIR"

echo ""
echo "=== Starting container on port $PORT ==="
docker run -d --name "$CONTAINER_NAME" -p "$PORT:8080" "$IMAGE_NAME"

echo "Waiting for API to be ready..."
for i in $(seq 1 30); do
    if curl -s "http://localhost:$PORT/api/authors" > /dev/null 2>&1; then
        echo "API is ready."
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "ERROR: API did not start within 30 seconds."
        docker logs "$CONTAINER_NAME"
        exit 1
    fi
    sleep 1
done

echo ""
echo "=== Running validator ==="
"$REPO_ROOT/validate/run.sh" "http://localhost:$PORT" --verbose "$@"
