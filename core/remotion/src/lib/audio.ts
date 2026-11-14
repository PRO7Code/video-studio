import { interpolate } from "remotion";
import type { Cue } from "./SfxTrack";

/**
 * Music volume curve with ducking ranges (e.g. under speech or a "room sound" moment) and an end fade.
 * Returns a function for <Html5Audio volume={...}>. Proven settings from the Anan reel: base 1.0, duck 0.45, 12-frame ramps.
 */
export const musicDuck =
  (opts: { base?: number; ducks?: { from: number; to: number; level?: number }[]; total: number; fadeOut?: number; ramp?: number }) =>
  (f: number) => {
    const ramp = opts.ramp ?? 12;
    let v = 1;
    for (const d of opts.ducks ?? []) {
      const lvl = d.level ?? 0.45;
      v = Math.min(v, interpolate(f, [d.from, d.from + ramp, d.to - ramp, d.to], [1, lvl, lvl, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    }
    const tail = interpolate(f, [opts.total - (opts.fadeOut ?? 30), opts.total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (opts.base ?? 1) * v * tail;
  };

/**
 * SFX timing conventions (verified on the Anan reel):
 *  - whoosh (0.75 s, peak at 0.41 s) → cue 6 frames BEFORE the transition starts so the peak lands mid-transition
 *  - soft whoosh for fades → 5 frames before
 *  - pops/ticks → exactly on the element's animation delay
 */
export const transitionCue = (transitionStart: number, kind: "zoom" | "fade" = "zoom", volume = 0.32): Cue =>
  kind === "zoom" ? { at: transitionStart - 6, file: "whoosh", volume } : { at: transitionStart - 5, file: "whoosh-soft", volume: volume * 0.78 };
export const popCue = (at: number, volume = 0.2): Cue => ({ at, file: "pop", volume });
export const tickCue = (at: number, volume = 0.2): Cue => ({ at, file: "tick", volume });
export const typingCues = (from: number, chars: number, frames: number): Cue[] =>
  Array.from({ length: chars }, (_, i) => ({ at: from + Math.round((i * frames) / chars), file: `key${(i % 4) + 1}`, volume: 0.12 + ((i * 7) % 5) * 0.015 }));
