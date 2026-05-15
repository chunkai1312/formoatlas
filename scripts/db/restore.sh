#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ALLOW_REMOTE=false
ARCHIVE_PATH=""

usage() {
  echo "Usage: $0 [--allow-remote] <backup-archive-path>" >&2
}

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

redact_mongodb_uri() {
  sed -E 's#(mongodb(\+srv)?://[^/@:]+):[^/@]*@#\1:***@#' <<< "$1"
}

database_name_from_uri() {
  local uri="$1"
  local without_scheme="${uri#mongodb://}"
  without_scheme="${without_scheme#mongodb+srv://}"
  local path_part=""

  if [[ "$without_scheme" == */* ]]; then
    path_part="${without_scheme#*/}"
    path_part="${path_part%%\?*}"
  fi

  if [[ -n "$path_part" ]]; then
    echo "$path_part"
  else
    echo "database"
  fi
}

is_local_host() {
  local host="$1"

  case "$host" in
    localhost|127.0.0.1|::1|\[::1\])
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_local_mongodb_uri() {
  local uri="$1"

  if [[ "$uri" == mongodb+srv://* ]]; then
    return 1
  fi

  if [[ "$uri" != mongodb://* ]]; then
    return 1
  fi

  local authority="${uri#mongodb://}"
  authority="${authority%%/*}"
  authority="${authority%%\?*}"
  authority="${authority##*@}"

  if [[ -z "$authority" ]]; then
    return 1
  fi

  local host_entry
  IFS=',' read -ra hosts <<< "$authority"
  for host_entry in "${hosts[@]}"; do
    local host="$host_entry"

    if [[ "$host" == \[*\]* ]]; then
      host="${host%%]*}"
      host="${host#\[}"
    else
      host="${host%%:*}"
    fi

    if ! is_local_host "$host"; then
      return 1
    fi
  done

  return 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --allow-remote)
      ALLOW_REMOTE=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
    *)
      if [[ -n "$ARCHIVE_PATH" ]]; then
        echo "Only one backup archive path may be provided." >&2
        usage
        exit 1
      fi
      ARCHIVE_PATH="$1"
      shift
      ;;
  esac
done

if [[ -z "$ARCHIVE_PATH" ]]; then
  echo "Backup archive path is required." >&2
  usage
  exit 1
fi

if [[ ! -f "$ARCHIVE_PATH" ]]; then
  echo "Backup archive not found: $ARCHIVE_PATH" >&2
  exit 1
fi

load_mongodb_uri

if [[ -z "${MONGODB_URI:-}" ]]; then
  echo "MONGODB_URI is required. Set it in the environment or in .env." >&2
  exit 1
fi

if ! command -v mongorestore >/dev/null 2>&1; then
  echo "mongorestore was not found. Install MongoDB Database Tools and try again." >&2
  exit 1
fi

if [[ "$ALLOW_REMOTE" != true ]] && ! is_local_mongodb_uri "$MONGODB_URI"; then
  echo "Refusing to restore into a remote-looking MongoDB URI." >&2
  echo "Pass --allow-remote only when you intentionally want to restore this target." >&2
  exit 1
fi

db_name="$(database_name_from_uri "$MONGODB_URI")"
confirmation="RESTORE $db_name"

echo "Target MongoDB URI: $(redact_mongodb_uri "$MONGODB_URI")"
echo "Archive: $ARCHIVE_PATH"
echo "This restore is destructive and will run mongorestore --drop."
printf "Type '%s' to continue: " "$confirmation"
read -r response

if [[ "$response" != "$confirmation" ]]; then
  echo "Restore canceled."
  exit 1
fi

mongorestore --uri "$MONGODB_URI" --drop --gzip --archive="$ARCHIVE_PATH"

echo "Restore completed."
