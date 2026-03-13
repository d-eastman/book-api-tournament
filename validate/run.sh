#!/usr/bin/env bash
# Book API Tournament — Validator Runner
# Usage: ./validate/run.sh <base-url> [options]
# Example: ./validate/run.sh http://localhost:8080
#          ./validate/run.sh http://localhost:8080 --verbose

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ $# -lt 1 ]; then
    echo "Usage: $0 <base-url> [--verbose]"
    echo ""
    echo "Options:"
    echo "  --verbose       Show individual test results"
    exit 1
fi

BASE_URL="$1"
shift

exec python3 "$SCRIPT_DIR/validator.py" "$BASE_URL" "$@"
