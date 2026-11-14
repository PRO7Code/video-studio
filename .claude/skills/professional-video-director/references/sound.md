# Sound
- Music: licensed track supplied by the user, or the original generator `tools/audio/compose_music.py` (edit section
  times to match cuts). Duck under speech/room moments.
- SFX: cue sheet on frames (`core/remotion/src/lib/SfxTrack.tsx`). Sources in order: user's licensed library → real-sfx
  (with a configured library) → real-sound sourcing (Freesound is blocked from cloud containers; Mixkit untested) →
  earshot bank (`sfx_render`) → `tools/audio/make_sfx.py`.
- Verify with earshot: `realness` for anything presented as "real", `timeline` for sync, `measure` for LUFS/dBTP.
  You cannot hear: report the numbers, ask the user to listen.
