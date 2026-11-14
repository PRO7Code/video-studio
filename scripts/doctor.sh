#!/usr/bin/env bash
# Report what works and what needs setup. Read-only.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; TOOLS="${STUDIO_TOOLS:-$HOME/tools}"; SK="$HOME/.claude/skills"
ok(){ printf '  \033[32m✔\033[0m %-22s %s\n' "$1" "$2"; }; no(){ printf '  \033[31m✘\033[0m %-22s %s\n' "$1" "$2"; }
echo "studio doctor"
command -v ffmpeg >/dev/null && ok ffmpeg "$(ffmpeg -version | head -1 | cut -c1-40)" || no ffmpeg "install ffmpeg"
command -v node >/dev/null && ok node "$(node -v)" || no node "install Node 20+"
[ -d "$ROOT/core/remotion/node_modules/remotion" ] && ok remotion "$(node -p "require('$ROOT/core/remotion/node_modules/remotion/package.json').version")" || no remotion "scripts/bootstrap.sh"
[ -x "$ROOT/.venv/bin/python" ] && "$ROOT/.venv/bin/python" -c "import numpy" 2>/dev/null && ok "product lock" "numpy ready" || no "product lock" "scripts/bootstrap.sh"
"$ROOT/.venv/bin/python" -c "import faster_whisper" 2>/dev/null && ok whisper "faster-whisper" || no whisper "bootstrap (or --no-whisper)"
[ -f "$SK/real-sfx/SKILL.md" ] && ok real-sfx "$(find "$SK/real-sfx/vendor" -name '*.mp3' 2>/dev/null | wc -l) uisfx sounds; libraries: $(python3 -c "import json;print(len(json.load(open('$SK/real-sfx/config.json'))['libraries']))" 2>/dev/null || echo 0)" || no real-sfx "bootstrap"
[ -f "$SK/real-sound/SKILL.md" ] && ok real-sound "installed" || no real-sound "bootstrap"
[ -x "$TOOLS/earshot/.venv/bin/python" ] && ok earshot "models cached: $(du -sh "$TOOLS/earshot/.cache/hf" 2>/dev/null | cut -f1 || echo no)" || no earshot "bootstrap"
command -v claude >/dev/null && (claude mcp list 2>/dev/null | grep -q '^earshot:.*Connected' && ok "earshot MCP" connected || no "earshot MCP" "restart session after bootstrap")
if [ -n "${HF_API_KEY_ID:-}" ]; then ok "higgsfield key" "env vars set"; else
  echo "  • higgsfield key        not in env (cloud: saved as network secret for api.higgsfield.ai → injected by proxy)"; fi
gh auth status >/dev/null 2>&1 && ok github "authenticated" || no github "reconnect at claude.ai/connect-github"
