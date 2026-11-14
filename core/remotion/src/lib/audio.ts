import type { Cue } from "./SfxTrack";

/** piecewise-linear lookup that tolerates equal/unsorted points (Remotion's interpolate throws on those) */
const lerpPts = (x: number, xs: number[], ys: number[]) => {
  if (x <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) {
      const span = xs[i] - xs[i - 1];
      return span <= 0 ? ys[i] : ys[i - 1] + ((x - xs[i - 1]) / span) * (ys[i] - ys[i - 1]);
    }
  }
  return ys[ys.length - 1];
};

export type Duck = { from: number; to: number; level?: number };

/** gain of one duck at frame f: ramps shrink automatically for short ranges (< 2 × ramp) */
export const duckGain = (f: number, d: Duck, ramp = 12) => {
  const from = Math.min(d.from, d.to), to = Math.max(d.from, d.to);
  const lvl = Math.max(0, Math.min(1, d.level ?? 0.45));
  if (to <= from) return 1;
  const r = Math.max(0, Math.min(ramp, (to - from) / 2));
  return lerpPts(f, [from, from + r, to - r, to], [1, lvl, lvl, 1]);
};

/**
 * Music volume curve: ducking ranges (speech, room-sound moments) + end fade. Overlapping ducks take the
 * deepest level (they don't multiply). Proven settings (Anan reel): base 1.0, duck 0.45, 12-frame ramps, 30-frame fade.
 */
export const musicDuck =
  (opts: { base?: number; ducks?: Duck[]; total: number; fadeOut?: number; ramp?: number }) =>
  (f: number) => {
    let v = 1;
    for (const d of opts.ducks ?? []) v = Math.min(v, duckGain(f, d, opts.ramp ?? 12));
    const fade = Math.max(0, Math.min(opts.fadeOut ?? 30, opts.total));
    const tail = fade === 0 ? (f >= opts.total ? 0 : 1) : lerpPts(f, [opts.total - fade, opts.total], [1, 0]);
    return Math.max(0, (opts.base ?? 1) * v * tail);
  };

/**
 * SFX timing conventions (verified on the Anan reel):
 *  - whoosh (0.75 s, peak 0.41 s) → cue 6 frames BEFORE the transition starts so the peak lands mid-transition
 *  - soft whoosh for fades → 5 frames before
 *  - pops/ticks → exactly on the element's animation delay
 * Cues never start before frame 0.
 */
export const transitionCue = (transitionStart: number, kind: "zoom" | "fade" = "zoom", volume = 0.32): Cue =>
  kind === "zoom"
    ? { at: Math.max(0, transitionStart - 6), file: "whoosh", volume }
    : { at: Math.max(0, transitionStart - 5), file: "whoosh-soft", volume: volume * 0.78 };
export const popCue = (at: number, volume = 0.2): Cue => ({ at: Math.max(0, at), file: "pop", volume });
export const tickCue = (at: number, volume = 0.2): Cue => ({ at: Math.max(0, at), file: "tick", volume });
export const typingCues = (from: number, chars: number, frames: number): Cue[] =>
  chars <= 0
    ? []
    : Array.from({ length: chars }, (_, i) => ({
        at: Math.max(0, from + Math.round((i * Math.max(0, frames)) / chars)),
        file: `key${(i % 4) + 1}`,
        volume: 0.12 + ((i * 7) % 5) * 0.015,
      }));
