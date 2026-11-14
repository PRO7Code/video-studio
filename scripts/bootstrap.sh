#!/usr/bin/env bash
# Restore the studio's toolchain in a fresh (cloud) container. Idempotent: re-running skips what exists.
# Called by the SessionStart hook (.claude/settings.json) and usable as the cloud environment's setup script:
#   if [ -d video-studio ]; then bash video-studio/scripts/bootstrap.sh; fi
# Flags: --no-earshot (skip the 1.1 GB audio-model stack)   --no-whisper
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="${STUDIO_TOOLS:-$HOME/tools}"
SKILLS="$HOME/.claude/skills"
EARSHOT=1; WHISPER=1
for a in "$@"; do case "$a" in --no-earshot) EARSHOT=0;; --no-whisper) WHISPER=0;; esac; done
# pinned upstream revisions (reviewed 2026-11-14)
REALSFX_REPO=https://github.com/Clipwing/skills;   REALSFX_REV=edbefcb
EARSHOT_REPO=https://github.com/Leonxlnx/earshot;  EARSHOT_REV=4ac3d2a
log(){ printf '\033[36m[bootstrap]\033[0m %s\n' "$*"; }
mkdir -p "$TOOLS" "$SKILLS"

clone_pinned(){ # url rev dir
  if [ ! -d "$3/.git" ]; then git clone -q "$1" "$3"; fi
  git -C "$3" fetch -q --depth 50 origin 2>/dev/null || true
  git -C "$3" checkout -q "$2"
}

# 1) Remotion
if [ ! -d "$ROOT/core/remotion/node_modules" ]; then log "npm ci (remotion)"; (cd "$ROOT/core/remotion" && npm ci --silent --no-audit --no-fund); fi

# 2) Studio python env (numpy for product lock, faster-whisper for transcripts)
if [ ! -x "$ROOT/.venv/bin/python" ]; then
  log "python venv"; (cd "$ROOT" && (command -v uv >/dev/null && uv venv -q .venv || python3 -m venv .venv))
fi
PIP="$ROOT/.venv/bin/python -m pip"
"$ROOT/.venv/bin/python" -c "import numpy" 2>/dev/null || { (command -v uv >/dev/null && uv pip install -q --python "$ROOT/.venv/bin/python" numpy) || $PIP install -q numpy; }
if [ "$WHISPER" = 1 ]; then
  "$ROOT/.venv/bin/python" -c "import faster_whisper" 2>/dev/null || { log "faster-whisper"; (command -v uv >/dev/null && uv pip install -q --python "$ROOT/.venv/bin/python" faster-whisper) || $PIP install -q faster-whisper; }
fi

# 3) real-sfx skill (+ uisfx UI sounds)
if [ ! -f "$SKILLS/real-sfx/SKILL.md" ]; then
  log "real-sfx skill"; clone_pinned "$REALSFX_REPO" "$REALSFX_REV" "$TOOLS/clipwing-skills"
  cp -R "$TOOLS/clipwing-skills/skills/real-sfx" "$SKILLS/"
  (cd "$SKILLS/real-sfx" && python3 -I scripts/setup.py init --uisfx >/dev/null && python3 -I scripts/build_index.py >/dev/null)
fi

# 4) earshot (+ its skills earshot / real-sound, + MCP registration)
if [ "$EARSHOT" = 1 ]; then
  if [ ! -x "$TOOLS/earshot/.venv/bin/python" ]; then
    log "earshot (CPU torch, ~1-3 min)"; clone_pinned "$EARSHOT_REPO" "$EARSHOT_REV" "$TOOLS/earshot"
    (cd "$TOOLS/earshot" && python3 -m venv .venv \
      && .venv/bin/python -m pip install -q torch --index-url https://download.pytorch.org/whl/cpu \
      && .venv/bin/python -m pip install -q -e ".[mcp,llm]")
  fi
  for s in earshot real-sound; do [ -f "$SKILLS/$s/SKILL.md" ] || cp -R "$TOOLS/earshot/skills/$s" "$SKILLS/"; done
  if command -v claude >/dev/null && ! claude mcp list 2>/dev/null | grep -q '^earshot:'; then
    claude mcp add earshot --scope user -e EARSHOT_THREADS=3 -- "$TOOLS/earshot/.venv/bin/python" -m earshot mcp >/dev/null 2>&1 || true
  fi
  # models (~1.1 GB) download lazily on first use; prefetch with: $TOOLS/earshot/.venv/bin/python -m earshot doctor --fetch
fi
log "done. Check with scripts/doctor.sh"
