#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups/mongo"

load_mongodb_uri() {
  if [[ -n "${MONGODB_URI:-}" ]]; then
    return
  fi

  local env_file="$ROOT_DIR/.env"
  if [[ ! -f "$env_file" ]]; then
    return
  fi

  local line
  line="$(grep -E '^[[:space:]]*MONGODB_URI=' "$env_file" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    return
  fi

  local value="${line#*=}"
  value="${value%%#*}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  export MONGODB_URI="$value"
}

file_size_bytes() {
  wc -c < "$1" | tr -d '[:space:]'
}

load_mongodb_uri

if [[ -z "${MONGODB_URI:-}" ]]; then
  echo "MONGODB_URI is required. Set it in the environment or in .env." >&2
  exit 1
fi

if ! command -v mongodump >/dev/null 2>&1; then
  echo "mongodump was not found. Install MongoDB Database Tools and try again." >&2
  exit 1
fi

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_path="$BACKUP_DIR/formoatlas-${timestamp}.archive.gz"

mkdir -p "$BACKUP_DIR"

mongodump --uri "$MONGODB_URI" --gzip --archive="$backup_path"

echo "Backup created: $backup_path"
echo "Size: $(file_size_bytes "$backup_path") bytes"
