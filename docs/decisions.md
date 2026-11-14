# Decisions & research log (moved here from chat, 2026-11-13/14)

## Anan Thursday reel (delivered)
- 39 s, 1080×1920, 30 fps. Story: ideas → discussion → technical project; agent shown as "in development".
- Hook replaced at the client's request (original hook: a student adjusting her seat → rejected). New hook: student
  presenting at the screen (hall-pan 1.0–3.1 s), text moved to the bottom so presenter and screen stay visible.
- No subtitles: Whisper medium produced only low-confidence hallucinations (e.g. repeated "راتب ثانية").
- Music: original procedural bed (tools/compose_music.py), 120 BPM, cuts on beats. SFX: procedural kit, cue sheet
  on exact frames; whoosh peak mid-transition (cue = transition start − 6 frames). Mix ≈ −18.3 LUFS, peak −1.3 dBFS.
- earshot check of the synthesized whoosh: p_real 0.15 ("likely code-synthesized") → real recordings preferred.
- Real SFX via Openverse failed: Freesound CDN returns 403 to automated downloads; Wikimedia hits are pronunciations.

## Video AI tools (verified from official docs, 2026-11-14)
- Runway Aleph 2.0 (`aleph2`, /v1/video_to_video): $0.28/s, input 2–30 s ≤30 fps, keeps input resolution ≤1080p,
  $10 minimum credit. 9:16 not confirmed.
- Luma Modify (ray-2 / ray-flash-2): ~$1.75 / $0.60 per 5 s 720p (legacy docs), ≤10 s / 15 s, needs public URL.
- fal Wan VACE 14B: $0.08/s 720p. Background removal on fal: prices conflict ($0.004–0.14/s).
- Higgsfield: API (key, USD balance, $5 min, /estimate) is the cloud path; MCP/CLI need browser sign-in and a paid
  web plan. 3-day trial reported: ~100 MCP-only credits, card required, auto-renews to Plus — cancel in time.
  Details: .claude/skills/professional-video-director/references/higgsfield.md
- HyperFrames (HeyGen): Apache-2.0 HTML→MP4, candidate alternative renderer.

## Client rules
Arabic replies · approval before any cost, upload, push, account/env change or big download · never change a
delivered video · 5 s test before full production · no unverified claims or invented people/speech.
