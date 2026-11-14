import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { arabic } from "./theme";
import { useBrand, useInk, withAlpha } from "./brand";

/** Story progress bar (RTL fill) – from the Anan reel. acts: absolute frames. */
export type Act = { label: string; from: number; to: number };
export const Chapters: React.FC<{ acts: Act[]; top?: number; fade?: number }> = ({ acts, top = 190, fade = 12 }) => {
  const frame = useCurrentFrame();
  const b = useBrand();
  const ink = useInk();
  const first = acts[0].from;
  const last = acts[acts.length - 1].to;
  const vis = interpolate(frame, [first, first + fade, last, last + fade], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (vis <= 0) return null;
  return (
    <AbsoluteFill style={{ top, height: 60, padding: "0 150px 0 90px", opacity: vis }}>
      <div style={{ direction: "rtl", display: "flex", gap: 12 }}>
        {acts.map((a) => {
          const p = interpolate(frame, [a.from, a.to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const active = frame >= a.from && frame < a.to;
          return (
            <div key={a.label} style={{ flex: 1 }}>
              <div style={{ height: 5, borderRadius: 3, background: withAlpha(ink, 0.22), overflow: "hidden" }}>
                <div style={{ width: `${p * 100}%`, height: "100%", background: b.colors.primary, marginLeft: "auto" }} />
              </div>
              <div style={{ marginTop: 8, fontFamily: arabic, fontSize: 22, color: active ? ink : withAlpha(ink, 0.5) }}>{a.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
