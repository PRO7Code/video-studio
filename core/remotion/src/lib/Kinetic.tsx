import React from "react";
import { spring, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { arabic, latin } from "./theme";
import { useBrand, useInk, brandGradient, withAlpha } from "./brand";

/**
 * Timebase helpers: templates are timed in a 30-fps base so the same episode renders at 30 or 60 fps.
 * useT() = current time in base frames (fractional at 60 fps → smoother motion).
 */
export const BASE_FPS = 30;
export const useT = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (f * BASE_FPS) / fps;
};
export const springT = (t: number, at: number, config: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  spring({ frame: t - at, fps: BASE_FPS, config: { damping: 16, stiffness: 170, mass: 0.7, ...config } });
export const ease = (t: number, a: number, b: number, from = 0, to = 1, e = Easing.out(Easing.cubic)) =>
  interpolate(t, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
/** calculated motion blur: px of blur from the speed of a 0→1 spring (derivative estimated over 1 base frame) */
export const motionBlur = (t: number, at: number, travelPx: number, config?: Parameters<typeof springT>[2], max = 10) => {
  const v = Math.abs(springT(t, at, config) - springT(t - 1, at, config)) * travelPx;
  return Math.min(max, v * 0.18);
};

const isLatin = (w: string) => /[A-Za-z0-9]/.test(w) && !/[؀-ۿ]/.test(w);

/**
 * Kinetic text with inline emphasis (works for Arabic RTL and English LTR):
 *   *word*  → emphasis (brand primary, bold, pops)        ^word^ → marker sweep (brand secondary behind the word)
 *   "_" glues multi-word terms (LEF_Academy).  Words animate as whole words so Arabic ligatures stay intact.
 */
export const KineticText: React.FC<{
  text: string;
  t: number;
  at: number;
  size?: number;
  weight?: number;
  color?: string;
  align?: "start" | "center";
  dir?: "rtl" | "ltr";
  stagger?: number;
  lineHeight?: number;
  latinGradient?: boolean;
  fromScale?: number;
}> = ({ text, t, at, size = 80, weight = 700, color, align = "start", dir = "rtl", stagger = 3, lineHeight = 1.3, latinGradient = true, fromScale = 1.25 }) => {
  const b = useBrand();
  const ink = useInk();
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div style={{ direction: dir, display: "flex", flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", columnGap: size * 0.26, rowGap: size * 0.06, lineHeight, fontFamily: arabic, fontWeight: weight, fontSize: size, color: color ?? ink }}>
      {words.map((raw, i) => {
        const emph = /^\*.+\*[.,،؟?!:]*$/.test(raw);
        const mark = /^\^.+\^[.,،؟?!:]*$/.test(raw);
        const clean = raw.replace(/^[*^]|[*^](?=[.,،؟?!:]*$)/g, "").replace(/_/g, " ");
        const lat = isLatin(clean);
        const start = at + i * stagger;
        const p = springT(t, start, { damping: 15, stiffness: 190 });
        const blur = (1 - Math.min(1, p)) * 12;
        const sweep = ease(t, start + 6, start + 16);
        const pop = emph ? 1 + 0.1 * Math.sin(Math.PI * ease(t, start + 4, start + 14)) : 1;
        const style: React.CSSProperties = {
          display: "inline-block", position: "relative", unicodeBidi: "isolate", whiteSpace: "nowrap",
          opacity: Math.min(1, p * 1.4),
          transform: `translateY(${(1 - p) * size * 0.45}px) scale(${(fromScale - (fromScale - 1) * p) * pop})`,
          filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          ...(lat ? { fontFamily: latin, direction: "ltr", letterSpacing: -size * 0.015 } : {}),
          ...(emph ? { color: b.colors.primary, fontWeight: 800 } : {}),
        };
        const gradientLatin = lat && latinGradient && !emph && !color;
        return (
          <span key={i} style={style}>
            {mark ? <span style={{ position: "absolute", left: -size * 0.08, right: -size * 0.08, bottom: size * 0.08, height: size * 0.42, borderRadius: size * 0.1, background: withAlpha(b.colors.secondary, 0.28), transformOrigin: dir === "rtl" ? "right" : "left", transform: `scaleX(${sweep})` }} /> : null}
            <span style={{ position: "relative", ...(gradientLatin ? { backgroundImage: brandGradient(b), WebkitBackgroundClip: "text", color: "transparent" } : {}) }}>{clean}</span>
            {emph ? <span style={{ position: "absolute", left: 0, right: 0, bottom: size * 0.02, height: Math.max(3, size * 0.06), borderRadius: 3, background: b.colors.primary, transformOrigin: dir === "rtl" ? "right" : "left", transform: `scaleX(${sweep})` }} /> : null}
          </span>
        );
      })}
    </div>
  );
};
