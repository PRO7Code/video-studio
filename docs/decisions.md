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

## Phase 2 (core + brands) — 2026-11-14
- Proof of no loss: `projects/anan/thursday-reel` re-rendered from the repo is byte-identical to the delivered
  `anan-thursday-reel.mp4` (same file SHA-256, same decoded video/audio MD5, SSIM 1.0).
- Reusable parts of the Anan reel extracted into core (Chapters, HighlightBox, FlowDiagram, musicDuck, SFX cue rules);
  the Anan project itself is left untouched (frozen delivered code).
- Brand system: brands/<id>/brand.json; only `anan` has values (as used in the delivered reel). Others are
  "needs-input" until the owner provides colours, logo and tone.

## Phase 2 hardening + first template — 2026-11-14
- Brand registry is generated from brands/*/brand.json by scripts/brands.mjs (validation: id/folder, colour format,
  allowed keys, bundled fonts, "ready" needs core colours). Colour key `ink` renamed to `background`.
- All hard-coded colours removed from shared components (scrim/surface/ink derived from the brand).
- musicDuck rewritten without Remotion's interpolate: short ranges, zero-length/reversed ranges, overlaps (deepest
  level wins) and compositions shorter than the fade no longer throw.
- LEF brand set to draft: #0066CC primary, #FF6600 secondary/accent, #F8FAFC background (owner-provided, may change).
- STEP DECODE template (StepDecode composition) driven by episode JSON; sample is a studio-written practice question,
  labelled as such until the teacher reviews it.
