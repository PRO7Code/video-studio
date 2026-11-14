import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, arabic } from "../theme";
import { START, TOTAL } from "../timeline";

const ACTS = [
  { label: "الأفكار", from: START.ideas, to: START.mentor },
  { label: "النقاش", from: START.mentor, to: START.tech },
  { label: "المشروع", from: START.tech, to: START.outro },
];

/** Story progress bar at the top safe area (RTL: fills right → left). */
export const Chapters: React.FC = () => {
  const frame = useCurrentFrame();
  const vis = interpolate(
    frame,
    [START.ideas, START.ideas + 12, START.outro, START.outro + 12],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  if (vis <= 0 || frame > TOTAL) return null;
  return (
    <AbsoluteFill style={{ top: 190, height: 60, padding: "0 150px 0 90px", opacity: vis }}>
      <div style={{ direction: "rtl", display: "flex", gap: 12 }}>
        {ACTS.map((a) => {
          const p = interpolate(frame, [a.from, a.to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const active = frame >= a.from && frame < a.to;
          return (
            <div key={a.label} style={{ flex: 1 }}>
              <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
                <div style={{ width: `${p * 100}%`, height: "100%", background: C.teal, marginLeft: "auto" }} />
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: arabic,
                  fontSize: 22,
                  color: active ? C.white : "rgba(255,255,255,0.5)",
                }}
              >
                {a.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
