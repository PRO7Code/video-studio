# Edit (Remotion) — core/remotion

## Brand first
Every template reads the active brand (`brands/<id>/brand.json`) via `<BrandProvider id>` / `useBrand()`.
`resolveBrand` fills missing (null) values from `brands/studio`, so "needs-input" brands still render.
Review a brand with the media-free composition `Showcase-<id>`. Never invent a client's colours/logo.

## Library (`core/remotion/src/lib`)
| Component | Use |
|---|---|
| `Clip` | real footage: cover crop (`focus`), push-in zoom, speed-ramp segments, grading |
| `Words` | RTL kinetic Arabic per word (ligatures intact); Latin terms auto-get the brand gradient (`AI_Agent` keeps two words together) |
| `Kicker`, `Chip`, `DevBadge(label)` | chapter kicker, keyword pills, status badge (e.g. "قيد التطوير") |
| `Chapters` | story progress bar, acts in absolute frames |
| `HighlightBox` + `mapSourceToFrame` | point at something REAL in footage (slide title, UI element, product detail); tracks the zoom exactly |
| `FlowDiagram` | data-driven animated process/architecture diagram (nodes + edges + packets) |
| `Finish` | grade, vignette, legibility gradients, animated grain |
| `zoomBlur` | push-through transition |
| `SfxTrack` + `audio.ts` | cue sheet; `musicDuck`, `transitionCue` (whoosh −6 f), `popCue`, `tickCue`, `typingCues` |

## Compositions
`Ad` (timeline JSON, `brand` prop) · `RimadiLookTest` / `RimadiLookCompare` · `Showcase-<brand>`.

## Rules
- 1080×1920, 30 fps; safe zone top 250, bottom 1480, left 90, right 150.
- Fonts bundled locally (headless Chrome can't reach Google Fonts).
- `npx remotion still <id> out.jpg --frame=N --scale=0.4` before any full render.
- Never modify a delivered project's render path; projects keep their own code (projects/anan is frozen = delivered).
