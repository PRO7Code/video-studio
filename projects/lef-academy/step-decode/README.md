# LEF Academy — STEP DECODE

Question-breakdown videos for simulated STEP (English proficiency) questions. Brand: `brands/lef-step` (draft colours
from the owner; no approved logo yet).

## Make an episode (no code)
1. Copy `episodes/sample-second-conditional.json` → `episodes/<slug>.json` and edit: skill, hook, stem (use `___`
   for the blank), options + short Arabic reason for each wrong one, `correct` index, rule (title, pattern, explanation),
   CTA. `handle` only if real and approved.
2. Optional media (git-ignored, put under `core/remotion/public/projects/lef/…`): `teacher` clip (picture-in-picture),
   `voiceover` WAV (music ducks under it), `music` bed.
3. Stills: `cd core/remotion && npx remotion still StepDecode out.jpg --props=../../projects/lef-academy/step-decode/episodes/<slug>.json --frame=600`
4. 5 s preview: `npx remotion render StepDecode preview.mp4 --props=… --frames=540-689`
5. Full (after approval): `npx remotion render StepDecode <slug>-v1.mp4 --props=…`

## Rules
- Every answer and explanation is checked by the teacher before publishing (the template shows a sample label until then).
- No claims about how often a question appears in the real exam unless sourced.

## Timing (30 fps, 4 options ≈ 31.5 s)
hook 2.5 s · question 5.5 s · options 3.5 s · think 3 s (countdown) · eliminate 2 s per wrong option · reveal 3 s ·
rule 5 s · CTA 2.5 s. Override any phase with `"timing": {"rule": 240}` (frames).
