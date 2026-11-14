# Edit (Remotion)
- `core/remotion/src/AdTimeline.tsx`: data-driven ad. Put clips in `core/remotion/public/projects/<p>/` (git-ignored), write
  scenes in a props JSON, render: `npx remotion render Ad out.mp4 --props=projects/<p>/timeline.json`.
- Library: `Clip` (zoom, focus, speed-ramp segments), `Words` (RTL per-word kinetic, Latin tech terms gradient),
  `Chip`, `DevBadge`, `Finish` (grade, vignette, grain), `zoomBlur` transition, `SfxTrack`.
- Fonts bundled locally (headless Chrome can't reach Google Fonts here).
- Safe zone 1080×1920: top 250, bottom 1480, left 90, right 150.
- Check with `npx remotion still ... --frame=N --scale=0.4` before full renders.
