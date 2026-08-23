#!/usr/bin/env bash
set -Eeuo pipefail

readonly DEPLOY_DIR="/pfs/mayanwen/Code/Echo15_page"
readonly NODE_BIN="$DEPLOY_DIR/.runtime/node-v22.18.0-linux-x64/bin"
readonly TMUX_SESSION="echo15-dev"
readonly SERVICE_PORT="5173"
readonly DEPLOY_STATE_DIR="$DEPLOY_DIR/.deploy"
readonly SERVICE_LOG="$DEPLOY_STATE_DIR/vite.log"
readonly ARCHIVE_PATH="${1:?repository archive path is required}"
readonly MANIFEST_PATH="${2:?tracked-files manifest path is required}"
readonly SOURCE_REVISION="${3:?source revision is required}"
readonly DEPLOYED_MANIFEST="$DEPLOY_STATE_DIR/tracked-files.txt"

mkdir -p "$DEPLOY_STATE_DIR"
exec 9>"$DEPLOY_STATE_DIR/deploy.lock"
flock -w 300 9
trap 'rm -f "$ARCHIVE_PATH" "$MANIFEST_PATH"' EXIT

if [[ ! -f "$ARCHIVE_PATH" || ! -f "$MANIFEST_PATH" ]]; then
  echo "Deployment archive or manifest is missing" >&2
  exit 1
fi

if [[ ! "$SOURCE_REVISION" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Source revision must be a full Git commit SHA" >&2
  exit 1
fi

if [[ ! -f "$DEPLOYED_MANIFEST" ]]; then
  if [[ -d "$DEPLOY_DIR/.git" ]]; then
    git config --global --get-all safe.directory \
      | grep -Fx "$DEPLOY_DIR" >/dev/null \
      || git config --global --add safe.directory "$DEPLOY_DIR"
    git -C "$DEPLOY_DIR" ls-files > "$DEPLOYED_MANIFEST"
  else
    : > "$DEPLOYED_MANIFEST"
  fi
fi

while IFS= read -r previous_path; do
  [[ -n "$previous_path" ]] || continue
  grep -Fxq "$previous_path" "$MANIFEST_PATH" && continue

  case "$previous_path" in
    public/media/*|public/wm/assets/*)
      continue
      ;;
  esac

  rm -f -- "$DEPLOY_DIR/$previous_path"
done < "$DEPLOYED_MANIFEST"

tar -xf "$ARCHIVE_PATH" -C "$DEPLOY_DIR"
cp "$MANIFEST_PATH" "$DEPLOYED_MANIFEST"
printf '%s\n' "$SOURCE_REVISION" > "$DEPLOY_STATE_DIR/source-revision"

if [[ -f /pfs/mayanwen/Env/.bashrc_baidu ]]; then
  set +u
  # shellcheck disable=SC1091
  source /pfs/mayanwen/Env/.bashrc_baidu
  set -u
fi

cd "$DEPLOY_DIR"

if [[ ! -x "$NODE_BIN/node" || ! -x "$NODE_BIN/npm" ]]; then
  echo "Project Node runtime is missing from $NODE_BIN" >&2
  exit 1
fi

export PATH="$NODE_BIN:$PATH"
npm ci --no-audit --no-fund
npm run build

tmux kill-session -t "$TMUX_SESSION" 2>/dev/null || true
: > "$SERVICE_LOG"
tmux new-session -d -s "$TMUX_SESSION" \
  "cd '$DEPLOY_DIR' && export PATH='$NODE_BIN':\$PATH && exec npm run dev -- --host 0.0.0.0 --port '$SERVICE_PORT' --strictPort >> '$SERVICE_LOG' 2>&1"

for _ in {1..30}; do
  status_code="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$SERVICE_PORT/" || true)"
  if [[ "$status_code" == "200" || "$status_code" == "401" ]]; then
    echo "Deployed ${SOURCE_REVISION:0:7}; preview health status: $status_code"
    exit 0
  fi
  sleep 1
done

echo "Preview did not become healthy on port $SERVICE_PORT" >&2
tail -n 80 "$SERVICE_LOG" >&2 || true
exit 1
