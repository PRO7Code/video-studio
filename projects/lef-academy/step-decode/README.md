# LEF Academy — STEP DECODE

Question-breakdown videos for simulated STEP (English proficiency) questions. Brand: `brands/lef-step` (draft colours
from the owner; no approved logo yet).

## Make an episode (no code)
1. Copy `episodes/second-conditional.json` → `episodes/<slug>.json` and edit: skill, hook (≤ 8 words), stem (`___` for
   the blank), options + a short Arabic reason for each wrong one, `correct`, rule (`clueAr` + `clueTokens` = how to spot
   the pattern, `titleAr`, `pattern`, `explainAr`), `ctaAr` + `ctaSubAr`. `handle` only if real and approved.
   Glue multi-word Latin terms with `_` (e.g. `STEP_DECODE`, `LEF_Academy`) so RTL order stays correct.
2. Build props (+ original music bed):
   `.venv/bin/python -I tools/audio/make_vo.py projects/lef-academy/step-decode/episodes/<slug>.json --media-dir core/remotion/public/projects/lef/<slug> --out projects/lef-academy/step-decode/out/<slug>.props.json --music --text-only`
   (drop `--text-only` and add a `"vo"` list only when an APPROVED voice is available; music ducks under it automatically).
3. Stills / 5 s preview: `cd core/remotion && npx remotion still StepDecode s.jpg --props=../../projects/lef-academy/step-decode/out/<slug>.props.json --frame=600`
   · `npx remotion render StepDecode p.mp4 --props=… --frames=300-449`
4. Full + master: `npx remotion render StepDecode ../../projects/lef-academy/step-decode/out/<slug>-v1.mp4 --props=… --crf=16 --audio-bitrate=320k`
   then `tools/audio/master.sh <in>.mp4 <in>-master.mp4` (-16 LUFS, video copied untouched).

## Rules
- Every answer and explanation is checked by the teacher before publishing; keep the "practice question" label.
- No promises of scores or guaranteed passing; no claims about how often a question appears unless sourced.
- No synthetic voice unless its licence is verified and the owner approved it (default: text-only).

## Timing (30 fps, 4 options = 28.5 s)
hook 2 s · question 3.5 s (on screen at 2 s) · options 2.5 s · countdown 3 s · elimination 1.8 s per wrong option ·
reveal 2.2 s · analysis 6 s (clue → rule → meaning) · CTA 3.5 s. Override with `"timing": {"rule": 210}` (frames).
Sounds and animation share `stepDecodeEvents.ts`, so they stay in sync (unit-tested + measured: UI sounds within 5 ms).


## v3 "premium motion" settings (all optional, per episode JSON)
| Field | Effect |
|---|---|
| `fps` | `30` or `60` (default 30). The edit is timed on a 30-f timebase, so 60 just doubles motion samples. |
| `sfx` | built-in STEP DECODE kit (`public/sfx/step/*`, original): hit · whoosh · pop1-5 · tick/tick-hi · strike · success · chime1-3 · tap · logo. `false` = no SFX. |
| `music` | bed WAV + volume; ducks automatically under any voice segment. Generate the approved bed with `tools/audio/sonic_identity.py --variant D --bed-tension --events <events.json>`. |
| text markup | in `hookAr`, `ctaAr`, `rule.clueAr`, `rule.explainAr`: `*word*` = blue emphasis + underline, `^word^` = orange marker sweep, `_` glues terms. |
| `rule.clueTokens` | stem words boxed during the clue step (e.g. `["would","learn"]`). |
| `rule.pattern` | becomes formula chips: `If + past simple → would + base verb` (before → orange, after → blue). |
| links | come from `brands/lef-step/brand.json → links` (web lef.one, TikTok @lef.one); `links: {}` hides them. |
| `timing`, `perOption`, `thinkSeconds` | pacing overrides (frames @30). |

Timeline sheet for any episode (scenes, beats, SFX, Arabic narration slots):
`node tools/step_timeline.ts projects/lef-academy/step-decode/out/<slug>.props.json --json out/<slug>.timeline.json > out/<slug>.timeline.md`
