import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { Words } from "./lib/Type";
import { Finish } from "./lib/Overlays";
import { C, arabic } from "./lib/theme";

/**
 * "Same gathering, the world changes": every look is generated from the SAME source take, so people, hands and the
 * box are continuous; we wipe between looks at the same source time (RTL light-wipe), the table never jumps.
 */
export type Look = { src: string; label: string };
export type LookTestProps = { looks: Look[]; segFrames: number; wipeFrames: number; showLabels: boolean };

const Layer: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </AbsoluteFill>
);

export const LookTest: React.FC<LookTestProps> = ({ looks, segFrames, wipeFrames, showLabels }) => {
  const f = useCurrentFrame();
  const idx = Math.min(looks.length - 1, Math.floor(f / segFrames));
  const local = f - idx * segFrames;
  const next = idx + 1 < looks.length ? idx + 1 : null;
  const wipeStart = segFrames - wipeFrames;
  const p =
    next !== null
      ? interpolate(local, [wipeStart, segFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.cubic),
        })
      : 0;
  // RTL: the new world enters from the right edge
  const edge = 100 - p * 100;
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <Layer src={looks[idx].src} />
      {next !== null && p > 0 ? (
        <>
          <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${edge}%)` }}>
            <Layer src={looks[next].src} />
          </AbsoluteFill>
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `calc(${edge}% - 3px)`,
              width: 6,
              background: "rgba(255,214,150,0.95)",
              boxShadow: "0 0 60px 24px rgba(255,190,110,0.55)",
            }}
          />
        </>
      ) : null}
      <Finish top={0.2} bottom={0.55} />
      {showLabels ? (
        <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 150px 470px 90px" }}>
          <Words key={idx} text={looks[idx].label} size={72} />
          <div style={{ fontFamily: arabic, color: C.muted, fontSize: 30, direction: "rtl", marginTop: 8 }}>
            {`اختبار بيئة · ${'٠١٢٣٤٥٦٧٨٩'[idx + 1]} من ${'٠١٢٣٤٥٦٧٨٩'[looks.length]}`}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/** Review grid: original + each look side by side, same frame, labelled. */
export const LookCompare: React.FC<{ original: string; looks: Look[] }> = ({ original, looks }) => {
  const all = [{ src: original, label: "الأصل" }, ...looks];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", display: "flex", flexWrap: "wrap" }}>
      {all.map((l) => (
        <div key={l.src} style={{ width: 540, height: 960, position: "relative", overflow: "hidden" }}>
          <OffthreadVideo src={staticFile(l.src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", top: 24, right: 24, padding: "8px 18px", borderRadius: 99, background: "rgba(0,0,0,0.6)", color: "#fff", fontFamily: arabic, fontSize: 30 }}>
            {l.label}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
